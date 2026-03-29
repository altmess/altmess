import { FastifyInstance } from "fastify";
import {
	deleteUserScheme,
	getMeScheme,
	searchUsersSchema,
	getUserByIdSchema,
	updateUserScheme
} from "./user.schemas.js";
import { UserService } from "./user.service.js";

export async function userRoutes(fastify: FastifyInstance) {
	const userService = new UserService(fastify.prisma);

	fastify.get("/me", {
		schema: getMeScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const user = await userService.getMe(request.user.id);

				if (!user) {
					return reply.code(404).send({ error: "User not found" });
				}

				return reply.send(user);
			} catch (error: any) {
				fastify.log.error(error);
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});

	fastify.get("/search", {
		schema: searchUsersSchema,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { username } = request.query as { username: string };
				const users = await userService.searchUsersByUsername(request.user.id, username);

				return reply.send(users);
			} catch (error: any) {
				fastify.log.error(error);
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});

	fastify.get("/:id", {
		schema: getUserByIdSchema,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { id } = request.params as { id: number };

				const user = await userService.getUserById(Number(id));

				if (!user) {
					return reply.code(404).send({ error: "User not found" });
				}

				return reply.send(user);
			} catch (error: any) {
				fastify.log.error(error);
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});

	fastify.delete("/", {
		schema: deleteUserScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				await userService.deleteUser(request.user.id);
				return reply.send({ message: "User deleted successfully" });
			} catch (error: any) {
				fastify.log.error(error);
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});

	fastify.put("/", {
		schema: updateUserScheme,
		onRequest: [fastify.authenticate],
		handler: async (request, reply) => {
			try {
				const { username, name } = request.body as {
					username: string;
					name?: string;
				};

				const updatedUser = await userService.updateUser(request.user.id, {
					username,
					name
				});

				if (!updatedUser) {
					return reply.code(404).send({ error: "User not found" });
				}

				return reply.send(updatedUser);
			} catch (error: any) {
				fastify.log.error(error);
				return reply.code(500).send({ error: "Internal server error" });
			}
		}
	});
}
