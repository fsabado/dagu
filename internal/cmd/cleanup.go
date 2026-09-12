// Copyright (C) 2026 Yota Hamada
// SPDX-License-Identifier: GPL-3.0-or-later

package cmd

import (
	"fmt"
	"strconv"

	"github.com/spf13/cobra"
)

// Cleanup creates and returns a cobra command for removing old DAG run history.
// Deprecated: prefer `dagu rm --history`. Kept as a compatibility alias.
func Cleanup() *cobra.Command {
	return NewCommand(
		&cobra.Command{
			Use:   "cleanup [flags] <DAG name>",
			Short: "Remove old DAG run history (deprecated: use 'rm --history')",
			Long: `Remove old DAG run history for a specified DAG.

Deprecated: prefer 'dagu rm --history' (or 'dagu rm -H').

By default, removes all history except for currently active runs.
Use --retention-days to keep recent history.

Active runs are never deleted for safety.

Examples:
  dagu cleanup my-workflow                      # Delete all history (with confirmation)
  dagu cleanup --retention-days 30 my-workflow  # Keep last 30 days
  dagu cleanup --dry-run my-workflow            # Preview what would be deleted
  dagu cleanup -y my-workflow                   # Skip confirmation

Equivalent with rm:
  dagu rm -H my-workflow
  dagu rm -H -t 30d my-workflow
`,
			Args: cobra.ExactArgs(1),
		},
		cleanupFlags,
		runCleanup,
	)
}

var cleanupFlags = []commandLineFlag{
	retentionDaysFlag,
	dryRunFlag,
	yesFlag,
}

func runCleanup(ctx *Context, args []string) error {
	dagName, err := extractDAGName(ctx, args[0])
	if err != nil {
		return fmt.Errorf("failed to extract DAG name: %w", err)
	}

	retentionStr, err := ctx.StringParam("retention-days")
	if err != nil {
		return fmt.Errorf("failed to get retention-days: %w", err)
	}
	retentionDays, err := strconv.Atoi(retentionStr)
	if err != nil {
		return fmt.Errorf("invalid retention-days value %q: must be a non-negative integer", retentionStr)
	}
	if retentionDays < 0 {
		return fmt.Errorf("retention-days cannot be negative (got %d)", retentionDays)
	}

	dryRun, _ := ctx.Command.Flags().GetBool("dry-run")
	skipConfirm, _ := ctx.Command.Flags().GetBool("yes")

	return executeRm(ctx, rmOptions{
		dagName:       dagName,
		deleteHist:    true,
		retentionDays: &retentionDays,
		dryRun:        dryRun,
		skipConfirm:   skipConfirm || ctx.Quiet,
	})
}
