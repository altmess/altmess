import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Plugins
import jwtPlugin from "./plugins/jwt.js";
import webSocketPlugin from "./plugins/webSocket.js";

// Modules
import authModule from "./modules/auth/index.js";
import userModule from "./modules/user/index.js";
import chatModule from "./modules/chat/index.js";
import messageModule from "./modules/message/index.js";

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

	// Plugins
	await fastify.register(jwtPlugin);
	await fastify.register(webSocketPlugin);

	await fastify.register(async (instance) => {
		instance.get("/health", async (request, reply) => {
			try {
				await instance.prisma.$queryRaw`SELECT 1`;
				reply.send({ status: "ok" });
			} catch (error) {
				reply.status(500).send({ status: "error", message: "Database connection failed" });
			}
		});
	});

	// Routes
	await fastify.register(authModule);
	await fastify.register(userModule);
	await fastify.register(chatModule);
	await fastify.register(messageModule);
}

export { prisma };
