const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
  res.send('To-Do API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
