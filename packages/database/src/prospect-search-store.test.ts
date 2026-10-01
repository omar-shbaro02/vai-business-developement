import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { ProspectSearchStore } from "./prospect-search-store.js";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);
const tenant = "30000000-0000-4000-8000-000000000001";
const otherTenant = "30000000-0000-4000-8000-000000000002";
const actor = "30000000-0000-4000-8000-000000000003";
const otherActor = "30000000-0000-4000-8000-000000000004";

function poolAdapter(database: PGlite) {
  return {
    query: async (text: string, parameters?: unknown[]) => {
      const result = await database.query(text, parameters);
      return {
        ...result,
        rowCount: result.rows.length || result.affectedRows || 0,
      };
    },
  };
}

async function prepare() {
  const database = new PGlite();
  for (const file of (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    await database.exec(
      await readFile(resolve(migrationsDirectory, file), "utf8"),
    );
  await database.query(
    "insert into tenants (id,name) values ($1,'VAI'),($2,'Other')",
    [tenant, otherTenant],
  );
  await database.query(
    `insert into actors (id,tenant_id,external_subject,display_name)
     values ($1,$2,'owner','Owner'),($3,$4,'owner','Other Owner')`,
    [actor, tenant, otherActor, otherTenant],
  );
  const organizations = [
    ["30000000-0000-4000-8000-000000000011", tenant, "Alpha Logistics"],
    ["30000000-0000-4000-8000-000000000012", tenant, "Beta Logistics"],
    ["30000000-0000-4000-8000-000000000013", otherTenant, "Hidden Logistics"],
  ] as const;
  for (const [id, tenantId, name] of organizations) {
    await database.query(
      `insert into organizations
       (id,tenant_id,legal_name,display_name,source_type,source_reference,source_record_id,created_by)
       values ($1::uuid,$2::uuid,$3,$3,'CSV_IMPORT','test','record-' || ($1::uuid)::text,$4)`,
      [id, tenantId, name, tenantId === tenant ? actor : otherActor],
    );
    await database.query(
      `insert into account_profiles
       (organization_id,tenant_id,tier,tier_rule_version,website,locations,
        industry_label,context,evidence_ids,freshness)
       values ($1,$2,$3,'account-tier/draft-0.1',$4,$5::jsonb,'Trade and logistics',
               $6::jsonb,$7::jsonb,'CURRENT')`,
      [
        id,
        tenantId,
        name.startsWith("Alpha") ? "TIER_1" : "TIER_2",
        `https://${name.toLowerCase().replaceAll(" ", "-")}.example`,
        JSON.stringify([
          { country: "US", region: "Virginia", locality: "Arlington" },
        ]),
        JSON.stringify({ tier_reasons: ["Reviewed regional scale"] }),
        JSON.stringify([]),
      ],
    );
  }
  return database;
}

describe("prospect search store", () => {
  let database: PGlite | undefined;
  afterEach(async () => database?.close());

  it("filters by industry, region, tier, and tenant", async () => {
    database = await prepare();
    const store = new ProspectSearchStore(poolAdapter(database) as never);
    const result = await store.search(tenant, {
      industry: "logistics",
      region: "Virginia",
      tier: "TIER_1",
      cursor: null,
      limit: 20,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      displayName: "Alpha Logistics",
      tier: "TIER_1",
      tierReasons: ["Reviewed regional scale"],
    });
  });

  it("returns an opaque cursor when another page exists", async () => {
    database = await prepare();
    const store = new ProspectSearchStore(poolAdapter(database) as never);
    const result = await store.search(tenant, {
      industry: "Trade",
      region: "Arlington",
      tier: null,
      cursor: null,
      limit: 1,
    });
    expect(result.data).toHaveLength(1);
    expect(result.page).toEqual({
      cursor: "30000000-0000-4000-8000-000000000011",
      has_more: true,
    });
  });
});
