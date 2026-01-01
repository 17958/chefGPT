// ============================================
// CART ROUTES - Handles shopping cart operations
// ============================================
// This file handles all shopping cart related requests

const express = require('express');
const Cart = require('../models/Cart'); // Cart database model
const MenuItem = require('../models/MenuItem'); // Menu item database model
const auth = require('../middleware/auth'); // Middleware to check if user is logged in

const router = express.Router();

// ============================================
// GET /api/cart - Get user's cart
// ============================================
// This returns all items currently in the user's shopping cart

router.get('/', auth, async (req, res) => {
  try {
    // Step 1: Find user's cart in database
    // req.user._id is the logged in user's ID (set by auth middleware)
    // .populate('items.menuItem') fills in the full menu item details
    // Without populate, we'd only get menu item IDs, not the full details
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
    
    // Step 2: If cart doesn't exist, create empty cart
    // This ensures every user has a cart (even if it's empty)
    if (!cart) {
      cart = new Cart({ 
        user: req.user._id, // Who owns this cart
        items: [] // Empty array means no items in cart
      });
      await cart.save(); // Save to database
    }
    
    // Step 3: Send cart to frontend
    res.json(cart);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Cart fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// POST /api/cart - Save/Update user's cart
// ============================================
// This saves or updates the items in user's shopping cart
// Frontend sends: { items: [{ menuItemId: "123", quantity: 2 }, ...] }

router.post('/', auth, async (req, res) => {
  try {
    console.log('Cart POST request received:', req.body); // Debug log
    
    // Step 1: Get items from request body
    const { items } = req.body;

    // Step 2: Validate that items is an array
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid cart items' });
    }

    // Step 3: Validate each item and get current prices
    // We need to check if menu items exist and get their current prices
    // We save the price at this moment, so even if price changes later,
    // the cart will have the old price (like a price lock)
    const cartItems = [];
    
    // Loop through each item in the cart
    for (const item of items) {
      // Find the menu item in database
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      // Check if menu item exists
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      
      // Add item to cart with current price
      cartItems.push({
        menuItem: menuItem._id, // Reference to menu item (like a link)
        quantity: item.quantity, // How many of this item
        price: menuItem.price // Current price (locked at this moment)
      });
    }

    // Step 4: Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      // If cart doesn't exist, create new one
      cart = new Cart({ 
        user: req.user._id, 
        items: cartItems 
      });
    } else {
      // If cart exists, update items (replace old items with new ones)
      cart.items = cartItems;
    }
    
    // Step 5: Save cart to database
    await cart.save();
    
    // Step 6: Fill in full menu item details
    // This replaces menu item IDs with full menu item objects
    await cart.populate('items.menuItem');
    
    // Step 7: Send updated cart to frontend
    res.json(cart);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Cart save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// DELETE /api/cart - Clear user's cart
// ============================================
// This removes all items from the cart (makes cart empty)

router.delete('/', auth, async (req, res) => {
  try {
    // Step 1: Find user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    
    // Step 2: If cart exists, clear all items
    if (cart) {
      cart.items = []; // Empty array = no items
      await cart.save(); // Save to database
    }
    
    // Step 3: Send success message
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Cart clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
