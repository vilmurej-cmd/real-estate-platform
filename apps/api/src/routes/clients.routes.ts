import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/clients - List clients with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        skip,
        take: limit,
      }),
      prisma.client.count(),
    ]);

    res.json({
      data: clients,
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

// POST /api/v1/clients - Create a new client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const client = await prisma.client.create({
      data: { name, email, phone },
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/clients/:id - Get a specific client
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/clients/:id - Update a client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: { name, email, phone },
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/clients/:id - Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
