import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { userRoutes } from "./user.routes.js";

export default fp(async function (fastify: FastifyInstance) {
	fastify.register(userRoutes, { prefix: "/user" });
});
