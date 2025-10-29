"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth0_middleware_1 = require("../middleware/auth0.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const zodSchemas_1 = require("../validators/zodSchemas");
const validate_middleware_1 = require("../middleware/validate.middleware");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// GET /api/v1/transactions
router.get('/', auth0_middleware_1.authenticateAuth0, (0, validate_middleware_1.validateQuery)(zodSchemas_1.paginationSchema), async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 25);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma.transaction.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, skip, take: limit }),
            prisma.transaction.count({ where: { userId } })
        ]);
        res.json({ data: items, meta: { total, page, limit } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/transactions
router.post('/', auth0_middleware_1.authenticateAuth0, (0, role_middleware_1.requireRole)(['agent', 'admin']), (0, validate_middleware_1.validateBody)(zodSchemas_1.createTransactionSchema), async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        const payload = req.body;
        const created = await prisma.transaction.create({ data: { ...payload, userId } });
        res.status(201).json(created);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/transactions/:id
router.get('/:id', auth0_middleware_1.authenticateAuth0, async (req, res, next) => {
    try {
        const { id } = req.params;
        const tx = await prisma.transaction.findUnique({ where: { id } });
        if (!tx)
            return res.status(404).json({ error: 'Transaction not found' });
        res.json(tx);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/transactions/:id
router.put('/:id', auth0_middleware_1.authenticateAuth0, (0, role_middleware_1.requireRole)(['agent', 'admin']), (0, validate_middleware_1.validateBody)(zodSchemas_1.updateTransactionSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await prisma.transaction.update({ where: { id }, data: req.body });
        res.json(updated);
    }
    catch (err) {
        if (err?.code === 'P2025')
            return res.status(404).json({ error: 'Transaction not found' });
        next(err);
    }
});
// DELETE /api/v1/transactions/:id
router.delete('/:id', auth0_middleware_1.authenticateAuth0, (0, role_middleware_1.requireRole)(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.transaction.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        if (err?.code === 'P2025')
            return res.status(404).json({ error: 'Transaction not found' });
        next(err);
    }
});
exports.default = router;
