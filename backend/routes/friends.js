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
    const user = await User.findById(req.user._id).populate('friends', 'name email');
    res.json({ friends: user.friends || [] });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
});

// POST /api/friends - Add friend by email (auto-onboard if not exists)
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
    
    console.log('Adding friend:', { friendEmail, userEmail, userId: req.user._id });

    // Find or create friend by email
    console.log('🔍 Looking for friend with email:', friendEmail);
    let friend = await User.findOne({ email: friendEmail });
    let isNewUser = false;
    let tempPassword = null;
    let nameFromEmail = friendEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (!friend) {
      console.log('📝 Friend not found, creating new user...');
      // Auto-onboard: Create new user with temporary password
      isNewUser = true;
      // Generate a secure temporary password (alphanumeric, no special chars that cause issues)
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      tempPassword = '';
      for (let i = 0; i < 16; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(friendEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Ensure name is valid
      if (!nameFromEmail || nameFromEmail.trim().length === 0) {
        nameFromEmail = 'Friend';
      }
      
      try {
        friend = new User({
          name: nameFromEmail.trim(),
          email: friendEmail,
          password: tempPassword, // Will be hashed by pre-save hook
          isAutoCreated: true, // Mark as auto-created so they can complete registration
          friends: []
        });
        
        // Explicitly set phone to undefined (not null) to avoid unique index conflicts
        // MongoDB unique indexes on optional fields can cause issues with null values
        friend.phone = undefined;
        
        // Validate before saving
        const validationError = friend.validateSync();
        if (validationError) {
          console.error('Validation error:', validationError);
          return res.status(400).json({ 
            message: 'Invalid user data',
            error: process.env.NODE_ENV === 'development' ? validationError.message : undefined
          });
        }
        
        await friend.save();
        console.log('✅ New friend user created:', friend._id, friend.email);
      } catch (createError) {
        console.error('User creation error details:', {
          code: createError.code,
          name: createError.name,
          message: createError.message,
          email: friendEmail
        });
        
        // If user creation fails (e.g., duplicate key), try to find the user again
        if (createError.code === 11000 || createError.name === 'MongoServerError') {
          const errorMessage = createError.message || '';
          
          // Check if it's a phone duplicate error (not email)
          if (errorMessage.includes('phone_1') || errorMessage.includes('phone')) {
            console.log('⚠️ Phone duplicate key error detected. Retrying without phone field...');
            // Try creating again but explicitly omitting phone field
            try {
              friend = new User({
                name: nameFromEmail.trim(),
                email: friendEmail,
                password: tempPassword,
                isAutoCreated: true,
                friends: []
              });
              // Explicitly set phone to undefined (not null) to avoid index conflict
              friend.phone = undefined;
              await friend.save();
              console.log('✅ New friend user created (without phone):', friend._id);
              isNewUser = true; // Keep as new user since we just created it
            } catch (retryError) {
              console.error('Retry creation also failed:', retryError.message);
              // Fall through to email duplicate handling
            }
          }
          
          // If still not created, check if it's an email duplicate or try to find existing user
          if (!friend) {
            console.log('⚠️ Duplicate key error, finding existing user by email...');
            // Wait a bit for race condition (user created between check and save)
            await new Promise(resolve => setTimeout(resolve, 200));
            friend = await User.findOne({ email: friendEmail });
            
            if (!friend) {
              // Try one more time with a longer wait
              await new Promise(resolve => setTimeout(resolve, 300));
              friend = await User.findOne({ email: friendEmail });
              
              if (!friend) {
                // Last resort: return a helpful error
                console.error('❌ User creation failed and user not found after duplicate error');
                return res.status(500).json({ 
                  message: 'Unable to create or find user. The email might already be registered. Please try again.',
                  error: process.env.NODE_ENV === 'development' ? createError.message : undefined
                });
              }
            }
            
            isNewUser = false; // User already exists
            nameFromEmail = friend.name || nameFromEmail;
            console.log('✅ Friend already existed, found existing user:', friend._id);
          }
        } else if (createError.name === 'ValidationError') {
          // Validation errors
          const errors = Object.values(createError.errors || {}).map(e => e.message).join(', ');
          return res.status(400).json({ 
            message: `Validation error: ${errors}`,
            error: process.env.NODE_ENV === 'development' ? createError.message : undefined
          });
        } else {
          // Other database errors
          console.error('Unexpected user creation error:', createError);
          return res.status(500).json({ 
            message: 'Failed to create user account. Please try again.',
            error: process.env.NODE_ENV === 'development' ? createError.message : undefined
          });
        }
      }
    } else {
      // Friend already exists - use their name
      nameFromEmail = friend.name;
      console.log('✅ Friend already exists:', friend._id);
    }
    
    // Always send invitation/notification email (whether new or existing)
    try {
      const { sendInvitationEmail } = require('../services/email');
      await sendInvitationEmail(friendEmail, nameFromEmail, req.user.name, isNewUser ? tempPassword : null);
      console.log('✅ Invitation email sent to:', friendEmail);
    } catch (emailError) {
      console.log('⚠️ Email invitation failed (non-critical):', emailError.message);
      // Continue even if email fails - friend is still added
    }

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
    console.log('Friend added successfully');

    // Populate and return
    await user.populate('friends', 'name email');
    res.json({ 
      message: isNewUser 
        ? 'Friend invited and added! They will receive an email with login details and signup link.' 
        : 'Friend added successfully! They will receive an email notification.',
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
      // Duplicate key error - friend might have been created between our check and save
      // Try to find and add them anyway
      try {
        const existingFriend = await User.findOne({ email: friendEmail });
        if (existingFriend) {
          const user = await User.findById(req.user._id);
          if (user) {
            const friendIdString = existingFriend._id.toString();
            const isAlreadyFriend = user.friends.some(fId => fId.toString() === friendIdString);
            
            if (!isAlreadyFriend) {
              user.friends.push(existingFriend._id);
              await user.save();
              
              // Send email notification
              try {
                const { sendInvitationEmail } = require('../services/email');
                await sendInvitationEmail(friendEmail, existingFriend.name, req.user.name, null);
              } catch (emailError) {
                console.log('Email failed (non-critical):', emailError.message);
              }
              
              await user.populate('friends', 'name email');
              return res.json({ 
                message: 'Friend added successfully! They will receive an email notification.',
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

