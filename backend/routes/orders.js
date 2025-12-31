const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const { sendEmailNotification } = require('../services/email');

const router = express.Router();

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, orderType, transactionId } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please add items to your order' });
    }

    if (!orderType || !['take-away', 'dine-in'].includes(orderType)) {
      return res.status(400).json({ message: 'Please select order type (take-away or dine-in)' });
    }

    // Create order first (payment will be verified via Razorpay)
    // Order is created with paymentStatus: 'pending'

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ message: `${menuItem.name} is not available` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      orderType,
      totalAmount,
      customerName: req.user.name,
      customerPhone: req.user.phone,
      customerEmail: req.user.email,
      paymentStatus: 'pending'
    });

    await order.save();
    await order.populate('items.menuItem');

    // Send email notification
    try {
      await sendEmailNotification(order);
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to verify payment (manual verification)
// TODO: Add admin authentication middleware
router.patch('/:id/verify-payment', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    // TODO: Add admin role check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify payment by checking transaction ID against bank records
    // For now, this is a manual process - admin verifies and updates
    order.paymentStatus = 'verified';
    await order.save();

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

