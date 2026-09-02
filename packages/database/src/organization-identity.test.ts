import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { OrganizationIdentityRepository } from "./organization-identity.js";

const migrationsDirectory = resolve(
  import.meta.dirname,
  "../../../db/migrations",
);
const ids = {
  tenant: "00000000-0000-4000-8000-000000000001",
  actor: "00000000-0000-4000-8000-000000000002",
  first: "00000000-0000-4000-8000-000000000003",
  second: "00000000-0000-4000-8000-000000000004",
  hypothesis: "00000000-0000-4000-8000-000000000005",
  opportunity: "00000000-0000-4000-8000-000000000006",
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

describe("organization merge repository", () => {
  let database: PGlite | undefined;
  afterEach(async () => database?.close());

  it("detects a candidate and only merges it through an explicit reviewed transaction", async () => {
    database = new PGlite();
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
      "insert into actors (id,tenant_id,external_subject,display_name) values ($1,$2,'owner','Owner')",
      [ids.actor, ids.tenant],
    );
    await database.query(
      `insert into organizations (id,tenant_id,legal_name,display_name,source_type,created_by) values
       ($1,$3,'Example LLC','Example','MANUAL',$4),($2,$3,'Example Limited','Example Group','CSV_IMPORT',$4)`,
      [ids.first, ids.second, ids.tenant, ids.actor],
    );
    await database.query(
      "insert into organization_domains (tenant_id,organization_id,domain,source_type) values ($1,$2,'example.com','MANUAL'),($1,$3,'www.example.com','CSV_IMPORT')",
      [ids.tenant, ids.first, ids.second],
    );
    await database.query(
      "insert into problem_hypotheses (id,tenant_id,statement,status,created_by) values ($1,$2,'Need','UNVERIFIED',$3)",
      [ids.hypothesis, ids.tenant, ids.actor],
    );
    await database.query(
      "insert into commercial_opportunities (id,tenant_id,organization_id,title,status,problem_hypothesis_id,created_by) values ($1,$2,$3,'Pilot','DRAFT',$4,$5)",
      [ids.opportunity, ids.tenant, ids.second, ids.hypothesis, ids.actor],
    );

    const repository = new OrganizationIdentityRepository(
      poolAdapter(database) as never,
    );
    expect(await repository.detectCandidates(ids.tenant)).toBe(1);
    const candidate = await database.query<{ id: string; status: string }>(
      "select id,status from organization_merge_candidates",
    );
    expect(candidate.rows[0]?.status).toBe("PENDING");
    const eventId = await repository.approveMerge({
      tenantId: ids.tenant,
      candidateId: candidate.rows[0]!.id,
      canonicalOrganizationId: ids.first,
      actorId: ids.actor,
      requestId: "request-1",
      reason: "Reviewed shared corporate domain",
    });
    expect(eventId).toBeTruthy();
    const opportunity = await database.query<{ organization_id: string }>(
      "select organization_id from commercial_opportunities where id=$1",
      [ids.opportunity],
    );
    expect(opportunity.rows[0]?.organization_id).toBe(ids.first);
    const alias = await database.query<{ canonical_organization_id: string }>(
      "select canonical_organization_id from organization_aliases where alias_organization_id=$1",
      [ids.second],
    );
    expect(alias.rows[0]?.canonical_organization_id).toBe(ids.first);
    const source = await database.query<{ merged_into_id: string }>(
      "select merged_into_id from organizations where id=$1",
      [ids.second],
    );
    expect(source.rows[0]?.merged_into_id).toBe(ids.first);
    expect(
      (
        await database.query(
          "select id from audit_events where action='ORGANIZATION_MERGED'",
        )
      ).rows,
    ).toHaveLength(1);
  });

  it("refuses a merge with conflicting account profiles and rolls back all effects", async () => {
    database = new PGlite();
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
      "insert into actors (id,tenant_id,external_subject,display_name) values ($1,$2,'owner','Owner')",
      [ids.actor, ids.tenant],
    );
    await database.query(
      `insert into organizations (id,tenant_id,legal_name,display_name,source_type,created_by) values
       ($1,$3,'Example LLC','Example','MANUAL',$4),($2,$3,'Example Ltd','Example','CSV_IMPORT',$4)`,
      [ids.first, ids.second, ids.tenant, ids.actor],
    );
    await database.query(
      "insert into account_profiles (organization_id,tenant_id,tier,tier_rule_version) values ($1,$3,'TIER_1','v1'),($2,$3,'TIER_2','v1')",
      [ids.first, ids.second, ids.tenant],
    );
    const candidate = await database.query<{ id: string }>(
      "insert into organization_merge_candidates (tenant_id,source_organization_id,target_organization_id,score,reasons) values ($1,$2,$3,'0.90','[]') returning id",
      [ids.tenant, ids.first, ids.second],
    );
    const repository = new OrganizationIdentityRepository(
      poolAdapter(database) as never,
    );
    await expect(
      repository.approveMerge({
        tenantId: ids.tenant,
        candidateId: candidate.rows[0]!.id,
        canonicalOrganizationId: ids.first,
        actorId: ids.actor,
        requestId: "request-2",
        reason: "reviewed",
      }),
    ).rejects.toThrow("Account profile conflict");
    expect(
      (
        await database.query(
          "select alias_organization_id from organization_aliases",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (await database.query("select id from organization_merge_events")).rows,
    ).toHaveLength(0);
  });
});
