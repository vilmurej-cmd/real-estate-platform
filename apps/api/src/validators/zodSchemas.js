"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.updateTransactionSchema = exports.createTransactionSchema = exports.clientUpdateSchema = exports.clientCreateSchema = void 0;
const zod_1 = require("zod");
exports.clientCreateSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    stage: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    leadScore: zod_1.z.number().int().nonnegative().optional(),
    source: zod_1.z.string().optional(),
    preferences: zod_1.z.any().optional(),
    notes: zod_1.z.string().optional()
});
exports.clientUpdateSchema = exports.clientCreateSchema.partial();
exports.createTransactionSchema = zod_1.z.object({
    transactionType: zod_1.z.string().min(1),
    propertyAddress: zod_1.z.any(),
    listPrice: zod_1.z.string().optional(),
    finalPrice: zod_1.z.string().optional(),
    contractDate: zod_1.z.string().optional(),
    closingDate: zod_1.z.string().optional(),
    buyerClientId: zod_1.z.string().uuid().optional(),
    sellerClientId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.string().optional()
});
exports.updateTransactionSchema = exports.createTransactionSchema.partial();
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()).optional(),
    limit: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive()).optional()
}).partial();
