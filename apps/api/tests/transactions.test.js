"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const transactions_routes_1 = __importDefault(require("../src/routes/transactions.routes"));
// Mock the shared Prisma client
jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        transaction: {
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));
// Mock auth middleware
jest.mock('../src/middleware/auth0.middleware');
describe('Transactions API', () => {
    let app;
    let prisma;
    beforeEach(() => {
        // Create a new Express app for each test
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/v1/transactions', transactions_routes_1.default);
        // Get the mocked Prisma instance
        prisma = require('../src/lib/prisma').default;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/v1/transactions', () => {
        it('should return paginated transactions data', async () => {
            const mockTransactions = [
                { id: '1', propertyId: 'prop1', clientId: 'client1', amount: 250000, status: 'pending' },
                { id: '2', propertyId: 'prop2', clientId: 'client2', amount: 300000, status: 'completed' },
            ];
            prisma.transaction.findMany.mockResolvedValue(mockTransactions);
            prisma.transaction.count.mockResolvedValue(2);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions')
                .expect(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.data).toEqual(mockTransactions);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                pages: 1,
            });
            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
            });
            expect(prisma.transaction.count).toHaveBeenCalled();
        });
        it('should handle pagination parameters', async () => {
            const mockTransactions = [
                { id: '3', propertyId: 'prop3', clientId: 'client3', amount: 400000, status: 'pending' },
            ];
            prisma.transaction.findMany.mockResolvedValue(mockTransactions);
            prisma.transaction.count.mockResolvedValue(30);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions?page=3&limit=5')
                .expect(200);
            expect(response.body.pagination).toEqual({
                page: 3,
                limit: 5,
                total: 30,
                pages: 6,
            });
            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                skip: 10,
                take: 5,
            });
        });
        it('should handle errors gracefully', async () => {
            prisma.transaction.findMany.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions')
                .expect(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('POST /api/v1/transactions', () => {
        it('should create a new transaction with valid data', async () => {
            const newTransaction = {
                propertyId: 'prop4',
                clientId: 'client4',
                amount: 350000,
                status: 'pending',
            };
            const createdTransaction = {
                id: '4',
                ...newTransaction,
            };
            prisma.transaction.create.mockResolvedValue(createdTransaction);
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions')
                .send(newTransaction)
                .expect(201);
            expect(response.body).toEqual(createdTransaction);
            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: newTransaction,
            });
        });
        it('should validate required fields', async () => {
            const invalidTransaction = {
                status: 'pending',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions')
                .send(invalidTransaction)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('PropertyId, clientId, and amount are required');
            expect(prisma.transaction.create).not.toHaveBeenCalled();
        });
        it('should handle database errors', async () => {
            const newTransaction = {
                propertyId: 'prop5',
                clientId: 'client5',
                amount: 450000,
                status: 'completed',
            };
            prisma.transaction.create.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/transactions')
                .send(newTransaction)
                .expect(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('GET /api/v1/transactions/:id', () => {
        it('should return a transaction by id', async () => {
            const mockTransaction = {
                id: '1',
                propertyId: 'prop1',
                clientId: 'client1',
                amount: 250000,
                status: 'pending',
            };
            prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/1')
                .expect(200);
            expect(response.body).toEqual(mockTransaction);
            expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
        it('should return 404 if transaction not found', async () => {
            prisma.transaction.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/transactions/999')
                .expect(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Transaction not found');
        });
    });
    describe('PUT /api/v1/transactions/:id', () => {
        it('should update a transaction', async () => {
            const updatedData = {
                propertyId: 'prop1-updated',
                clientId: 'client1-updated',
                amount: 275000,
                status: 'completed',
            };
            const updatedTransaction = {
                id: '1',
                ...updatedData,
            };
            prisma.transaction.update.mockResolvedValue(updatedTransaction);
            const response = await (0, supertest_1.default)(app)
                .put('/api/v1/transactions/1')
                .send(updatedData)
                .expect(200);
            expect(response.body).toEqual(updatedTransaction);
            expect(prisma.transaction.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: updatedData,
            });
        });
        it('should handle update errors', async () => {
            prisma.transaction.update.mockRejectedValue(new Error('Update error'));
            const response = await (0, supertest_1.default)(app)
                .put('/api/v1/transactions/1')
                .send({ amount: 300000 })
                .expect(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('DELETE /api/v1/transactions/:id', () => {
        it('should delete a transaction', async () => {
            prisma.transaction.delete.mockResolvedValue({});
            const response = await (0, supertest_1.default)(app)
                .delete('/api/v1/transactions/1')
                .expect(204);
            expect(response.body).toEqual({});
            expect(prisma.transaction.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
        it('should handle delete errors', async () => {
            prisma.transaction.delete.mockRejectedValue(new Error('Delete error'));
            const response = await (0, supertest_1.default)(app)
                .delete('/api/v1/transactions/1')
                .expect(500);
            expect(response.body).toHaveProperty('error');
        });
    });
});
