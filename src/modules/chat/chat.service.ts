import type { PrismaClient } from "@prisma/client";
import { webSocketService } from "../../shared/webSocketService.js";

export class ChatService {
	constructor(private prisma: PrismaClient) {}

	async createChat(title: string, userIds: number[], currentUserId?: number) {
		const chat = await this.prisma.chat.create({
			data: {
				title,
				users: {
					connect: userIds.map((id) => ({ id }))
				}
			},
			select: {
				id: true,
				title: true,
				users: {
					select: {
						id: true
					}
				}
			}
		});

		const allChatsOfUser = await this.getUserChats(currentUserId!);

		// Отправляем событие всем участникам чата
		webSocketService.broadcast(userIds, {
			type: "chat:created",
			payload: allChatsOfUser
		});

		return chat;
	}

	async getUserChats(userId: number) {
		const chats = await this.prisma.chat.findMany({
			where: {
				users: {
					some: {
						id: userId
					}
				}
			},
			select: {
				id: true,
				title: true,
				users: {
					select: {
						id: true
					}
				}
			}
		});
		return chats;
	}
}
