import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Carrega .env.local (dev) com fallback para .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Local: PostgreSQL Docker | Cloud: Supabase (troca a env var)
    url: process.env["DATABASE_URL"]!,
  },
});
