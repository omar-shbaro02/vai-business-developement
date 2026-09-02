import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);

describe("database migrations", () => {
  it("migrates an empty PostgreSQL database and creates indexed provenance/audit structures", async () => {
    const database = new PGlite();
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files)
      await database.exec(
        await readFile(resolve(migrationsDirectory, file), "utf8"),
      );

    const tables = await database.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'",
    );
    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        "organizations",
        "evidence_items",
        "audit_events",
        "priority_decisions",
      ]),
    );

    const indexes = await database.query<{ indexname: string }>(
      "select indexname from pg_indexes where schemaname = 'public'",
    );
    expect(indexes.rows.map((row) => row.indexname)).toEqual(
      expect.arrayContaining([
        "organizations_tenant_name_idx",
        "evidence_source_idx",
        "audit_resource_time_idx",
      ]),
    );
    await database.close();
  });
});
