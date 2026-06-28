#!/usr/bin/env python3
"""
dagu - CLI wrapper around the Dagu REST API.

Usage:
    dagu ls [--name NAME]
    dagu get <dag>
    dagu create <dag> [--spec FILE]
    dagu delete <dag>
    dagu start <dag> [--params KEY=VAL ...] [--run-id ID]
    dagu stop <dag> <run-id>
    dagu retry <dag> <run-id> [--run-id NEW_ID]
    dagu status <dag> [<run-id>]
    dagu runs <dag>

Configuration (env or ~/.dagu.env):
    DAGU_BASE_URL   default: http://localhost:12000
    DAGU_API_KEY    Bearer token
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def load_env_file():
    """Load ~/.dagu.env if it exists."""
    p = Path.home() / ".dagu.env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


load_env_file()

BASE_URL = os.environ.get("DAGU_BASE_URL", "http://localhost:12000").rstrip("/")
API_KEY  = os.environ.get("DAGU_API_KEY", "")


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _headers(extra=None):
    h = {"Accept": "application/json", "Content-Type": "application/json"}
    if API_KEY:
        h["Authorization"] = f"Bearer {API_KEY}"
    if extra:
        h.update(extra)
    return h


def _req(method, path, body=None):
    url = f"{BASE_URL}/api/v1{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=_headers(), method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        raw = resp.read()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            err = json.loads(raw)
            msg = err.get("message", str(err))
        except Exception:
            msg = raw.decode(errors="replace")
        print(f"error {e.code}: {msg}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"connection error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def get(path):    return _req("GET",    path)
def post(path, body=None): return _req("POST",   path, body)
def patch(path, body=None): return _req("PATCH",  path, body)
def delete(path): return _req("DELETE", path)
def put(path, body=None): return _req("PUT",    path, body)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def out(obj):
    print(json.dumps(obj, indent=2))


def table(rows, cols):
    widths = [max(len(str(r.get(c, ""))) for r in [{"**": c}] + rows) for c in cols]
    fmt = "  ".join(f"{{:<{w}}}" for w in widths)
    print(fmt.format(*cols))
    print(fmt.format(*("-" * w for w in widths)))
    for r in rows:
        print(fmt.format(*[str(r.get(c, "")) for c in cols]))


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_ls(args):
    params = []
    if args.name:
        params.append(f"name={args.name}")
    if args.label:
        params.append(f"labels={args.label}")
    qs = "?" + "&".join(params) if params else ""
    data = get(f"/dags{qs}")
    dags = data.get("dags", [])
    rows = []
    for d in dags:
        dag = d.get("dag", {})
        run = d.get("latestDAGRun", {})
        rows.append({
            "name":    dag.get("name", ""),
            "status":  run.get("statusLabel", ""),
            "started": run.get("startedAt", "")[:19] if run.get("startedAt") else "",
            "errors":  str(len(d.get("errors", []))),
        })
    table(rows, ["name", "status", "started", "errors"])


def cmd_get(args):
    out(get(f"/dags/{args.dag}"))


def cmd_create(args):
    body = {"name": args.dag}
    if args.spec:
        body["spec"] = Path(args.spec).read_text()
    out(post("/dags", body))


def cmd_delete(args):
    delete(f"/dags/{args.dag}")
    print(f"deleted {args.dag}")


def cmd_start(args):
    body = {}
    if args.params:
        # params expected as KEY=VAL pairs → JSON object string
        p = {}
        for kv in args.params:
            k, _, v = kv.partition("=")
            p[k] = v
        body["params"] = json.dumps(p)
    if args.run_id:
        body["dagRunId"] = args.run_id
    out(post(f"/dags/{args.dag}/start", body))


def cmd_stop(args):
    post(f"/dag-runs/{args.dag}/{args.run_id}/stop")
    print(f"stopped {args.dag}/{args.run_id}")


def cmd_retry(args):
    body = {}
    if args.new_run_id:
        body["dagRunId"] = args.new_run_id
    out(post(f"/dag-runs/{args.dag}/{args.run_id}/retry", body))


def cmd_status(args):
    if args.run_id:
        # GET /dag-runs/{name}/{dagRunId} → {dagRunDetails: {...}}
        data = get(f"/dag-runs/{args.dag}/{args.run_id}")
        out(data.get("dagRunDetails", data))
    else:
        data = get(f"/dags/{args.dag}")
        run = data.get("latestDAGRun", data.get("dag", {}))
        out(run)


def cmd_runs(args):
    # GET /dags/{fileName}/dag-runs → {dagRuns, gridData}
    data = get(f"/dags/{args.dag}/dag-runs")
    runs = data.get("dagRuns", [])
    if not runs:
        # fallback: GET /dag-runs/{name} → {dagRuns, nextCursor}
        runs = get(f"/dag-runs/{args.dag}").get("dagRuns", [])
    rows = []
    for r in runs:
        rows.append({
            "run_id":  r.get("dagRunId", r.get("runId", "")),
            "status":  r.get("statusLabel", ""),
            "started": r.get("startedAt", "")[:19] if r.get("startedAt") else "",
            "finished": r.get("finishedAt", "")[:19] if r.get("finishedAt") else "",
        })
    if rows:
        table(rows, ["run_id", "status", "started", "finished"])
    else:
        print("no runs found")


# ---------------------------------------------------------------------------
# CLI wiring
# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(
        prog="dagu",
        description="CLI wrapper for the Dagu REST API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    # ls
    s = sub.add_parser("ls", help="list DAGs")
    s.add_argument("--name",  help="filter by name")
    s.add_argument("--label", help="filter by label")
    s.set_defaults(func=cmd_ls)

    # get
    s = sub.add_parser("get", help="get DAG details")
    s.add_argument("dag")
    s.set_defaults(func=cmd_get)

    # create
    s = sub.add_parser("create", help="create a DAG")
    s.add_argument("dag", help="DAG name")
    s.add_argument("--spec", help="YAML spec file path")
    s.set_defaults(func=cmd_create)

    # delete
    s = sub.add_parser("delete", help="delete a DAG")
    s.add_argument("dag")
    s.set_defaults(func=cmd_delete)

    # start
    s = sub.add_parser("start", help="start a DAG run")
    s.add_argument("dag")
    s.add_argument("--params", nargs="*", metavar="KEY=VAL", help="run parameters")
    s.add_argument("--run-id", dest="run_id", help="custom run ID")
    s.set_defaults(func=cmd_start)

    # stop
    s = sub.add_parser("stop", help="stop a running DAG run")
    s.add_argument("dag")
    s.add_argument("run_id", metavar="run-id")
    s.set_defaults(func=cmd_stop)

    # retry
    s = sub.add_parser("retry", help="retry a DAG run")
    s.add_argument("dag")
    s.add_argument("run_id", metavar="run-id")
    s.add_argument("--run-id", dest="new_run_id", help="new run ID for the retry")
    s.set_defaults(func=cmd_retry)

    # status
    s = sub.add_parser("status", help="get run status")
    s.add_argument("dag")
    s.add_argument("run_id", metavar="run-id", nargs="?")
    s.set_defaults(func=cmd_status)

    # runs
    s = sub.add_parser("runs", help="list recent runs for a DAG")
    s.add_argument("dag")
    s.set_defaults(func=cmd_runs)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
