import path from "node:path";

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Env lives at the repo root so both apps and the Prisma CLI share one set of credentials.
config({ path: path.resolve(import.meta.dirname, "../../.env"), quiet: true });

// Railway: use the private URL inside Railway (pre-deploy migrations) and the public one locally.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
