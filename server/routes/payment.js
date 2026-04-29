const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const options = {
      amount: 19900, // ₹199.00 in paise
      currency: 'INR',
      receipt: `receipt_${req.user.userId}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Verify payment
router.post('/verify', authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature === expectedSign) {
    // Payment verified
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { isPro: true },
    });
    return res.json({ message: 'Payment verified successfully and account upgraded to Pro!' });
  } else {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }
});

module.exports = router;
