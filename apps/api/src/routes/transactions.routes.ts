import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAuth0 } from '../middleware/auth0.middleware';
import { requireRole } from '../middleware/role.middleware';
import { createTransactionSchema, updateTransactionSchema, paginationSchema } from '../validators/zodSchemas';
import { validateBody, validateQuery } from '../middleware/validate.middleware';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/transactions
router.get('/', authenticateAuth0, validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const page = Number((req.query as any).page || 1);
    const limit = Number((req.query as any).limit || 25);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, skip, take: limit }),
      prisma.transaction.count({ where: { userId } })
    ]);

    res.json({ data: items, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/transactions
router.post('/', authenticateAuth0, requireRole(['agent', 'admin']), validateBody(createTransactionSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub;
    const payload = req.body;
    const created = await prisma.transaction.create({ data: { ...payload, userId } });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', authenticateAuth0, async (req, res, next) => {
  try {
    const { id } = req.params;
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/transactions/:id
router.put('/:id', authenticateAuth0, requireRole(['agent', 'admin']), validateBody(updateTransactionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.transaction.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Transaction not found' });
    next(err);
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', authenticateAuth0, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Transaction not found' });
    next(err);
  }
});

export default router;