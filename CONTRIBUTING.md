# Contributing

## Prerequisites

- Node.js 22.x
- pnpm 11.21.0
- PostgreSQL (required after the data-foundation phase)

Use `npm exec --yes pnpm@11.21.0 -- <command>` if pnpm is not installed globally.

## Local verification

1. Copy `.env.example` to `.env` and replace placeholder values. Never commit `.env`.
2. Install with `npm exec --yes pnpm@11.21.0 -- install --frozen-lockfile` after the lockfile exists.
3. Run `npm exec --yes pnpm@11.21.0 -- verify` before handing off a change.

Do not begin a task unless its dependencies and human gates in `PROJECT-TASKS.md` are complete. Record acceptance evidence in `TASK-LOG.md`.
