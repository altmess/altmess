import type { PrismaClient } from "@prisma/client";

export class UserService {
	constructor(private prisma: PrismaClient) {}

	async getMe(userId: number) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				name: true,
				createdAt: true
			}
		});

		return user;
	}

	async getUserById(userId: number) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				name: true,
				createdAt: true
			}
		});

		return user;
	}

	async deleteUser(userId: number) {
		await this.prisma.user.delete({
			where: { id: userId }
		});
	}

	async updateUser(userId: number, data: { username?: string; name?: string }) {
		const user = await this.prisma.user.update({
			where: { id: userId },
			data: {
				username: data.username,
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
}
