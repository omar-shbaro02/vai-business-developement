import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);
const tenantId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";
const organizationId = "00000000-0000-4000-8000-000000000003";
const evidenceId = "00000000-0000-4000-8000-000000000004";
const auditId = "00000000-0000-4000-8000-000000000005";

async function migrate(database: PGlite) {
  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files)
    await database.exec(
      await readFile(resolve(migrationsDirectory, file), "utf8"),
    );
  return files.length;
}

describe("non-production backup and recovery", () => {
  it("migrates empty storage, restores a physical backup, and preserves governed history", async () => {
    const exerciseRoot = await mkdtemp(join(tmpdir(), "vai-recovery-"));
    const sourcePath = join(exerciseRoot, "source"),
      backupPath = join(exerciseRoot, "backup"),
      restorePath = join(exerciseRoot, "restore");
    let source: PGlite | undefined, restored: PGlite | undefined;
    try {
      source = new PGlite(`file://${sourcePath}`);
      expect(await migrate(source)).toBeGreaterThan(0);
      await source.exec(`
        insert into tenants(id,name) values ('${tenantId}','Recovery tenant');
        insert into actors(id,tenant_id,external_subject,display_name) values ('${actorId}','${tenantId}','recovery-user','Recovery User');
        insert into organizations(id,tenant_id,legal_name,display_name,source_type,source_reference,created_by)
          values ('${organizationId}','${tenantId}','Recovery Example LLC','Recovery Example','MANUAL','exercise','${actorId}');
        insert into evidence_items(id,tenant_id,organization_id,source_type,source_reference,captured_at,evidence_type,raw_value,confidence,freshness,verification_status,created_by)
          values ('${evidenceId}','${tenantId}','${organizationId}','MANUAL','exercise','2026-09-02T07:00:00Z','RECOVERY_FIXTURE','{"value":"preserved"}','HIGH','CURRENT','VERIFIED','${actorId}');
        insert into audit_events(id,tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,before,after,metadata)
          values ('${auditId}','${tenantId}','${actorId}','EVIDENCE_VERIFIED','evidence','${evidenceId}','2026-09-02T07:01:00Z','recovery-request','exercise',null,'{"status":"VERIFIED"}','{"exercise":true}');
      `);
      await source.close();
      source = undefined;
      const backupStarted = performance.now();
      await cp(sourcePath, backupPath, { recursive: true });
      const backupMs = performance.now() - backupStarted;
      const restoreStarted = performance.now();
      await cp(backupPath, restorePath, { recursive: true });
      restored = new PGlite(`file://${restorePath}`);
      const integrity = await restored.query<{
        evidence_count: number;
        audit_count: number;
        verified_count: number;
      }>(`
        select
          (select count(*)::int from evidence_items where tenant_id='${tenantId}') evidence_count,
          (select count(*)::int from audit_events where tenant_id='${tenantId}') audit_count,
          (select count(*)::int from audit_events a join evidence_items e on e.id=a.resource_id
            where a.id='${auditId}' and e.id='${evidenceId}' and a.after->>'status'='VERIFIED') verified_count
      `);
      const recoveryMs = performance.now() - restoreStarted;
      expect(integrity.rows[0]).toEqual({
        evidence_count: 1,
        audit_count: 1,
        verified_count: 1,
      });
      expect(backupMs).toBeGreaterThanOrEqual(0);
      expect(recoveryMs).toBeGreaterThanOrEqual(0);
      console.info(
        JSON.stringify({
          exercise: "backup-recovery",
          backupMs: Math.round(backupMs),
          recoveryMs: Math.round(recoveryMs),
          restoredEvidence: integrity.rows[0]?.evidence_count,
          restoredAuditEvents: integrity.rows[0]?.audit_count,
          observedDataLoss: 0,
        }),
      );
    } finally {
      await source?.close();
      await restored?.close();
      await rm(exerciseRoot, { recursive: true, force: true });
    }
  }, 30_000);
});
