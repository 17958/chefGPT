const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Unified Auth - Handles both sign in and sign up
router.post('/auth', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({ message: 'Where\'s your number?' });
    }
    
    if (typeof phone !== 'string') {
      return res.status(400).json({ message: 'That\'s not a number!' });
    }

    const trimmedPhone = phone.trim();
    
    if (trimmedPhone.length === 0) {
      return res.status(400).json({ message: 'Empty? Really?' });
    }

    // Clean phone number
    const cleanPhone = trimmedPhone.replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Enter valid mobile number' });
    }

    // Check if user exists
    let user = await User.findOne({ phone: cleanPhone });
    let isNewUser = false;

    // If user doesn't exist, create new one
    if (!user) {
      isNewUser = true;
      const defaultName = `User ${cleanPhone.slice(-4)}`;
      
      user = new User({ 
        name: defaultName, 
        phone: cleanPhone 
      });
      
      try {
        await user.save();
      } catch (saveError) {
        console.error('User save error:', saveError);
        if (saveError.errors) {
          const fieldErrors = Object.keys(saveError.errors).map(key => saveError.errors[key].message);
          return res.status(400).json({ message: fieldErrors.join(', ') });
        }
        throw saveError;
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name || `User ${cleanPhone.slice(-4)}`,
        phone: user.phone,
        email: user.email || null
      },
      isNewUser
    });
  } catch (error) {
    console.error('Auth error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already registered! Just sign in!' });
    }
    res.status(500).json({ message: 'Oops! Something broke. Try again!' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email || null
    }
  });
});

module.exports = router;

