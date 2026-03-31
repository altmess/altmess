import { FastifyInstance } from "fastify";
import { createChatScheme, deleteChatScheme, updateChatScheme } from "./chat.schemas.js";
import { ChatService } from "./chat.service.js";
import { webSocketService } from "../../shared/webSocketService.js";
import { randomUUID } from "crypto";

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
		async (socket, request) => {
			try {
				const userId = request.user!.id;
				const socketId = randomUUID();

				// Регистрируем сокет
				webSocketService.register(userId, socket, socketId);

				// Подписываем на все чаты пользователя
				const chats = await chatService.getUserChats(userId);
				for (const chat of chats) {
					webSocketService.joinChatRoom(chat.id, userId, socketId);
				}

				// Отправляем текущий список чатов
				socket.send(JSON.stringify({ type: "chats:list", payload: chats }));

				// Обработчик входящих сообщений
				socket.on("message", async (message) => {
					try {
						const parsedMessage = JSON.parse(String(message));

						switch (parsedMessage.type) {
							case "chats:list": {
								const chats = await chatService.getUserChats(userId);
								socket.send(JSON.stringify({ type: "chats:list", payload: chats }));
								break;
							}

							case "chat:join": {
								const chatId = Number(parsedMessage.chatId);
								if (chatId) {
									webSocketService.joinChatRoom(chatId, userId, socketId);
									const messages = await chatService.getChatMessages(chatId);
									socket.send(
										JSON.stringify({ type: "messages:list", payload: messages })
									);
								}
								break;
							}

							case "chat:leave": {
								const chatId = Number(parsedMessage.chatId);
								if (chatId) {
									webSocketService.leaveChatRoom(chatId, socketId);
								}
								break;
							}
						}
					} catch (error) {
						fastify.log.error({ error }, "Error handling WebSocket message");
					}
				});

				socket.on("close", () => {
					webSocketService.unregister(userId, socketId);
				});

				socket.on("error", (error) => {
					fastify.log.error({ error }, "WebSocket error");
					webSocketService.unregister(userId, socketId);
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
