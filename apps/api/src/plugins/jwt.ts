import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyInstance } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
	fastify.register(jwt, {
		secret: process.env.JWT_SECRET || "your-secret-key-change-in-production"
	});

	fastify.decorate("authenticate", async function (request: any, reply: any) {
		try {
			await request.jwtVerify();
		} catch (err) {
			reply.send(err);
		}
	});
});
