import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { messageRoutes } from "./message.routes.js";

export default fp(async function (fastify: FastifyInstance) {
	fastify.register(messageRoutes, { prefix: "/message" });
});
