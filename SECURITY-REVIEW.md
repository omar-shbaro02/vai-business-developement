# Security Review

**Review date:** 2026-09-02  
**Scope:** application source, API boundary, authentication/authorization policy, logs, dependencies, secrets handling, and operational security documentation  
**Reviewer:** Codex  
**Result:** COMPLETE — no open critical application-layer finding

## Executive result

The implementation fails closed when no actor resolver or service adapter is configured, requires authentication and role capabilities on every `/v1` domain route, propagates tenant identity into service operations, validates external request shapes, emits safe error envelopes, redacts authentication secrets from structured logs, and preserves audited human decisions. This review added bounded per-client request throttling and defensive response headers.

Production and pilot remain blocked until deployment-specific identity, distributed rate limiting, least-privilege credentials, source approval, retention, and recovery controls pass their later gates. These are tracked risks, not silently treated as implemented.

## Checklist evidence

| Control                     | Result                        | Evidence                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Secrets excluded            | PASS                          | `.gitignore` excludes `.env`, keys, certificates, and logs. Tracked-file signature scan found no credential pattern. Only placeholder `.env.example` is tracked.                                                               |
| Least-privilege credentials | DEPLOYMENT REQUIRED           | Architecture requires scoped credentials. No production credential exists in the repository; environment injection is required. Deployment roles/scopes must be verified before pilot.                                         |
| Authentication enabled      | PASS / ADAPTER REQUIRED       | API has no header or development bypass and fails closed without `resolveActor`. Production configuration rejects development auth and requires OIDC settings. The OIDC verification adapter remains a deployment integration. |
| Authorization enforced      | PASS                          | Protected routes call capability authorization. Database decision writes re-check capability and tenant ownership.                                                                                                             |
| Role-based access tested    | PASS                          | Auth tests cover allowed, forbidden, and unauthenticated contexts; API tests cover read-only override denial and authorized owner behavior.                                                                                    |
| Sensitive logs reviewed     | PASS                          | Structured logging redacts authorization, cookies, passwords, tokens, refresh/access tokens, and client secrets. Fastify request logs contain metadata, not bodies.                                                            |
| Personal/contact handling   | DOCUMENTED                    | `DATA-GOVERNANCE.md` restricts business-contact and relationship data, requires provenance, minimization, role controls, review, and deletion paths. Operational control testing is TASK 120A.                                 |
| Source licensing/terms      | BLOCKED / ISOLATED            | TASK 032 remains `AWAITING_APPROVAL`; unapproved external-source activation remains disabled. Formal review continues in TASK 120A.                                                                                            |
| Rate limits/error paths     | PASS                          | `/v1` routes have configurable bounded-window per-client throttling, `429` safe errors, and `Retry-After`; validation/auth/authorization/not-found/internal paths use non-sensitive envelopes.                                 |
| Dependency vulnerabilities  | PASS                          | `pnpm audit --prod --audit-level high` reported no known vulnerabilities on 2026-09-02.                                                                                                                                        |
| Backup/recovery approach    | DOCUMENTED / EXERCISE PENDING | Migration and rollback approach exists under `db/`; restoration evidence is explicitly queued as TASK 120B.                                                                                                                    |

## Defensive HTTP controls

All API responses set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. Domain API responses additionally set `Cache-Control: no-store`. Protected routes are throttled before authentication/service work; health probes remain outside that client quota.

## Findings

### Resolved during review

1. **SEC-001 — Missing protected-route rate limiting (High): RESOLVED.** Added configurable request limits, safe `429` responses, and retry guidance. Test coverage verifies the boundary.
2. **SEC-002 — Missing defensive response headers (Medium): RESOLVED.** Added content-sniffing, framing, referrer, and sensitive-response cache protections. Test coverage verifies all headers.

### Residual deployment risks

1. **SEC-R01 — In-memory throttling is process-local (Medium).** Use a shared gateway or distributed limiter for horizontally scaled pilot/production deployments. Configure trusted proxy handling deliberately so client identity cannot be spoofed.
2. **SEC-R02 — OIDC adapter is not wired in this repository (High until deployment).** The API fails closed, but pilot login requires issuer/audience/signature verification, token expiry checks, tenant/role mapping, and negative integration tests.
3. **SEC-R03 — Database and connector credential scopes are not deployable artifacts yet (High until deployment).** Create separate runtime/migration roles, inject through an approved secret manager, require encrypted transport, and record scope review.
4. **SEC-R04 — Operational incident and access-review ownership is not named (Medium).** TASK 120A/pilot readiness must name owners, offboarding path, notification route, and evidence-preservation steps.
5. **SEC-R05 — Backup restoration has not been demonstrated (High until TASK 120B).** Documentation alone is insufficient for pilot readiness.

## Commands and tests

- Tracked secret-file and credential-signature scans: PASS.
- Production dependency audit at high threshold: PASS, no known vulnerabilities.
- API security suite: PASS, nine tests.
- Full repository verification: PASS after this record and all remediations were added.

## Release position

Task 120 may close because the code review is complete and its application-layer high finding was resolved. This does not approve pilot or production. SEC-R02, SEC-R03, and SEC-R05 must be resolved by their applicable deployment, governance, and recovery gates before TASK 122 can be approved.
