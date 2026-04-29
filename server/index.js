const express = require('express');
const cors = require('cors');
require('dotenv').config();

const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session and Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_keyboard_cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true if using HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.send('To-Do API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
