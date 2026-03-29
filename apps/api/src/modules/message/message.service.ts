import { PrismaClient } from "@prisma/client";

export class MessageService {
	constructor(private prisma: PrismaClient) {}
}
