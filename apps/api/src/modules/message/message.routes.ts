import { FastifyInstance } from "fastify";
import { MessageService } from "./message.service.js";

export async function messageRoutes(fastify: FastifyInstance) {
	const messageService = new MessageService(fastify.prisma);
}
