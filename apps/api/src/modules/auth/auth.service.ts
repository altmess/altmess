import bcrypt from "bcrypt";
import type { PrismaClient } from "@prisma/client";

const SALT_ROUNDS = 10;

export class AuthService {
	constructor(private prisma: PrismaClient) {}

	async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, SALT_ROUNDS);
	}

	async comparePassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	async register(data: { username: string; password: string; name?: string }) {
		const hashedPassword = await this.hashPassword(data.password);

		const user = await this.prisma.user.create({
			data: {
				username: data.username,
				password: hashedPassword,
				name: data.name
			},
			select: {
				id: true,
				username: true,
				name: true,
				createdAt: true
			}
		});

		return user;
	}

	async login(username: string, password: string) {
		const user = await this.prisma.user.findUnique({
			where: { username }
		});

		if (!user) {
			throw new Error("Invalid credentials");
		}

		const isValidPassword = await this.comparePassword(password, user.password);

		if (!isValidPassword) {
			throw new Error("Invalid credentials");
		}

		return {
			id: user.id,
			username: user.username,
			name: user.name
		};
	}
}
