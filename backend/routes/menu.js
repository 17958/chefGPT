// ============================================
// MENU ROUTES - Handles menu items (food items)
// ============================================
// This file handles all menu-related requests (getting food items)

const express = require('express');
const MenuItem = require('../models/MenuItem'); // Menu item database model
const auth = require('../middleware/auth'); // Middleware to check if user is logged in

const router = express.Router();

// ============================================
// GET /api/menu - Get all menu items
// ============================================
// This returns all available food items from the menu
// Only items marked as 'available' are returned

router.get('/', auth, async (req, res) => {
  try {
    // Step 1: Find all menu items that are available
    // { available: { $ne: false } } means: available is not false
    // This gets items where available is true or null (not explicitly false)
    // $ne means "not equal to"
    const menuItems = await MenuItem.find({ available: { $ne: false } })
      .sort({ category: 1, name: 1 }); // Sort by category first, then by name
      // 1 means ascending order (A to Z)
    
    // Step 2: Send menu items to frontend
    res.json(menuItems);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Menu fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET /api/menu/:id - Get single menu item by ID
// ============================================
// This returns details of one specific food item
// :id is a parameter in the URL (e.g., /api/menu/123)
// The colon (:) means it's a variable that can change

router.get('/:id', auth, async (req, res) => {
  try {
    // Step 1: Get menu item ID from URL
    // If URL is /api/menu/123, then req.params.id = "123"
    const menuItemId = req.params.id;
    
    // Step 2: Find menu item in database using the ID
    const menuItem = await MenuItem.findById(menuItemId);
    
    // Step 3: Check if menu item exists
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Step 4: Send menu item to frontend
    res.json(menuItem);
  } catch (error) {
    // If something goes wrong, log error and send error message
    console.error('Menu item fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
