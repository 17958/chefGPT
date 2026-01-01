// ============================================
// FRIENDS ROUTES - Manage friends list
// ============================================

const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Handle OPTIONS preflight
router.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  if (!process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// GET /api/friends - Get all friends
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Fetching friends for user:', req.user._id);
    const user = await User.findById(req.user._id).populate('friends', 'name email');
    
    if (!user) {
      console.error('❌ User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found', friends: [] });
    }
    
    console.log('✅ Found user with', user.friends?.length || 0, 'friends');
    res.json({ friends: user.friends || [] });
  } catch (error) {
    console.error('❌ Get friends error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    res.status(500).json({ message: 'Failed to fetch friends', friends: [] });
  }
});

// POST /api/friends - Add friend by email
router.post('/', auth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please provide friend email' });
    }

    const friendEmail = email.trim().toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();
    
    // Can't add yourself
    if (friendEmail === userEmail) {
      return res.status(400).json({ message: 'You cannot add yourself as a friend' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(friendEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    console.log('Adding friend:', { friendEmail, userEmail, userId: req.user._id });

    // Find friend by email
    console.log('🔍 Looking for friend with email:', friendEmail);
    const friend = await User.findOne({ email: friendEmail });
    
    if (!friend) {
      // Friend doesn't exist - ask them to sign up first
      console.log('📝 Friend not found. They need to sign up first.');
      return res.status(404).json({ 
        message: 'Friend not found. Please ask your friend to sign up in ChefGPT first, then add them again.',
        friends: []
      });
    }
    
    console.log('✅ Friend found:', friend._id);

    // Get user and check if already friends
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already friends (compare as strings to avoid ObjectId issues)
    const friendIdString = friend._id.toString();
    const isAlreadyFriend = user.friends.some(fId => fId.toString() === friendIdString);
    
    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Add friend
    user.friends.push(friend._id);
    await user.save();
    console.log('✅ Friend added to user list:', friend._id);

    // Populate and return friends list
    await user.populate('friends', 'name email');
    console.log('📋 Returning friends list with', user.friends.length, 'friends');
    res.json({ 
      message: 'Friend added successfully! You can now chat with them in real-time.',
      friends: user.friends 
    });
  } catch (error) {
    console.error('Add friend error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      email: req.body.email,
      userId: req.user?._id
    });
    
    // Provide more specific error messages
    if (error.code === 11000) {
      // Duplicate key error - friend might have been added between our check and save
      // Try to find and add them anyway
      try {
        const friendEmail = req.body.email?.trim().toLowerCase();
        const existingFriend = await User.findOne({ email: friendEmail });
        if (existingFriend) {
          const user = await User.findById(req.user._id);
          if (user) {
            const friendIdString = existingFriend._id.toString();
            const isAlreadyFriend = user.friends.some(fId => fId.toString() === friendIdString);
            
            if (!isAlreadyFriend) {
              user.friends.push(existingFriend._id);
              await user.save();
              
              await user.populate('friends', 'name email');
              return res.json({ 
                message: 'Friend added successfully! You can now chat with them in real-time.',
                friends: user.friends 
              });
            } else {
              return res.status(400).json({ message: 'Already friends with this user' });
            }
          }
        }
      } catch (e) {
        console.error('Error handling duplicate:', e);
      }
      return res.status(409).json({ message: 'Friend already exists. Please try again.' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation error: ${error.message}` });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    res.status(500).json({ 
      message: error.message || 'Failed to add friend. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/friends/:friendId - Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.friends = user.friends.filter(
      friendId => friendId.toString() !== req.params.friendId
    );
    await user.save();

    await user.populate('friends', 'name email');
    res.json({ 
      message: 'Friend removed successfully',
      friends: user.friends 
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

module.exports = router;

