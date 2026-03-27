import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";
import { join } from "path";

const __dirname = join(import.meta.dirname);
config({ path: join(__dirname, "../../.env") });

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts"
	},
	datasource: {
		url: env("DATABASE_URL")
	}
});
