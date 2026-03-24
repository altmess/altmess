import { FastifyInstance } from "fastify";
import { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export async function authRoutes(fastify: FastifyInstance) {
	const authService = new AuthService(fastify.prisma);

	fastify.post("/register", {
		schema: registerSchema,
		handler: async (request, reply) => {
			try {
				const { username, password, name } = request.body as {
					username: string;
					password: string;
					name?: string;
				};

				const user = await authService.register({
					username,
					password,
					name
				});

				const token = fastify.jwt.sign({
					id: user.id,
					username: user.username
				});

				console.log({ token, user });

				return reply.code(201).send({ token, user });
			} catch (error: any) {
				fastify.log.error(error);
				if (error.code === "P2002") {
					return reply.code(409).send({
						error: "User with this username already exists"
					});
				} else {
					return reply.code(500).send({ error: "Internal server error" });
				}
			}
		}
	});

	fastify.post("/login", {
		schema: loginSchema,
		handler: async (request, reply) => {
			try {
				const { username, password } = request.body as {
					username: string;
					password: string;
				};

				const user = await authService.login(username, password);

				if (!user) {
					return reply.code(401).send({ error: "Invalid credentials" });
				}

				const token = fastify.jwt.sign({
					id: user.id,
					username: user.username
				});

				return reply.send({ token, user });
			} catch (error: any) {
				fastify.log.error(error);
				if (error.message === "Invalid credentials") {
					return reply.code(401).send({ error: "Invalid credentials" });
				} else {
					return reply.code(500).send({ error: "Internal server error" });
				}
			}
		}
	});
}
