# Backup and Recovery Exercise

**Exercise date:** 2026-09-02  
**Environment:** Ephemeral non-production PGlite/PostgreSQL-compatible database  
**Scope:** Empty migration, representative governed data, physical snapshot, separate-target restore, integrity verification  
**Result:** PASS

## Procedure

1. Created a new empty database in an isolated temporary directory.
2. Applied every reviewed SQL migration in lexical order.
3. Seeded a tenant, actor, organization, verified evidence item, and linked audit event containing preserved JSON state.
4. Closed/quiesced the embedded database.
5. Copied the physical database into a separate backup directory.
6. Copied the backup into a distinct recovery target and opened that target independently.
7. Verified tenant-scoped row counts, evidence-to-audit linkage, identifiers, and restored JSON status.
8. Closed the recovery database and securely removed all temporary exercise artifacts.

## Observations

| Measure                                        |                         Result |
| ---------------------------------------------- | -----------------------------: |
| Backup snapshot                                |                         109 ms |
| Restore and integrity query                    |                         298 ms |
| Total test case including migrations and setup |                        1.708 s |
| Evidence records expected/restored             |                          1 / 1 |
| Audit events expected/restored                 |                          1 / 1 |
| Verified evidence/audit lineage                |                          1 / 1 |
| Observed data loss                             | 0 records at snapshot boundary |

These timings characterize only the tiny local exercise fixture. They are evidence that the procedure works, not production RTO/RPO promises. Production observations must be measured with representative volume, networked encrypted backup storage, and the deployed PostgreSQL version.

## Runbook corrections from the exercise

The [database runbook](db/README.md) now requires:

- closing/quiescing embedded storage before a physical snapshot;
- restoring only into a separate target rather than over the source;
- verifying foreign-key/lineage and JSON audit content in addition to row counts;
- using logical `pg_dump`/`pg_restore` for deployed PostgreSQL;
- recording checksums, encryption, access, backup age, recovery time, data loss, and cleanup;
- never copying a live PostgreSQL data directory.

## Limitations and residual risk

- PostgreSQL client binaries and a networked non-production server are unavailable in this workspace, so this exercise used PGlite physical storage rather than a custom-format `pg_dump` artifact.
- The exercise is a full local snapshot, not point-in-time recovery. Production RPO depends on backup frequency and WAL/PITR configuration.
- Encryption, remote object-storage permissions, scheduled backup monitoring, and larger-volume recovery remain deployment controls.
- A pilot-environment logical backup/restore exercise remains mandatory before TASK 122 can receive human approval.

## Reproducibility

Run:

`pnpm --filter @vai/database exec vitest run src/recovery.test.ts --reporter=verbose --disableConsoleIntercept`

The test creates and deletes its own isolated temporary directories and prints measured recovery observations.
