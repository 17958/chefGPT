const express = require('express');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all menu items (protected route)
router.get('/', auth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ available: { $ne: false } }).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    console.error('Menu item fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

