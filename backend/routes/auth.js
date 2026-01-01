// ============================================
// AUTH ROUTES - Handles user login and signup
// ============================================
// This file handles all authentication (login/signup) related requests

const express = require('express');
const jwt = require('jsonwebtoken'); // Library to create and verify tokens
const User = require('../models/User'); // User database model
const auth = require('../middleware/auth'); // Middleware to check if user is logged in

const router = express.Router();

// Handle OPTIONS preflight for all routes in this router
// This allows browser to check if it can make requests before actually making them
router.options('*', (req, res) => {
  const origin = req.headers.origin; // Where request is coming from
  const allowedOrigins = [
    'http://localhost:3000', // Local React app
    process.env.FRONTEND_URL // Production frontend
  ].filter(Boolean); // Remove empty values
  
  // Allow if: FRONTEND_URL not set OR origin is in allowed list OR not in production
  if (!process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200); // Say "OK, you have permission!"
  } else {
    res.sendStatus(403); // Say "No permission!"
  }
});

// ============================================
// POST /api/auth/auth - Login or Signup
// ============================================
// This endpoint does BOTH login AND signup
// If user exists → login (return existing user)
// If user doesn't exist → create new user (signup)

router.post('/auth', async (req, res) => {
  try {
    // Step 1: Get phone number from request body
    // Frontend sends: { phone: "9876543210" }
    const { phone } = req.body;

    // Step 2: Validate phone number
    // Check if phone number exists
    if (!phone) {
      return res.status(400).json({ message: 'Where\'s your number?' });
    }
    
    // Check if phone is a string (text)
    if (typeof phone !== 'string') {
      return res.status(400).json({ message: 'That\'s not a number!' });
    }

    // Remove spaces from start and end
    const trimmedPhone = phone.trim();
    
    // Check if phone is not empty after trimming
    if (trimmedPhone.length === 0) {
      return res.status(400).json({ message: 'Empty? Really?' });
    }

    // Step 3: Clean phone number
    // Remove all non-digit characters (spaces, dashes, plus signs, etc.)
    // Example: "+91 98765-43210" becomes "919876543210"
    // \D means "anything that's not a digit"
    const cleanPhone = trimmedPhone.replace(/\D/g, '');
    
    // Step 4: Check if phone number is exactly 10 digits
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Enter valid mobile number' });
    }

    // Step 5: Check if user already exists in database
    // We search for user with this phone number
    let user = await User.findOne({ phone: cleanPhone });
    let isNewUser = false; // Track if this is a new user

    // Step 6: If user doesn't exist, create new user
    if (!user) {
      isNewUser = true; // Mark as new user
      
      // Create default name using last 4 digits of phone
      // Example: phone "9876543210" → name "User 3210"
      const defaultName = `User ${cleanPhone.slice(-4)}`;
      
      // Create new user object
      user = new User({ 
        name: defaultName, 
        phone: cleanPhone 
      });
      
      // Save user to database
      try {
        await user.save();
      } catch (saveError) {
        console.error('User save error:', saveError);
        
        // If there are validation errors, send them to frontend
        if (saveError.errors) {
          const fieldErrors = Object.keys(saveError.errors).map(key => saveError.errors[key].message);
          return res.status(400).json({ message: fieldErrors.join(', ') });
        }
        throw saveError; // Re-throw if it's a different error
      }
    }

    // Step 7: Create JWT token
    // Token is like a temporary ID card that proves user is logged in
    // It contains userId and expires in 7 days
    // Frontend will send this token with every request to prove user is logged in
    const token = jwt.sign(
      { userId: user._id }, // Data stored in token (user's ID)
      process.env.JWT_SECRET || 'fallback-secret', // Secret key to sign token (like a password to create tokens)
      { expiresIn: '7d' } // Token expires in 7 days (like ID card expiry)
    );

    // Step 8: Send response to frontend
    // Frontend will use this token for all future requests
    res.json({
      token, // The token (like a session ID)
      user: {
        id: user._id, // User's ID
        name: user.name, // User's name
        phone: user.phone, // User's phone
        email: user.email || null // User's email (if exists)
      },
      isNewUser // true if just signed up, false if logged in
    });
  } catch (error) {
    console.error('Auth error:', error);
    console.error('Auth error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    // If user already exists (duplicate phone number)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already registered! Just sign in!' });
    }
    
    // Any other error - send more details in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Oops! Something broke. Try again!' 
      : error.message || 'Oops! Something broke. Try again!';
    
    res.status(500).json({ message: errorMessage });
  }
});

// ============================================
// GET /api/auth/me - Get current logged in user
// ============================================
// This endpoint returns information about the currently logged in user
// The 'auth' middleware checks if user is logged in before allowing access

router.get('/me', auth, async (req, res) => {
  // req.user is set by auth middleware
  // It contains the logged in user's information
  // (like showing your visitor badge with your name)
  res.json({
    user: {
      id: req.user._id, // User's ID
      name: req.user.name, // User's name
      phone: req.user.phone, // User's phone
      email: req.user.email || null // User's email (if exists)
    }
  });
});

module.exports = router;
