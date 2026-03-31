import { FastifyInstance } from "fastify";
import { MessageService } from "./message.service.js";
import { webSocketService } from "../../shared/webSocketService.js";
import { randomUUID } from "crypto";

export async function messageRoutes(fastify: FastifyInstance) {
	const messageService = new MessageService(fastify.prisma);

	fastify.get(
		"/ws/:chatId",
		{
			onRequest: [fastify.authenticate],
			websocket: true
		},
		async (socket, request) => {
			try {
				const userId = request.user!.id;
				const socketId = randomUUID();
				const { chatId } = request.params as { chatId: string };
				const chatIdNum = Number(chatId);

				// Регистрируем сокет
				webSocketService.register(userId, socket, socketId);

				// Подписываем на комнату чата
				webSocketService.joinChatRoom(chatIdNum, userId, socketId);

				// Отправляем историю сообщений
				const messages = await messageService.getMessagesByChatId(chatIdNum);
				socket.send(JSON.stringify({ type: "messages:list", payload: messages }));

				// Обработчик входящих сообщений
				socket.on("message", async (message) => {
					try {
						const parsedMessage = JSON.parse(String(message));

						switch (parsedMessage.type) {
							case "messages:list": {
								const messages = await messageService.getMessagesByChatId(chatIdNum);
								socket.send(JSON.stringify({ type: "messages:list", payload: messages }));
								break;
							}

							case "message:send": {
								const content = parsedMessage.content?.trim();
								if (content) {
									const message = await messageService.createMessage(chatIdNum, userId, content, socketId);

									socket.send(JSON.stringify({ type: "message:created", payload: message }));
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

	fastify.get("/:chatId", {
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			const { chatId } = request.params as { chatId: string };

			const messages = await messageService.getMessagesByChatId(Number(chatId));
			reply.send(messages);
		}
	});

	fastify.post("/", {
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			const { chatId, content } = request.body as {
				chatId: string;
				content: string;
			};

			const message = await messageService.createMessage(Number(chatId), request.user.id, content);
			reply.send(message);
		}
	});
}
