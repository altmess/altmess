import { WebSocket } from "ws";

interface SocketData {
	socket: WebSocket;
	userId: number;
	chatRooms: Set<number>; // chatId's that this socket is subscribed to
}

interface UserData {
	sockets: Map<string, SocketData>; // socketId -> SocketData
}

class WebSocketService {
	// userId -> UserData (поддержка мульти-девайсов)
	private users: Map<number, UserData> = new Map();

	// chatId -> Set<socketId> (кто подписан на чат)
	private chatRooms: Map<number, Set<string>> = new Map();

	// Heartbeat interval (30 seconds)
	private heartbeatInterval: NodeJS.Timeout | null = null;

	// Socket metadata для cleanup
	private socketToUser: Map<string, { userId: number; socketId: string }> = new Map();

	initHeartbeat(intervalMs: number = 30000) {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = setInterval(() => {
			this.users.forEach((userData) => {
				userData.sockets.forEach((socketData, socketId) => {
					if (socketData.socket.readyState === WebSocket.OPEN) {
						// Отправляем ping
						socketData.socket.ping();

						// Если нет pong в течение 10 сек — закрываем
						setTimeout(() => {
							if (
								socketData.socket.readyState !== WebSocket.OPEN &&
								socketData.socket.readyState !== 3 // CLOSED
							) {
								this.unregister(socketData.userId, socketId);
							}
						}, 10000);
					}
				});
			});
		}, intervalMs);
	}

	/**
	 * Регистрирует сокет для пользователя
	 * socketId — уникальный идентификатор сокета (для поддержки мульти-девайсов)
	 */
	register(userId: number, socket: WebSocket, socketId: string) {
		// Создаём запись пользователя если нет
		if (!this.users.has(userId)) {
			this.users.set(userId, { sockets: new Map() });
		}

		const userData = this.users.get(userId)!;

		// Сохраняем сокет
		const socketData: SocketData = {
			socket,
			userId,
			chatRooms: new Set()
		};

		userData.sockets.set(socketId, socketData);
		this.socketToUser.set(socketId, { userId, socketId });

		// Восстанавливаем подписки на чаты если пользователь уже был в комнатах
		this.chatRooms.forEach((socketIds, chatId) => {
			// Проверяем, был ли пользователь в этом чате (по другим сокетам)
			const wasInRoom = Array.from(socketIds).some((sid) => {
				const info = this.socketToUser.get(sid);
				return info?.userId === userId;
			});

			if (wasInRoom) {
				this.joinChatRoom(chatId, userId, socketId);
			}
		});

		// Обработчик close для cleanup
		socket.on("close", () => {
			this.unregister(userId, socketId);
		});

		// Обработчик error
		socket.on("error", (error) => {
			console.error(`WebSocket error for user ${userId}:`, error);
			this.unregister(userId, socketId);
		});
	}

	/**
	 * Отключает сокет
	 */
	unregister(userId: number, socketId: string) {
		const userData = this.users.get(userId);
		if (!userData) return;

		const socketData = userData.sockets.get(socketId);
		if (!socketData) return;

		// Отписываемся от всех чатов
		socketData.chatRooms.forEach((chatId) => {
			this.leaveChatRoom(chatId, socketId);
		});

		// Закрываем сокет если ещё открыт
		if (socketData.socket.readyState === WebSocket.OPEN) {
			socketData.socket.close();
		}

		// Удаляем сокет
		userData.sockets.delete(socketId);
		this.socketToUser.delete(socketId);

		// Если это был последний сокет пользователя — удаляем пользователя
		if (userData.sockets.size === 0) {
			this.users.delete(userId);
		}
	}

	/**
	 * Подключает сокет к комнате чата
	 */
	joinChatRoom(chatId: number, userId: number, socketId: string) {
		const userData = this.users.get(userId);
		const socketData = userData?.sockets.get(socketId);

		if (!socketData) return false;

		// Проверяем, что пользователь ещё не в этой комнате (на этом сокете)
		if (socketData.chatRooms.has(chatId)) {
			return true; // Уже в комнате
		}

		// Добавляем сокет в комнату
		if (!this.chatRooms.has(chatId)) {
			this.chatRooms.set(chatId, new Set());
		}
		this.chatRooms.get(chatId)!.add(socketId);

		// Добавляем комнату к сокету
		socketData.chatRooms.add(chatId);

		return true;
	}

	/**
	 * Отключает сокет от комнаты чата
	 */
	leaveChatRoom(chatId: number, socketId: string) {
		const room = this.chatRooms.get(chatId);
		if (!room) return;

		const info = this.socketToUser.get(socketId);
		if (!info) return;

		const userData = this.users.get(info.userId);
		const socketData = userData?.sockets.get(socketId);

		if (socketData) {
			socketData.chatRooms.delete(chatId);
		}

		room.delete(socketId);

		// Если в комнате не осталось сокетов — удаляем комнату
		if (room.size === 0) {
			this.chatRooms.delete(chatId);
		}
	}

	/**
	 * Отправляет данные конкретному пользователю (во все его активные сокеты)
	 */
	send(userId: number, data: any): boolean {
		const userData = this.users.get(userId);
		if (!userData) return false;

		let sent = false;
		userData.sockets.forEach((socketData) => {
			if (socketData.socket.readyState === WebSocket.OPEN) {
				socketData.socket.send(JSON.stringify(data));
				sent = true;
			}
		});

		return sent;
	}

	/**
	 * Отправляет данные в комнату чата (всем подключенным участникам)
	 */
	broadcastToChat(chatId: number, data: any, excludeSocketId?: string) {
		const room = this.chatRooms.get(chatId);
		if (!room) return;

		room.forEach((socketId) => {
			if (excludeSocketId && socketId === excludeSocketId) return;

			const info = this.socketToUser.get(socketId);
			if (!info) return;

			const userData = this.users.get(info.userId);
			const socketData = userData?.sockets.get(socketId);

			if (socketData && socketData.socket.readyState === WebSocket.OPEN) {
				socketData.socket.send(JSON.stringify(data));
			}
		});
	}

	/**
	 * Отправляет данные всем пользователям из списка
	 */
	broadcast(userIds: number[], data: any) {
		for (const userId of userIds) {
			this.send(userId, data);
		}
	}

	/**
	 * Получает количество подключенных сокетов для пользователя
	 */
	getSocketCount(userId: number): number {
		const userData = this.users.get(userId);
		return userData?.sockets.size || 0;
	}

	/**
	 * Получает количество сокетов в комнате чата
	 */
	getRoomSize(chatId: number): number {
		const room = this.chatRooms.get(chatId);
		return room?.size || 0;
	}

	/**
	 * Очищает все соединения (для graceful shutdown)
	 */
	cleanup() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.users.forEach((userData) => {
			userData.sockets.forEach((socketData) => {
				if (socketData.socket.readyState === WebSocket.OPEN) {
					socketData.socket.close(1001, "Server shutting down");
				}
			});
		});

		this.users.clear();
		this.chatRooms.clear();
		this.socketToUser.clear();
	}
}

export const webSocketService = new WebSocketService();
