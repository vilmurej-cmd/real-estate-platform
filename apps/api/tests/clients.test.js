"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const clients_routes_1 = __importDefault(require("../src/routes/clients.routes"));
// Mock the shared Prisma client
jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        client: {
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
describe('Clients API', () => {
    let app;
    let prisma;
    beforeEach(() => {
        // Create a new Express app for each test
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/v1/clients', clients_routes_1.default);
        // Get the mocked Prisma instance
        prisma = require('../src/lib/prisma').default;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/v1/clients', () => {
        it('should return paginated clients data', async () => {
            const mockClients = [
                { id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321' },
            ];
            prisma.client.findMany.mockResolvedValue(mockClients);
            prisma.client.count.mockResolvedValue(2);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/clients')
                .expect(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.data).toEqual(mockClients);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                pages: 1,
            });
            expect(prisma.client.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
            });
            expect(prisma.client.count).toHaveBeenCalled();
        });
        it('should handle pagination parameters', async () => {
            const mockClients = [
                { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-555-5555' },
            ];
            prisma.client.findMany.mockResolvedValue(mockClients);
            prisma.client.count.mockResolvedValue(25);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/clients?page=2&limit=5')
                .expect(200);
            expect(response.body.pagination).toEqual({
                page: 2,
                limit: 5,
                total: 25,
                pages: 5,
            });
            expect(prisma.client.findMany).toHaveBeenCalledWith({
                skip: 5,
                take: 5,
            });
        });
        it('should handle errors gracefully', async () => {
            prisma.client.findMany.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/clients')
                .expect(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('POST /api/v1/clients', () => {
        it('should create a new client with valid data', async () => {
            const newClient = {
                name: 'Alice Williams',
                email: 'alice@example.com',
                phone: '111-222-3333',
            };
            const createdClient = {
                id: '4',
                ...newClient,
            };
            prisma.client.create.mockResolvedValue(createdClient);
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/clients')
                .send(newClient)
                .expect(201);
            expect(response.body).toEqual(createdClient);
            expect(prisma.client.create).toHaveBeenCalledWith({
                data: newClient,
            });
        });
        it('should validate required fields', async () => {
            const invalidClient = {
                phone: '111-222-3333',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/clients')
                .send(invalidClient)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Name and email are required');
            expect(prisma.client.create).not.toHaveBeenCalled();
        });
        it('should handle database errors', async () => {
            const newClient = {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                phone: '444-555-6666',
            };
            prisma.client.create.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/clients')
                .send(newClient)
                .expect(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('GET /api/v1/clients/:id', () => {
        it('should return a client by id', async () => {
            const mockClient = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '123-456-7890',
            };
            prisma.client.findUnique.mockResolvedValue(mockClient);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/clients/1')
                .expect(200);
            expect(response.body).toEqual(mockClient);
            expect(prisma.client.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
        it('should return 404 if client not found', async () => {
            prisma.client.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/clients/999')
                .expect(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Client not found');
        });
    });
    describe('PUT /api/v1/clients/:id', () => {
        it('should update a client', async () => {
            const updatedData = {
                name: 'John Doe Updated',
                email: 'john.updated@example.com',
                phone: '999-999-9999',
            };
            const updatedClient = {
                id: '1',
                ...updatedData,
            };
            prisma.client.update.mockResolvedValue(updatedClient);
            const response = await (0, supertest_1.default)(app)
                .put('/api/v1/clients/1')
                .send(updatedData)
                .expect(200);
            expect(response.body).toEqual(updatedClient);
            expect(prisma.client.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: updatedData,
            });
        });
        it('should handle update errors', async () => {
            prisma.client.update.mockRejectedValue(new Error('Update error'));
            const response = await (0, supertest_1.default)(app)
                .put('/api/v1/clients/1')
                .send({ name: 'Test' })
                .expect(500);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('DELETE /api/v1/clients/:id', () => {
        it('should delete a client', async () => {
            prisma.client.delete.mockResolvedValue({});
            const response = await (0, supertest_1.default)(app)
                .delete('/api/v1/clients/1')
                .expect(204);
            expect(response.body).toEqual({});
            expect(prisma.client.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
        it('should handle delete errors', async () => {
            prisma.client.delete.mockRejectedValue(new Error('Delete error'));
            const response = await (0, supertest_1.default)(app)
                .delete('/api/v1/clients/1')
                .expect(500);
            expect(response.body).toHaveProperty('error');
        });
    });
});
