import { PrismaClient } from "@prisma/client";
import { webSocketService } from "../../shared/webSocketService.js";

export class MessageService {
	constructor(private prisma: PrismaClient) {}

	async getMessagesByChatId(chatId: number) {
		const messages = await this.prisma.message.findMany({
			where: {
				chatId
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true
					}
				}
			},
			orderBy: {
				createdAt: "asc"
			}
		});
		return messages;
	}

	async createMessage(chatId: number, senderId: number, content: string, senderSocketId?: string) {
		const message = await this.prisma.message.create({
			data: {
				content,
				chatId,
				senderId
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		// Отправляем сообщение всем в комнате чата (кроме отправителя)
		webSocketService.broadcastToChat(chatId, {
			type: "message:created",
			payload: message
		}, senderSocketId);

		return message;
	}
}
