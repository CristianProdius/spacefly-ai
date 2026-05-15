# Audit Results

This folder stores result files produced by Orca-managed Codex workers following `docs/product-audit-orca-worktree-plan.md`.

Each phase must create one file named `phase-<n>-<scope>.md` and use this structure:

```md
# <Phase Name> Audit Results

## Checks Run
- `<command>`: pass/fail and important output summary

## Fixes Applied
- Files changed and why

## Findings
- `P1` Title
  - Area:
  - Evidence:
  - Reproduction:
  - Recommendation:

## Follow-Up Recommendations
- Ranked next actions

## Files Reviewed
- Paths inspected
```

Priority labels:

- `P0`: Production-breaking issue, data loss, security/auth bypass, or inability to deploy.
- `P1`: Broken core user flow or major user-facing regression.
- `P2`: Medium bug, confusing UX, missing validation, brittle behavior, or important missing test.
- `P3`: Cleanup, polish, performance, maintainability, or documentation improvement.

