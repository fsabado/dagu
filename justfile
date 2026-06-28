# ~/src/dagu/justfile
# Manage the local Dagu instance and CLI wrapper.
#
# Env: DAGU_PORT      port the server listens on (default: 12000)
#      DAGU_BASE_URL  full URL override (default: http://localhost:$DAGU_PORT)
#      DAGU_API_KEY   (loaded from ~/studio/linux-env/secrets.env)

set dotenv-load := false
set shell := ["bash", "-euo", "pipefail", "-c"]

port      := env_var_or_default("DAGU_PORT", "12000")
dagu_url  := env_var_or_default("DAGU_BASE_URL", "http://localhost:" + port)
secrets   := env_var_or_default("SECRETS_ENV", env_var("HOME") + "/studio/linux-env/secrets.env")
cli       := env_var("HOME") + "/src/dagu/dagu.py"

# Show available recipes
default:
    @just --list

# ── Server ──────────────────────────────────────────────────────────────────

# Start the dagu server (background, port from $DAGU_PORT, default 12000)
start:
    @if pgrep -x dagu > /dev/null; then \
        echo "dagu already running on port {{port}}"; \
    else \
        echo "Starting dagu on port {{port}}..."; \
        source {{secrets}} && \
        DAGU_BASE_URL={{dagu_url}} \
        nohup dagu start-all --host=0.0.0.0 --port {{port}} \
            > /tmp/dagu-server.log 2>&1 & \
        sleep 1; \
        just status-server; \
    fi

# Stop all dagu processes
stop:
    @echo "Stopping dagu..."
    @pkill -f 'dagu start-all\|dagu server\|dagu scheduler' && echo "stopped" || echo "no dagu processes running"

# Restart the server
restart: stop
    @sleep 1
    @just start

# Show server process status
status-server:
    @ps aux | grep 'dagu start-all\|dagu server' | grep -v grep \
        && echo "server running on port {{port}}" \
        || echo "server not running"

# Tail server log
logs:
    tail -f /tmp/dagu-server.log

# ── DAG management ──────────────────────────────────────────────────────────

# List all DAGs
ls *args="":
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} ls {{args}}

# Get DAG details (json)
get dag:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} get {{dag}}

# Create a DAG from a YAML file: just create my-dag ./path/to/dag.yaml
create dag spec:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} create {{dag}} --spec {{spec}}

# Delete a DAG
delete dag:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} delete {{dag}}

# ── DAG execution ────────────────────────────────────────────────────────────

# Start a DAG run: just run no-mistakes REPO_DIR=/path BRANCH=feature/x
run dag *params="":
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} start {{dag}} \
        {{ if params != "" { "--params " + params } else { "" } }}

# Start the no-mistakes DAG for a given repo + branch
nm repo branch:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} start no-mistakes \
        --params REPO_DIR={{repo}} BRANCH={{branch}}

# Stop a running DAG run: just stop-run no-mistakes <run-id>
stop-run dag run_id:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} stop {{dag}} {{run_id}}

# Retry a DAG run: just retry no-mistakes <run-id>
retry dag run_id:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} retry {{dag}} {{run_id}}

# ── Status & history ─────────────────────────────────────────────────────────

# Get latest run status for a DAG
status dag:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} status {{dag}}

# Get status for a specific run: just run-status no-mistakes <run-id>
run-status dag run_id:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} status {{dag}} {{run_id}}

# List recent runs for a DAG
runs dag:
    source {{secrets}} && DAGU_BASE_URL={{dagu_url}} python3 {{cli}} runs {{dag}}

# ── no-mistakes DAG lifecycle ────────────────────────────────────────────────

# Install (symlink) the no-mistakes DAG into ~/.dagu/dags/
install-dag:
    @NM=~/src/no-mistakes/dags/no-mistakes.yaml; \
    [ -f "$$NM" ] || NM=/mnt/custom-file-systems/efs/fs-04bf86d02daf87e14/src/no-mistakes/dags/no-mistakes.yaml; \
    ln -sf "$$NM" ~/.dagu/dags/no-mistakes.yaml && \
    echo "linked: $$NM → ~/.dagu/dags/no-mistakes.yaml"

# Remove the no-mistakes DAG symlink
uninstall-dag:
    rm -f ~/.dagu/dags/no-mistakes.yaml && echo "unlinked"

# ── Development ──────────────────────────────────────────────────────────────

# Build the dagu binary
build:
    make bin

# Run all Go tests
test:
    make test

# Run frontend dev server (port 8081)
ui:
    cd ui && pnpm install && pnpm dev

# Format Go code
fmt:
    make fmt

# Lint
lint:
    make lint
