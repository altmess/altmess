import fastify from "fastify";
import app, { prisma } from "./app.js";
import { webSocketService } from "./shared/webSocketService.js";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = parseInt(process.env.PORT || "3000", 10);

const server = fastify({
	logger: {
		level: "info"
	}
});

server.register(app);

// Инициализируем heartbeat для WebSocket
webSocketService.initHeartbeat(30000);

server.addHook("onClose", async () => {
	// Graceful shutdown для WebSocket
	webSocketService.cleanup();
	await prisma.$disconnect();
});

server.listen({ host: HOST, port: PORT }, (err, address) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
	server.log.info(`Server listening at ${address}`);
});
