# Data-Governance Review

**Review date:** 2026-09-02  
**Policy baseline:** `DATA-GOVERNANCE.md` v0.2; `governance/0.1`  
**Result:** COMPLETE — operational deployment controls remain gated

## Enabled sources

`SOURCE-REGISTER.md` is the authoritative implementation register for this review. Manual entry and CSV import are enabled only with user attestation and provenance. CSV is governed by DEC-032. External connectors remain disabled under DEC-004/TASK 032, and AI providers remain disabled pending provider-specific data-processing approval. No review action here grants the outstanding source approval.

The `@vai/governance` policy rejects an unattested manual/CSV source and rejects all connector use while its source mode is disabled. Tests cover both boundaries.

## Retention controls

Versioned retention planning covers:

- raw imports: review/delete after the approved 30-day error-resolution window;
- business contacts: review/delete after 365 days from last activity/review;
- rejected raw payloads: review/redact/delete after 30 days while retaining minimal rejection metadata;
- audit events: retain for at least 730 days, then review rather than automatically destroy.

The control returns a due date and disposition; it never silently deletes. Tests verify a due raw import and a retained audit event. Background execution and deletion persistence remain deployment work because destructive handling requires an approved, auditable adapter.

## Export and deletion

New `data:export` and `data:delete` capabilities are restricted to administrators. Commercial owners and all lower roles are denied. Export requires a declared purpose and explicit filters. Deletion requires a reason and returns an auditable command that mandates an audit tombstone. Auth and governance tests cover denial and successful command creation.

No HTTP or database adapter executes these commands yet. Pilot readiness therefore requires adapter tests proving tenant filtering, audit insertion, safe cascades, operational-copy cleanup, and minimal-tombstone preservation.

## Logging review

- Pino redacts authorization/cookies and common password, token, refresh/access token, and client-secret keys.
- Fastify logs request metadata rather than request bodies.
- Audit metadata recursively redacts credentials, tokens, API keys, raw values, and raw records before persistence.
- API error envelopes do not expose internal exception text.

Residual risk: deployment telemetry exporters, reverse proxies, database statement logging, and support tooling must be reviewed with real configuration and representative sensitive fixtures.

## AI payload review

- Recommendation explanation sends only priority, action type, and bounded factor code/description pairs.
- Enrichment requires evidence IDs and validates every returned claim against provided evidence lineage.
- `minimizeAiPayload` removes direct name, email, phone, profile URL, relationship notes, raw value, and raw content keys before provider submission.
- AI providers remain disabled; deterministic operations and fallback explanations continue without them.

Residual risk: the minimizer is an application boundary and not a substitute for provider approval. Nested/unstructured content requires schema-specific allowlists before any provider is enabled. Provider DPA, region, retention, training-use, and deletion settings remain unapproved.

## Privacy and licensing risks

| Risk                                                                    | Severity before pilot | Required closure                                                           |
| ----------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| External-source terms and allowed fields not approved                   | High                  | Complete TASK 032 source record; keep connector disabled until then        |
| Retention executor and destructive adapter not implemented              | High                  | Add tenant-scoped dry-run/execution, audit, legal-hold, and recovery tests |
| Export/deletion adapters not implemented                                | High                  | Add authenticated API/database integration tests and review results        |
| AI provider governance not approved                                     | High if enabled       | Keep disabled; approve DPA/region/retention/training and payload schemas   |
| Contact lawful-purpose and attestation operations not deployment-tested | Medium                | Verify UI/API attestation capture and periodic review workflow             |
| Telemetry configuration not tested with production exporters            | Medium                | Run sensitive-value fixtures through deployed logs/traces                  |

## Test evidence

- Authorization: four tests pass, including admin-only export/deletion.
- Governance: four tests pass for source activation, retention, export/deletion, and AI minimization.
- Full repository verification: PASS after this review record and policy controls were added.

Task 120A may close because the review, source register, executable policy boundary, and residual-risk record are complete. It does not approve source activation, retention execution, pilot, or production.
