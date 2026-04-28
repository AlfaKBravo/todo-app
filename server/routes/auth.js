const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const passport = require('passport');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, JWT_SECRET, { expiresIn: '1h' });
    const userStr = encodeURIComponent(JSON.stringify({ id: req.user.id, email: req.user.email }));
    res.redirect(`http://localhost:5173/login?token=${token}&user=${userStr}`);
  }
);

// Register User
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      return res.status(200).json({ 
        mfaRequired: true, 
        userId: user.id,
        message: 'MFA token required' 
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify MFA Token during Login
router.post('/mfa/verify', async (req, res) => {
  const { userId, token } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: jwtToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Setup MFA (Generate Secret)
router.post('/mfa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `TodoApp:${user.email}`
    });

    // Temporarily save secret (but don't enable yet)
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret.base32 }
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable MFA (Confirm first token)
router.post('/mfa/enable', authMiddleware, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true }
    });

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
