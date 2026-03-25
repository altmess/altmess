import { FastifyInstance } from "fastify";
import { createChatScheme } from "./chat.schemas.js";
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

				const chat = await chatService.createChat(title, usersArrayWithCurrentUser);
				return reply.send(chat);
			} catch (error) {
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
			} catch (error) {
				fastify.log.error(error);
				socket.send(JSON.stringify({ error: "Internal server error" }));
				socket.close();
			}
		}
	);
}
