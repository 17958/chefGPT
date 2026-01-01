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
// POST /api/auth/auth - Login
// ============================================
// Login with email and password

router.post('/auth', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter your email' });
    }
    
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication failed. Try again!' });
  }
});

// ============================================
// POST /api/auth/signup - Signup
// ============================================
// Create new user with email, name, and password

router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter your email' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Generate name from email (e.g., "john.doe@example.com" -> "John Doe")
    const nameFromEmail = cleanEmail.split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'User';
    
    console.log('Processing signup for:', cleanEmail);

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    
    if (existingUser) {
      // User already exists
      console.log(`Signup attempt for existing user: ${cleanEmail}`);
      return res.status(409).json({ 
        message: 'Email already registered. Please sign in!',
        suggestSignIn: true
      });
    }
    
    // Create new user (password will be hashed by pre-save hook)
    const user = new User({ 
      name: nameFromEmail, 
      email: cleanEmail,
      password: password,
      friends: []
    });
    await user.save();
    console.log(`New user created: ${cleanEmail}`);

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      return res.status(409).json({ 
        message: 'Email already registered. Please sign in!',
        suggestSignIn: true
      });
    }
    
    // Return proper error message for signup
    res.status(500).json({ 
      message: 'Registration failed. Please try again. If the problem persists, contact support.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// GET /api/auth/check-email/:email - Check user status by email (for smart email links)
// ============================================
// This endpoint checks if a user exists and their status (for email invitation links)
// Returns: { exists: true/false, isAutoCreated: true/false, shouldSignUp: true/false }

router.get('/check-email/:email', async (req, res) => {
  try {
    const email = req.params.email?.trim().toLowerCase();
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // User doesn't exist - should sign up
      return res.json({
        exists: false,
        shouldSignUp: true,
        redirectTo: 'signup'
      });
    }
    
    // User exists - should sign in
    return res.json({
      exists: true,
      shouldSignUp: false,
      redirectTo: 'signin'
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Error checking email status' });
  }
});

// ============================================
// GET /api/auth/me - Get current logged in user
// ============================================
// This endpoint returns information about the currently logged in user
// The 'auth' middleware checks if user is logged in before allowing access

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name email');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        friends: user.friends || []
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

module.exports = router;
