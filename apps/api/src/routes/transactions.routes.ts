import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/v1/transactions - List transactions with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
      }),
      prisma.transaction.count(),
    ]);

    res.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/transactions - Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { propertyId, clientId, amount, status } = req.body;

    // Basic validation
    if (!propertyId || !clientId || !amount) {
      return res.status(400).json({ error: 'PropertyId, clientId, and amount are required' });
    }

    const transaction = await prisma.transaction.create({
      data: { propertyId, clientId, amount, status },
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/transactions/:id - Get a specific transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/transactions/:id - Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyId, clientId, amount, status } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { propertyId, clientId, amount, status },
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/transactions/:id - Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
