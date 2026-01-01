// ============================================
// PAYMENTS ROUTES - Handles payment processing
// ============================================
// This file handles all payment-related requests
// Currently uses UPI QR code payments

const express = require('express');
const Order = require('../models/Order'); // Order database model
const auth = require('../middleware/auth'); // Middleware to check if user is logged in

const router = express.Router();

// ============================================
// POST /api/payments/qr-info - Get QR code payment info
// ============================================
// This returns UPI ID and payment details for generating QR code
// Frontend will use this to show QR code to user

router.post('/qr-info', auth, async (req, res) => {
  try {
    // Step 1: Get amount and order ID from request
    const { amount, orderId } = req.body;

    // Step 2: Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Step 3: Validate order ID
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Step 4: Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 5: Check if order belongs to this user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Step 6: Get UPI ID and merchant name from environment variables
    // UPI ID is like "merchant@paytm" or "merchant@phonepe"
    // These are stored in .env file
    const upiId = process.env.UPI_ID || '';
    const merchantName = process.env.MERCHANT_NAME || 'ChefGPT';

    // Step 7: Check if UPI ID is configured
    if (!upiId) {
      return res.status(503).json({ 
        message: 'UPI ID not configured. Please add UPI_ID to your environment variables' 
      });
    }

    // Step 8: Send payment info to frontend
    // Frontend will use this to generate QR code
    res.json({
      upiId, // UPI ID for payment
      merchantName, // Name of merchant (restaurant)
      amount: amount.toFixed(2), // Amount with 2 decimal places
      orderId: order._id.toString() // Order ID
    });
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('QR info error:', error);
    res.status(500).json({ message: 'Failed to get QR code info' });
  }
});

// ============================================
// POST /api/payments/verify-manual - Manual payment verification
// ============================================
// This manually verifies payment after user pays via UPI
// User enters transaction ID after making payment
// Note: In production, you should verify transaction ID with your bank/UPI provider

router.post('/verify-manual', auth, async (req, res) => {
  try {
    // Step 1: Get order ID and transaction ID from request
    const { orderId, transactionId } = req.body;

    // Step 2: Validate order ID
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Step 3: Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 4: Check if order belongs to this user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Step 5: Update order with transaction ID and mark as verified
    // Note: In production, you should verify the transaction ID with your bank/UPI provider
    // For now, we trust the user (not recommended for production!)
    order.paymentStatus = 'verified';
    if (transactionId) {
      order.transactionId = transactionId; // Save transaction ID
    }
    await order.save();

    // Step 6: Send success message
    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Manual verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;
