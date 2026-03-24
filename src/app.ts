import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import jwtPlugin from "./plugins/jwt.js";
import authModule from "./modules/auth/index.js";
import userModule from "./modules/user/index.js";

// Parse DATABASE_URL or use individual env vars
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/myapp";
const url = new URL(dbUrl);

const pool = new Pool({
	host: url.hostname,
	port: parseInt(url.port) || 5432,
	database: url.pathname.slice(1),
	user: url.username,
	password: url.password
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default async function app(fastify: FastifyInstance, opts: any) {
	fastify.decorate("prisma", prisma);

	await fastify.register(jwtPlugin);

	// Routes
	await fastify.register(authModule);
	await fastify.register(userModule);
}

export { prisma };
