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

		const allChatsOfUser = await this.getUserChats(currentUserId);

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

	async getChatMessages(chatId: number) {
		const messages = await this.prisma.message.findMany({
			where: { chatId },
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
			throw new Error("Unauthorized");
		}

		const userIds = chat.users.map((user) => user.id);

		await this.prisma.chat.delete({
			where: { id: parseInt(chatId) }
		});

		// Broadcast в комнату чата перед удалением
		webSocketService.broadcastToChat(parseInt(chatId), {
			type: "chat:deleted",
			payload: { chatId: parseInt(chatId) }
		});

		// Отправляем обновлённый список чатов всем участникам
		for (const uid of userIds) {
			const chats = await this.getUserChats(uid);
			webSocketService.send(uid, {
				type: "chats:list",
				payload: chats
			});
		}

		return chat;
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
			throw new Error("Unauthorized");
		}

		const oldUserIds = chat.users.map((user) => user.id);

		const updatedChat = await this.prisma.chat.update({
			where: { id: parseInt(chatId) },
			data: {
				title,
				users: {
					set: userIds.map((id) => ({ id }))
				}
			},
			include: {
				users: {
					select: {
						id: true
					}
				}
			}
		});

		// Определяем кто был добавлен или удалён
		const addedUserIds = userIds.filter((id) => !oldUserIds.includes(id));
		const removedUserIds = oldUserIds.filter((id) => !userIds.includes(id));

		// Уведомляем старых участников об обновлении
		const remainingUserIds = userIds.filter((id) => oldUserIds.includes(id));
		for (const uid of remainingUserIds) {
			const chats = await this.getUserChats(uid);
			webSocketService.send(uid, {
				type: "chat:updated",
				payload: chats
			});
		}

		// Уведомляем новых участников
		for (const uid of addedUserIds) {
			const chats = await this.getUserChats(uid);
			webSocketService.send(uid, {
				type: "chat:created",
				payload: chats
			});
		}

		// Уведомляем удалённых участников
		for (const uid of removedUserIds) {
			const chats = await this.getUserChats(uid);
			webSocketService.send(uid, {
				type: "chat:removed",
				payload: { chatId: parseInt(chatId), chats }
			});
		}

		// Broadcast в комнату чата
		webSocketService.broadcastToChat(parseInt(chatId), {
			type: "chat:updated",
			payload: updatedChat
		});

		return updatedChat;
	}
}
