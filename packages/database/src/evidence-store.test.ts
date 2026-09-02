import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceStore, type CreateEvidenceInput } from "./evidence-store.js";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);
const ids = {
  tenant: "10000000-0000-4000-8000-000000000001",
  actor: "10000000-0000-4000-8000-000000000002",
  organization: "10000000-0000-4000-8000-000000000003",
  import: "10000000-0000-4000-8000-000000000004",
};

function poolAdapter(database: PGlite) {
  const query = async (text: string, parameters?: unknown[]) => {
    const result = await database.query(text, parameters);
    return {
      ...result,
      rowCount: result.rows.length || result.affectedRows || 0,
    };
  };
  return { query, connect: async () => ({ query, release: () => undefined }) };
}

async function prepare(): Promise<{ database: PGlite; store: EvidenceStore }> {
  const database = new PGlite();
  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files)
    await database.exec(
      await readFile(resolve(migrationsDirectory, file), "utf8"),
    );
  await database.query("insert into tenants (id,name) values ($1,'VAI')", [
    ids.tenant,
  ]);
  await database.query(
    "insert into actors (id,tenant_id,external_subject,display_name) values ($1,$2,'reviewer','Reviewer')",
    [ids.actor, ids.tenant],
  );
  await database.query(
    "insert into organizations (id,tenant_id,legal_name,display_name,source_type,created_by) values ($1,$2,'Example LLC','Example','MANUAL',$3)",
    [ids.organization, ids.tenant, ids.actor],
  );
  return { database, store: new EvidenceStore(poolAdapter(database) as never) };
}

function input(
  overrides: Partial<CreateEvidenceInput> = {},
): CreateEvidenceInput {
  return {
    origin: "SOURCE",
    tenantId: ids.tenant,
    organizationId: ids.organization,
    opportunityId: null,
    sourceType: "CSV_IMPORT",
    sourceReference: "accounts.csv",
    sourceRecordId: "row-7",
    importId: ids.import,
    capturedAt: "2026-08-31T10:00:00.000Z",
    observedAt: "2026-08-30T10:00:00.000Z",
    evidenceType: "EMPLOYEE_COUNT",
    rawValue: { employees: "42" },
    normalizedValue: { employees: 42 },
    confidence: "MEDIUM",
    freshness: "CURRENT",
    actorId: ids.actor,
    requestId: "request-evidence-1",
    ...overrides,
  };
}

describe("evidence store", () => {
  let database: PGlite | undefined;
  afterEach(async () => database?.close());

  it("retains source lineage and timestamps through governed verification and staleness", async () => {
    const prepared = await prepare();
    database = prepared.database;
    const evidenceId = await prepared.store.create(input());
    const captured = await database.query<{
      source_reference: string;
      source_record_id: string;
      import_id: string;
      captured_at: Date;
      observed_at: Date;
      verification_status: string;
    }>(
      "select source_reference,source_record_id,import_id,captured_at,observed_at,verification_status from evidence_items where id=$1",
      [evidenceId],
    );
    expect(captured.rows[0]).toMatchObject({
      source_reference: "accounts.csv",
      source_record_id: "row-7",
      import_id: ids.import,
      verification_status: "RAW",
    });

    const command = {
      tenantId: ids.tenant,
      evidenceId,
      actorId: ids.actor,
      requestId: "request-review",
      reason: "Source record inspected",
    };
    await prepared.store.review(command);
    await prepared.store.verify({
      ...command,
      requestId: "request-verify",
      reason: "Confirmed against approved source",
    });
    await prepared.store.markStale({
      ...command,
      requestId: "request-stale",
      reason: "Source exceeded refresh window",
    });
    const state = await database.query<{
      verification_status: string;
      freshness: string;
    }>("select verification_status,freshness from evidence_items where id=$1", [
      evidenceId,
    ]);
    expect(state.rows[0]).toEqual({
      verification_status: "VERIFIED",
      freshness: "STALE",
    });
    expect(
      (
        await database.query(
          "select action from audit_events where resource_id=$1 order by occurred_at",
          [evidenceId],
        )
      ).rows,
    ).toHaveLength(4);
  });

  it("rejects prohibited state changes and AI inference masquerading as evidence", async () => {
    const prepared = await prepare();
    database = prepared.database;
    const evidenceId = await prepared.store.create(
      input({ sourceType: "MANUAL", importId: null }),
    );
    await expect(
      prepared.store.verify({
        tenantId: ids.tenant,
        evidenceId,
        actorId: ids.actor,
        requestId: "bad-transition",
        reason: "Skipping review",
      }),
    ).rejects.toThrow("RAW->VERIFIED is prohibited");
    await expect(
      prepared.store.create(input({ origin: "AI_INFERENCE" } as never)),
    ).rejects.toThrow("AI inference cannot be stored as evidence");
    expect(
      (await database.query("select id from evidence_items")).rows,
    ).toHaveLength(1);
  });

  it("creates corrections as linked records and leaves verified history intact", async () => {
    const prepared = await prepare();
    database = prepared.database;
    const originalId = await prepared.store.create(input());
    await prepared.store.review({
      tenantId: ids.tenant,
      evidenceId: originalId,
      actorId: ids.actor,
      requestId: "review",
      reason: "reviewed",
    });
    await prepared.store.verify({
      tenantId: ids.tenant,
      evidenceId: originalId,
      actorId: ids.actor,
      requestId: "verify",
      reason: "verified",
    });
    const replacementId = await prepared.store.supersede({
      ...input({
        requestId: "correction",
        rawValue: { employees: "45" },
        normalizedValue: { employees: 45 },
      }),
      supersedesEvidenceId: originalId,
    });
    const records = await database.query<{
      id: string;
      verification_status: string;
      freshness: string;
      supersedes_evidence_id: string | null;
    }>(
      "select id,verification_status,freshness,supersedes_evidence_id from evidence_items order by created_at,id",
    );
    expect(records.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: originalId,
          verification_status: "VERIFIED",
          freshness: "STALE",
        }),
        expect.objectContaining({
          id: replacementId,
          verification_status: "RAW",
          supersedes_evidence_id: originalId,
        }),
      ]),
    );
  });
});
