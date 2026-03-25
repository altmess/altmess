import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { chatRoutes } from "./chat.routes.js";

export default fp(async function (fastify: FastifyInstance) {
	fastify.register(chatRoutes, { prefix: "/chat" });
});
