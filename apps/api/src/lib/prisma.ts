import { PrismaClient } from '@prisma/client';

// Shared Prisma client instance to avoid connection pool exhaustion
const prisma = new PrismaClient();

export default prisma;
