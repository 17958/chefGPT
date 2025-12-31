const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Get QR code payment info
router.post('/qr-info', auth, async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get UPI ID and merchant name from environment variables
    const upiId = process.env.UPI_ID || '';
    const merchantName = process.env.MERCHANT_NAME || 'ChefGPT';

    if (!upiId) {
      return res.status(503).json({ 
        message: 'UPI ID not configured. Please add UPI_ID to your environment variables' 
      });
    }

    res.json({
      upiId,
      merchantName,
      amount: amount.toFixed(2),
      orderId: order._id.toString()
    });
  } catch (error) {
    console.error('QR info error:', error);
    res.status(500).json({ message: 'Failed to get QR code info' });
  }
});

// Manual payment verification (for UPI payments)
router.post('/verify-manual', auth, async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update order with transaction ID and mark as verified
    // Note: In production, you should verify the transaction ID with your bank/UPI provider
    order.paymentStatus = 'verified';
    if (transactionId) {
      order.transactionId = transactionId;
    }
    await order.save();

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;
