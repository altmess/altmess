import { Prisma, type PrismaClient } from "@prisma/client";

type UserSearchResult = {
	id: number;
	username: string;
	name: string | null;
};

export class UserService {
	constructor(private prisma: PrismaClient) {}

	private normalizeUsernameSearchValue(value: string) {
		return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
	}

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

	async searchUsersByUsername(currentUserId: number, query: string) {
		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			return [];
		}

		const loweredQuery = trimmedQuery.toLowerCase();
		const normalizedQuery = this.normalizeUsernameSearchValue(trimmedQuery);

		if (!normalizedQuery) {
			return [];
		}

		const users = await this.prisma.$queryRaw<UserSearchResult[]>(Prisma.sql`
			SELECT
				"id",
				"username",
				"name"
			FROM "User"
			WHERE "id" <> ${currentUserId}
				AND (
					LOWER("username") LIKE ${`%${loweredQuery}%`}
					OR regexp_replace(LOWER("username"), '[^[:alnum:]]+', '', 'g') LIKE ${`%${normalizedQuery}%`}
				)
			ORDER BY
				CASE
					WHEN LOWER("username") = ${loweredQuery} THEN 0
					WHEN regexp_replace(LOWER("username"), '[^[:alnum:]]+', '', 'g') = ${normalizedQuery} THEN 1
					WHEN LOWER("username") LIKE ${`${loweredQuery}%`} THEN 2
					WHEN regexp_replace(LOWER("username"), '[^[:alnum:]]+', '', 'g') LIKE ${`${normalizedQuery}%`} THEN 3
					WHEN LOWER("username") LIKE ${`%${loweredQuery}%`} THEN 4
					ELSE 5
				END,
				char_length("username"),
				"username"
			LIMIT 20
		`);

		return users;
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
