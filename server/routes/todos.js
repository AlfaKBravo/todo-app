const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/crypto');
const authMiddleware = require('../middleware/auth');
const redisClient = require('../utils/redis');

const router = express.Router();
const prisma = new PrismaClient();

// Protect all todo routes
router.use(authMiddleware);

// Get all todos for a user
router.get('/', async (req, res) => {
  const cacheKey = `todos:${req.user.userId}`;
  try {
    // Try to fetch from Redis
    const cachedTodos = await redisClient.get(cacheKey);
    if (cachedTodos) {
      console.log('Cache Hit: Returning todos from Redis');
      return res.json(JSON.parse(cachedTodos));
    }

    console.log('Cache Miss: Fetching todos from Database');
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt titles
    const decryptedTodos = todos.map(todo => ({
      ...todo,
      title: decrypt(todo.title)
    }));

    // Store in Redis with 1 hour TTL
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(decryptedTodos));
    
    res.json(decryptedTodos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a todo
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  try {
    const todo = await prisma.todo.create({
      data: {
        title: encrypt(title),
        userId: req.user.userId,
      },
    });

    // Return decrypted to frontend
    const responseTodo = { ...todo, title: decrypt(todo.title) };

    // Invalidate Cache
    await redisClient.del(`todos:${req.user.userId}`);

    res.status(201).json(responseTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a todo (e.g. mark as completed)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    // Ensure the user owns this todo
    const existingTodo = await prisma.todo.findUnique({ where: { id: Number(id) } });
    if (!existingTodo || existingTodo.userId !== req.user.userId) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const todo = await prisma.todo.update({
      where: { id: Number(id) },
      data: {
        title: title !== undefined ? encrypt(title) : existingTodo.title,
        completed: completed !== undefined ? completed : existingTodo.completed,
      },
    });

    // Return decrypted
    const responseTodo = { ...todo, title: decrypt(todo.title) };

    // Invalidate Cache
    await redisClient.del(`todos:${req.user.userId}`);

    res.json(responseTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existingTodo = await prisma.todo.findUnique({ where: { id: Number(id) } });
    if (!existingTodo || existingTodo.userId !== req.user.userId) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    await prisma.todo.delete({ where: { id: Number(id) } });

    // Invalidate Cache
    await redisClient.del(`todos:${req.user.userId}`);

    res.json({ message: 'Todo removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
