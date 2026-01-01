// ============================================
// ORDERS ROUTES - Handles order creation and management
// ============================================
// This file handles all order-related requests

const express = require('express');
const Order = require('../models/Order'); // Order database model
const MenuItem = require('../models/MenuItem'); // Menu item database model
const auth = require('../middleware/auth'); // Middleware to check if user is logged in
const { sendEmailNotification } = require('../services/email'); // Service to send email notifications

const router = express.Router();

// ============================================
// POST /api/orders - Create new order
// ============================================
// This creates a new order when user places an order
// Frontend sends: { items: [...], orderType: "take-away" or "dine-in" }

router.post('/', auth, async (req, res) => {
  try {
    // Step 1: Get order data from request body
    const { items, orderType, transactionId } = req.body;

    // Step 2: Validate that items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please add items to your order' });
    }

    // Step 3: Validate order type
    // Order type must be either "take-away" or "dine-in"
    if (!orderType || !['take-away', 'dine-in'].includes(orderType)) {
      return res.status(400).json({ message: 'Please select order type (take-away or dine-in)' });
    }

    // Step 4: Calculate total amount and validate items
    // We need to:
    // 1. Check if all menu items exist
    // 2. Check if all items are available
    // 3. Calculate total price
    let totalAmount = 0; // Start with 0
    const orderItems = []; // Array to store validated items

    // Loop through each item in the order
    for (const item of items) {
      // Find the menu item in database
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      // Check if menu item exists
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      
      // Check if menu item is available
      if (!menuItem.available) {
        return res.status(400).json({ message: `${menuItem.name} is not available` });
      }

      // Calculate price for this item: price × quantity
      // Example: Biryani costs ₹200, quantity is 2, so itemTotal = ₹400
      const itemTotal = menuItem.price * item.quantity;
      
      // Add to total amount
      totalAmount += itemTotal;
      
      // Add item to order items array
      orderItems.push({
        menuItem: menuItem._id, // Reference to menu item
        quantity: item.quantity, // How many
        price: menuItem.price // Price per item (locked at this moment)
      });
    }

    // Step 5: Create new order in database
    const order = new Order({
      user: req.user._id, // Who placed the order
      items: orderItems, // List of items
      orderType, // "take-away" or "dine-in"
      totalAmount, // Total price
      customerName: req.user.name, // Customer name
      customerPhone: '', // Phone not collected (removed from user model)
      customerEmail: req.user.email, // Customer email
      paymentStatus: 'pending' // Payment not verified yet
    });

    // Step 6: Save order to database
    await order.save();
    
    // Step 7: Fill in full menu item details
    // This replaces menu item IDs with full menu item objects
    await order.populate('items.menuItem');

    // Step 8: Send email notification to admin
    // We use try-catch so if email fails, order still gets created
    // (We don't want to fail the order just because email failed)
    try {
      await sendEmailNotification(order);
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the order if email fails
    }

    // Step 9: Send order back to frontend
    res.status(201).json(order); // 201 = Created
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET /api/orders - Get all user's orders
// ============================================
// This returns all orders placed by the logged in user

router.get('/', auth, async (req, res) => {
  try {
    // Step 1: Find all orders for this user
    // req.user._id is the logged in user's ID
    const orders = await Order.find({ user: req.user._id })
      .populate('items.menuItem') // Fill in menu item details
      .sort({ createdAt: -1 }); // Sort by newest first (-1 = descending)
      // -1 means newest first, 1 would mean oldest first
    
    // Step 2: Send orders to frontend
    res.json(orders);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET /api/orders/:id - Get single order by ID
// ============================================
// This returns details of one specific order
// :id is a parameter in the URL (e.g., /api/orders/123)

router.get('/:id', auth, async (req, res) => {
  try {
    // Step 1: Get order ID from URL
    const orderId = req.params.id;
    
    // Step 2: Find order in database
    const order = await Order.findById(orderId).populate('items.menuItem');
    
    // Step 3: Check if order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 4: Check if order belongs to this user
    // Users can only see their own orders (security check)
    // .toString() converts ObjectId to string for comparison
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Step 5: Send order to frontend
    res.json(order);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Order fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// PATCH /api/orders/:id/verify-payment - Verify payment manually
// ============================================
// This manually marks an order's payment as verified
// Usually payment is verified automatically, but this is a backup method
// TODO: Add admin authentication middleware (only admins should verify payments)

router.patch('/:id/verify-payment', auth, async (req, res) => {
  try {
    // Step 1: Get order ID from URL
    const orderId = req.params.id;
    
    // Step 2: Find order in database
    const order = await Order.findById(orderId);
    
    // Step 3: Check if order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 4: Check if order belongs to this user
    // TODO: Add admin role check (admins should be able to verify any order)
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Step 5: Mark payment as verified
    // In production, you should verify the transaction ID with your bank/UPI provider
    // For now, this is a manual process - admin verifies and updates
    order.paymentStatus = 'verified';
    await order.save();

    // Step 6: Send success message
    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
