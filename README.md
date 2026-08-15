# VAI Business Development Intelligence

A governed, acceptance-driven implementation blueprint for building VAI Business Development Intelligence.

**Current stage:** Stage 1 specification package approved; engineering foundation implementation authorized.

## Engineering quick start

The approved foundation uses Node.js 22 and pnpm 11.21.0. If pnpm is not installed globally, prefix commands with `npm exec --yes pnpm@11.21.0 --`.

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm dev
```

- Web workspace: `apps/web`
- HTTP API and health endpoints: `apps/api`
- Background worker: `apps/worker`
- Shared contracts/domain/configuration/observability: `packages/*`
- CI: `.github/workflows/ci.yml`

This repository follows the delivery method used successfully on the VAI FMCG project:

- freeze product identity before implementation;
- separate evidence from inference;
- prefer deterministic rules and typed contracts for reproducible decisions;
- place AI behind explicit validated boundaries;
- stop at human approval gates;
- require tests and acceptance evidence before tasks are marked complete;
- preserve an exact handoff state across developers, machines, and Codex sessions.

## Start here

1. Review and complete `PROJECT-SPEC.md`.
2. Review every proposed choice in `DECISION-REGISTER.md`.
3. Review `DOMAIN-LIFECYCLES.md` and `DATA-GOVERNANCE.md`.
4. Review and approve `PRODUCT-CANON.md`, `OUTPUT-CONTRACT.md`, and the architecture decision records.
5. Execute `PROJECT-TASKS.md` in order unless a dependency change is explicitly approved.
6. Append implementation evidence to `TASK-LOG.md`.
7. Run `QUALITY-AND-RELEASE.md` before pilot or production readiness is claimed.
8. Update `HANDOFF.md` whenever work moves between people, machines, branches, or sessions.

## File map

| File                     | Purpose                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `PROJECT-SPEC.md`        | Single source for project-specific facts and requirements.                   |
| `PRODUCT-CANON.md`       | Frozen product identity, users, decisions, scope, and boundaries.            |
| `ARCHITECTURE.md`        | Runtime system boundaries, components, data flow, and constraints.           |
| `OUTPUT-CONTRACT.md`     | Required outputs, schemas, states, and prohibited claims.                    |
| `DECISION-REGISTER.md`   | Explicit proposed, approved, deferred, and superseded MVP decisions.         |
| `DOMAIN-LIFECYCLES.md`   | Allowed state transitions and actor boundaries.                              |
| `DATA-GOVERNANCE.md`     | Source approval, data classes, access, retention, AI handling, and deletion. |
| `PROJECT-TASKS.md`       | Ordered implementation backlog and human approval gates.                     |
| `TASK-LOG.md`            | Evidence-backed completion record for every task.                            |
| `REVIEW-WORKSPACES.md`   | Read-only specialist review roles and responsibilities.                      |
| `QUALITY-AND-RELEASE.md` | Testing, security, reliability, deployment, and release gates.               |
| `HANDOFF.md`             | Exact continuation state for another developer or Codex session.             |
| `docs/decisions/`        | Architecture decision records.                                               |

## Status vocabulary

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `AWAITING_APPROVAL`
- `COMPLETE`
- `SUPERSEDED`
