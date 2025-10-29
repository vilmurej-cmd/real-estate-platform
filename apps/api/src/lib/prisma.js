"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Shared Prisma client instance to avoid connection pool exhaustion
const prisma = new client_1.PrismaClient();
exports.default = prisma;
