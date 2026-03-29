import { FastifyInstance } from "fastify";
import { createChatScheme, deleteChatScheme, updateChatScheme } from "./chat.schemas.js";
import { ChatService } from "./chat.service.js";
import { webSocketService } from "../../shared/webSocketService.js";

export async function chatRoutes(fastify: FastifyInstance) {
	const chatService = new ChatService(fastify.prisma);

	fastify.post("/", {
		schema: createChatScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { title, users } = request.body as {
					title: string;
					users: number[];
				};

				const usersArrayWithCurrentUser = Array.from(
					new Set([...(users ? users : []), request.user.id])
				);

				const chat = await chatService.createChat(title, usersArrayWithCurrentUser, request.user.id);
				return reply.send(chat);
			} catch (error: any) {
				fastify.log.error(error);
				
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});

	fastify.get(
		"/ws",
		{
			onRequest: [fastify.authenticate],
			websocket: true
		},
		async (socket, req) => {
			try {
				const userId = req.user!.id;

				webSocketService.register(userId, socket);

				const chats = await chatService.getUserChats(userId);
				socket.send(JSON.stringify({ type: "chats:list", payload: chats }));

				socket.on("message", async (message) => {
					const parsedMessage = JSON.parse(String(message));

					if (parsedMessage.type === "chats:list") {
						const chats = await chatService.getUserChats(userId);
						socket.send(JSON.stringify({ type: "chats:list", payload: chats }));
					}
				});

				socket.on("close", () => {
					webSocketService.unregister(userId);
				});

				socket.on("error", () => {
					webSocketService.unregister(userId);
				});
			} catch (error: any) {
				fastify.log.error(error);
				socket.send(JSON.stringify({ error: "Internal server error" }));
				socket.close();
			}
		}
	);

	fastify.delete("/:id", {
		schema: deleteChatScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { id } = request.params as { id: string };
				const userId = request.user.id;

				await chatService.deleteChat(id, userId);
				return reply.send({ message: "Chat deleted successfully" });
			} catch (error: any) {
				fastify.log.error(error);
				if (error.message === "Chat not found") {
					return reply.code(404).send({ error: "Chat not found" });
				} else if (error.message === "Unauthorized") {
					return reply.code(403).send({ error: "Unauthorized" });
				} else {
					return reply.code(500).send({ error: "Internal server error" });
				}
			}
		}
	});

	fastify.put("/:id", {
		schema: updateChatScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { id } = request.params as { id: string };
				const { title, users } = request.body as { title: string; users: number[] };
				const userId = request.user.id;

				const usersArrayWithCurrentUser = Array.from(
					new Set([...(users ? users : []), request.user.id])
				);

				const chat = await chatService.updateChat(id, title, usersArrayWithCurrentUser, userId);
				return reply.send(chat);
			} catch (error: any) {
				fastify.log.error(error);
				if (error.message === "Chat not found") {
					return reply.code(404).send({ error: "Chat not found" });
				} else if (error.message === "Unauthorized") {
					return reply.code(403).send({ error: "Unauthorized" });
				} else {
					return reply.code(500).send({ error: "Internal server error" });
				}
			}
		}
	});
}
