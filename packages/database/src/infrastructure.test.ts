import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { AuditHistoryStore } from "./audit-store.js";
import { JobOutboxStore } from "./job-store.js";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);
const tenant = "20000000-0000-4000-8000-000000000001";
const actor = "20000000-0000-4000-8000-000000000002";
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
async function prepare() {
  const database = new PGlite();
  for (const file of (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    await database.exec(
      await readFile(resolve(migrationsDirectory, file), "utf8"),
    );
  await database.query("insert into tenants (id,name) values ($1,'VAI')", [
    tenant,
  ]);
  await database.query(
    "insert into actors (id,tenant_id,external_subject,display_name) values ($1,$2,'owner','Owner')",
    [actor, tenant],
  );
  return database;
}

describe("audit/history and job foundations", () => {
  let database: PGlite | undefined;
  afterEach(async () => database?.close());

  it("redacts sensitive fields, authorizes tenant history, and enforces append-only audit records", async () => {
    database = await prepare();
    const store = new AuditHistoryStore(poolAdapter(database) as never);
    const resourceId = randomUUID();
    const auditId = randomUUID();
    await store.append({
      id: auditId,
      tenantId: tenant,
      actorId: actor,
      action: "UPDATED",
      resourceType: "organization",
      resourceId,
      occurredAt: new Date().toISOString(),
      requestId: "request-audit",
      reason: "reviewed",
      before: { password: "secret" },
      after: { nested: { api_key: "secret", safe: "visible" } },
      metadata: { token: "secret" },
    });
    const history = await store.history(
      {
        actorId: actor,
        tenantId: tenant,
        roles: ["READ_ONLY"],
        authenticated: true,
        requestId: "read",
      },
      "organization",
      resourceId,
    );
    expect(history[0]).toMatchObject({
      before: { password: "[REDACTED]" },
      after: { nested: { api_key: "[REDACTED]", safe: "visible" } },
      metadata: { token: "[REDACTED]" },
    });
    await expect(
      database.query("update audit_events set action='TAMPERED' where id=$1", [
        auditId,
      ]),
    ).rejects.toThrow("append-only");
    await expect(
      store.history(
        {
          actorId: actor,
          tenantId: tenant,
          roles: ["READ_ONLY"],
          authenticated: false,
          requestId: "read",
        },
        "organization",
        resourceId,
      ),
    ).rejects.toThrow("Unauthenticated");
  });

  it("commits writes with one idempotent job and rolls both back on failure", async () => {
    database = await prepare();
    const store = new JobOutboxStore(poolAdapter(database) as never);
    const job = {
      tenantId: tenant,
      type: "IMPORT",
      payload: { importId: "one" },
      idempotencyKey: "import:one",
      maxAttempts: 2,
    };
    const first = await store.writeWithJob(
      (client) =>
        client.query("update tenants set name='Updated' where id=$1", [tenant]),
      job,
    );
    expect(await store.enqueue(job)).toBe(first.jobId);
    expect(
      (await database.query("select id from background_jobs")).rows,
    ).toHaveLength(1);
    await expect(
      store.writeWithJob(
        async (client) => {
          await client.query(
            "update tenants set name='Rolled back' where id=$1",
            [tenant],
          );
          throw new Error("write failed");
        },
        { ...job, idempotencyKey: "import:two" },
      ),
    ).rejects.toThrow("write failed");
    expect(
      (
        await database.query<{ name: string }>(
          "select name from tenants where id=$1",
          [tenant],
        )
      ).rows[0]?.name,
    ).toBe("Updated");
    expect(
      (await database.query("select id from background_jobs")).rows,
    ).toHaveLength(1);
  });

  it("recovers abandoned work and exposes a bounded terminal failure", async () => {
    database = await prepare();
    const store = new JobOutboxStore(poolAdapter(database) as never);
    const jobId = await store.enqueue({
      tenantId: tenant,
      type: "IMPORT",
      payload: {},
      idempotencyKey: "retry",
      maxAttempts: 2,
    });
    expect((await store.claim("worker-a"))?.id).toBe(jobId);
    await database.query(
      "update background_jobs set locked_at=now()-interval '1 hour' where id=$1",
      [jobId],
    );
    expect(await store.recoverAbandoned(new Date())).toBe(1);
    await store.claim("worker-b");
    expect(await store.fail(jobId, "worker-b", "safe error")).toBe("PENDING");
    await database.query(
      "update background_jobs set available_at=now() where id=$1",
      [jobId],
    );
    await store.claim("worker-c");
    expect(await store.fail(jobId, "worker-c", "safe error")).toBe(
      "DEAD_LETTER",
    );
    const state = await database.query<{
      status: string;
      attempts: number;
      last_error: string;
    }>("select status,attempts,last_error from background_jobs where id=$1", [
      jobId,
    ]);
    expect(state.rows[0]).toEqual({
      status: "DEAD_LETTER",
      attempts: 2,
      last_error: "safe error",
    });
  });
});
