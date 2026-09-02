# Database migrations

PostgreSQL is the source of truth. The TypeScript schema is in `packages/database/src/schema.ts`; reviewed SQL migrations are stored in `db/migrations`.

Generate a migration with `pnpm --filter @vai/database db:generate`, review the SQL, then apply it by setting `DATABASE_URL` and running `pnpm --filter @vai/database db:migrate`.

## Rollback

Migrations are forward-only in automated environments. Before a production migration, take and verify a PostgreSQL backup. To roll back this initial migration in a disposable environment, apply `db/migrations/rollback/0000_rollback.sql`. In a persistent environment, restore the pre-migration backup; do not drop governed data in place. Later migrations must include a reviewed rollback or an explicit restore/forward-fix procedure.

## Backup and recovery runbook

For PostgreSQL pilot/production, use a logical custom-format backup created with a compatible PostgreSQL client and encrypted storage. Never place credentials in the command or backup filename.

1. Record environment, database version, migration/commit identifier, backup start time, and responsible operator.
2. Create a backup: `pg_dump --format=custom --no-owner --no-acl --file "$BACKUP_PATH" "$DATABASE_URL"`.
3. Verify the exit status, nonzero artifact size, checksum, encryption, restricted access, and retention label.
4. Provision a separate non-production recovery database. Never rehearse over the source database.
5. Restore: `pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl --dbname "$RECOVERY_DATABASE_URL" "$BACKUP_PATH"`.
6. Run migration-status checks, row-count reconciliation, foreign-key checks, and critical audit/decision lineage queries.
7. Record recovery time, backup age at the recovery point, observed data loss, errors, and corrective actions. Destroy the recovery environment and backup copy according to policy.

The automated non-production exercise uses a closed PGlite physical snapshot because PostgreSQL client binaries are not part of the development environment. The exercise revealed three mandatory runbook controls: quiesce/close embedded storage before a physical copy, restore only into a distinct target, and verify governed record relationships and JSON history—not row counts alone. Production uses `pg_dump`/`pg_restore`; copying a live PostgreSQL data directory is prohibited.
