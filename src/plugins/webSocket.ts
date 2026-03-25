import fp from "fastify-plugin";
import webSocket from "@fastify/websocket";
import { FastifyInstance } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
	fastify.register(webSocket, {
		options: { maxPayload: 1048576 }
	});
});
