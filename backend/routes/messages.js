// ============================================
// MESSAGES ROUTES - Get chat messages
// ============================================

const express = require('express');
const Message = require('../models/Message');
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
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// GET /api/messages/:friendId - Get messages with a friend
router.get('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .sort({ createdAt: 1 })
    .limit(100);

    // Mark messages as read
    await Message.updateMany(
      { receiver: userId, sender: friendId, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

module.exports = router;

