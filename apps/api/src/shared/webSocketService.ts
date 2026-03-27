import { WebSocket } from "ws";

class WebSocketService {
	private connections: Map<number, WebSocket> = new Map();

	register(userId: number, socket: WebSocket) {
		this.connections.set(userId, socket);
	}

	unregister(userId: number) {
		this.connections.delete(userId);
	}

	getSocket(userId: number): WebSocket | undefined {
		return this.connections.get(userId);
	}

	send(userId: number, data: any): boolean {
		const socket = this.getSocket(userId);
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
			return true;
		}
		return false;
	}

	broadcast(userIds: number[], data: any) {
		for (const userId of userIds) {
			this.send(userId, data);
		}
	}
}

export const webSocketService = new WebSocketService();
