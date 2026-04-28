const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Protect all todo routes
router.use(authMiddleware);

// Get all todos for a user
router.get('/', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(todos);
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
        title,
        userId: req.user.userId,
      },
    });
    res.status(201).json(todo);
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
        title: title !== undefined ? title : existingTodo.title,
        completed: completed !== undefined ? completed : existingTodo.completed,
      },
    });
    res.json(todo);
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
    res.json({ message: 'Todo removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
