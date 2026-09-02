import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export * from "./schema.js";
export * from "./organization-identity.js";
export * from "./evidence-store.js";
export * from "./audit-store.js";
export * from "./job-store.js";
export * from "./discovery-import-store.js";
export * from "./enrichment-store.js";
export * from "./qualification-store.js";
export * from "./opportunity-store.js";
export * from "./priority-store.js";
export * from "./recommendation-store.js";
export * from "./decision-store.js";

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  return { db: drizzle(pool), close: () => pool.end() };
}
