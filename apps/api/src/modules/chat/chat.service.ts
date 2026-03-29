import type { PrismaClient } from "@prisma/client";
import { webSocketService } from "../../shared/webSocketService.js";

export class ChatService {
	constructor(private prisma: PrismaClient) {}

	async createChat(title: string, userIds: number[], currentUserId: number) {
		const chat = await this.prisma.chat.create({
			data: {
				title,
				chatCreatorId: currentUserId,
				users: {
					connect: userIds.map((id) => ({ id }))
				}
			},
			select: {
				id: true,
				title: true,
				chatCreatorId: true,
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
				chatCreatorId: true,
				users: {
					select: {
						id: true
					}
				}
			}
		});
		return chats;
	}

	async deleteChat(chatId: string, userId: number) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: parseInt(chatId) },
			include: { users: true }
		});

		if (!chat) {
			throw new Error("Chat not found");
		}

		const isUserInChat = chat.users.some((user) => user.id === userId);
		if (!isUserInChat) {
			throw new Error("Forbidden");
		}

		await this.prisma.chat.delete({
			where: { id: parseInt(chatId) }
		});

		const allChatsOfUser = await this.getUserChats(userId);

		webSocketService.broadcast(
			chat.users.map((user) => user.id),
			{
				type: "chat:deleted",
				payload: allChatsOfUser
			}
		);
	}

	async updateChat(chatId: string, title: string, userIds: number[], userId: number) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: parseInt(chatId) },
			include: { users: true }
		});

		if (!chat) {
			throw new Error("Chat not found");
		}

		const isUserInChat = chat.users.some((user) => user.id === userId);
		if (!isUserInChat) {
			throw new Error("Forbidden");
		}

		const updatedChat = await this.prisma.chat.update({
			where: { id: parseInt(chatId) },
			data: { title, users: { set: userIds.map((id) => ({ id })) } },
			include: {
				users: {
					select: {
						id: true
					}
				}
			}
		});

		const allChatsOfUser = await this.getUserChats(userId);

		webSocketService.broadcast(
			chat.users.map((user) => user.id),
			{
				type: "chat:updated",
				payload: allChatsOfUser
			}
		);

		return updatedChat;
	}
}
