import "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
	interface FastifyInstance {
		prisma: PrismaClient;
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}

	interface FastifyRequest {
		user?: {
			id: number;
			username: string;
		};
	}
}

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: number;
			username: string;
		};
		user: {
			id: number;
			username: string;
		};
	}
}
