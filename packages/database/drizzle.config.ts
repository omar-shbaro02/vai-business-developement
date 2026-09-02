import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "../../db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost/vai_bd",
  },
  strict: true,
});
