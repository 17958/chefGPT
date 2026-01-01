// ============================================
// FRIENDS ROUTES - Manage friends list
// ============================================

const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// Store io instance for socket notifications
let ioInstance = null;
router.setIO = (io) => {
  ioInstance = io;
};

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

// GET /api/friends - Get all friends and pending requests
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Fetching friends for user:', req.user._id);
    const user = await User.findById(req.user._id).populate('friends', 'name email');
    
    if (!user) {
      console.error('❌ User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found', friends: [], pendingRequests: [] });
    }
    
    // Get pending friend requests (sent and received)
    const sentRequests = await FriendRequest.find({ 
      from: req.user._id, 
      status: 'pending' 
    }).populate('to', 'name email');
    
    const receivedRequests = await FriendRequest.find({ 
      to: req.user._id, 
      status: 'pending' 
    }).populate('from', 'name email');
    
    console.log('✅ Found user with', user.friends?.length || 0, 'friends');
    res.json({ 
      friends: user.friends || [],
      pendingRequests: {
        sent: sentRequests.map(r => ({ id: r._id, user: r.to })),
        received: receivedRequests.map(r => ({ id: r._id, user: r.from }))
      }
    });
  } catch (error) {
    console.error('❌ Get friends error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    res.status(500).json({ message: 'Failed to fetch friends', friends: [], pendingRequests: [] });
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
    // IMPORTANT: We do NOT create users here - they must sign up first!
    console.log('🔍 Looking for friend with email:', friendEmail);
    const friend = await User.findOne({ email: friendEmail });
    
    if (!friend) {
      // Friend doesn't exist - they must sign up first (NO AUTO-CREATION)
      console.log('📝 Friend not found. They need to sign up first. (No user will be created)');
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

    // Check if there's already a pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: friend._id, status: 'pending' },
        { from: friend._id, to: req.user._id, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: existingRequest.from.toString() === req.user._id.toString() 
          ? 'Friend request already sent. Waiting for response.'
          : 'You already have a pending request from this user. Please accept or reject it.'
      });
    }

    // Create friend request instead of directly adding
    const friendRequest = new FriendRequest({
      from: req.user._id,
      to: friend._id,
      status: 'pending'
    });
    await friendRequest.save();
    await friendRequest.populate('from', 'name email');
    console.log('✅ Friend request created:', friendRequest._id);

    // Emit socket events to notify both users
    if (ioInstance) {
      // Notify the receiver (friend) about new request
      ioInstance.emit('friendRequest', {
        type: 'newRequest',
        to: friend._id.toString(),
        request: {
          id: friendRequest._id,
          from: {
            id: req.user._id,
            name: req.user.name || 'Someone',
            email: req.user.email
          }
        }
      });
      
      // Notify the sender that request was sent
      ioInstance.emit('friendRequest', {
        type: 'sent',
        to: req.user._id.toString(),
        request: {
          id: friendRequest._id,
          to: {
            id: friend._id,
            name: friend.name || 'Someone',
            email: friend.email
          }
        }
      });
      
      console.log('📤 Friend request notifications sent');
    }

    res.json({ 
      message: 'Friend request sent! They will receive a notification to accept or reject.',
      requestId: friendRequest._id
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

// POST /api/friends/accept/:requestId - Accept friend request
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const friendRequest = await FriendRequest.findById(requestId)
      .populate('from', 'name email')
      .populate('to', 'name email');

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify the request is for the current user
    if (friendRequest.to._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only accept requests sent to you' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Add each other as friends
    const fromUser = await User.findById(friendRequest.from._id);
    const toUser = await User.findById(friendRequest.to._id);

    // Add to each other's friends list
    if (!fromUser.friends.includes(toUser._id)) {
      fromUser.friends.push(toUser._id);
      await fromUser.save();
    }
    if (!toUser.friends.includes(fromUser._id)) {
      toUser.friends.push(fromUser._id);
      await toUser.save();
    }

    // Update request status
    friendRequest.status = 'accepted';
    await friendRequest.save();

    console.log('✅ Friend request accepted:', requestId);

    // Emit socket event to notify the requester
    if (ioInstance) {
      ioInstance.emit('friendRequest', {
        type: 'accepted',
        to: fromUser._id.toString(),
        request: {
          id: friendRequest._id,
          from: {
            id: toUser._id,
            name: toUser.name || 'Someone',
            email: toUser.email
          }
        }
      });
      console.log('📤 Friend request accepted notification sent');
    }

    // Populate and return updated friends list
    await toUser.populate('friends', 'name email');
    res.json({ 
      message: 'Friend request accepted! You can now chat with them.',
      friends: toUser.friends 
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Failed to accept friend request' });
  }
});

// POST /api/friends/reject/:requestId - Reject friend request
router.post('/reject/:requestId', auth, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify the request is for the current user
    if (friendRequest.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only reject requests sent to you' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Update request status
    friendRequest.status = 'rejected';
    await friendRequest.save();

    console.log('✅ Friend request rejected:', requestId);

    // Emit socket event to notify the requester
    const fromUser = await User.findById(friendRequest.from);
    const toUser = await User.findById(friendRequest.to);
    if (ioInstance && fromUser && toUser) {
      ioInstance.emit('friendRequest', {
        type: 'rejected',
        to: fromUser._id.toString(),
        request: {
          id: friendRequest._id,
          from: {
            id: toUser._id,
            name: toUser.name || 'Someone',
            email: toUser.email || ''
          }
        }
      });
      console.log('📤 Friend request rejected notification sent');
    }

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Failed to reject friend request' });
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

