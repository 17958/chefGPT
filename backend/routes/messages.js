// ============================================
// MESSAGES ROUTES - Get chat messages
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { getAIResponse } = require('../services/gemini');

// Special ObjectId for Raja (consistent across all users)
const RAJA_ID = new mongoose.Types.ObjectId('000000000000000000000001');

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

    // Handle Raja special case
    const targetId = friendId === 'raja-default' ? RAJA_ID : friendId;

    // Find messages - don't populate yet to handle Raja specially
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: targetId },
        { sender: targetId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

    // Transform messages to have proper sender/receiver info
    const transformedMessages = await Promise.all(messages.map(async (msg) => {
      const msgObj = { ...msg };
      
      // Handle sender
      if (msgObj.sender && msgObj.sender.toString() === RAJA_ID.toString()) {
        msgObj.sender = { _id: 'raja-default', name: 'Raja', email: 'raja@chefgpt.com' };
      } else if (msgObj.sender && msgObj.sender.toString() === userId.toString()) {
        // User's own message
        msgObj.sender = { _id: userId, name: req.user.name || 'You', email: req.user.email || '' };
      } else {
        // Populate other user
        try {
          const User = require('../models/User');
          const senderUser = await User.findById(msgObj.sender).select('name email').lean();
          if (senderUser) {
            msgObj.sender = { _id: senderUser._id, name: senderUser.name, email: senderUser.email };
          } else {
            msgObj.sender = { _id: msgObj.sender, name: 'User', email: '' };
          }
        } catch (err) {
          msgObj.sender = { _id: msgObj.sender, name: 'User', email: '' };
        }
      }
      
      // Handle receiver
      if (msgObj.receiver && msgObj.receiver.toString() === RAJA_ID.toString()) {
        msgObj.receiver = { _id: 'raja-default', name: 'Raja', email: 'raja@chefgpt.com' };
      } else if (msgObj.receiver && msgObj.receiver.toString() === userId.toString()) {
        // User is receiver
        msgObj.receiver = { _id: userId, name: req.user.name || 'You', email: req.user.email || '' };
      } else {
        // Populate other user
        try {
          const User = require('../models/User');
          const receiverUser = await User.findById(msgObj.receiver).select('name email').lean();
          if (receiverUser) {
            msgObj.receiver = { _id: receiverUser._id, name: receiverUser.name, email: receiverUser.email };
          } else {
            msgObj.receiver = { _id: msgObj.receiver, name: 'User', email: '' };
          }
        } catch (err) {
          msgObj.receiver = { _id: msgObj.receiver, name: 'User', email: '' };
        }
      }
      
      return msgObj;
    }));

    // Mark messages as read
    await Message.updateMany(
      { receiver: userId, sender: targetId, read: false },
      { read: true }
    );

    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST /api/messages/ai - Get AI response (for Raja)
router.post('/ai', auth, async (req, res) => {
  try {
    const { prompt, chatHistory } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Get recent chat history with Raja from database
    const userId = req.user._id;
    
    // Fetch last 10 messages with Raja for context
    let recentMessages = [];
    if (!chatHistory || chatHistory.length === 0) {
      // Try to get from DB if chatHistory not provided
      try {
        recentMessages = await Message.find({
          $or: [
            { sender: userId, receiver: RAJA_ID },
            { sender: RAJA_ID, receiver: userId }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
        .lean();
        recentMessages.reverse(); // Reverse to chronological order
        
        // Transform for AI context
        recentMessages = recentMessages.map(msg => ({
          sender: msg.sender?._id?.toString() === RAJA_ID.toString() 
            ? { name: 'Raja' } 
            : { name: msg.sender?.name || 'User' },
          content: msg.content,
          isAIResponse: msg.isAIResponse || false
        }));
      } catch (dbError) {
        console.log('Could not fetch chat history from DB, using provided history');
      }
    } else {
      recentMessages = chatHistory;
    }

    const aiResponse = await getAIResponse(prompt.trim(), 'raja', recentMessages);
    
    // Save user message and AI response to database
    const userMessage = new Message({
      sender: userId,
      receiver: RAJA_ID,
      content: prompt.trim()
    });
    await userMessage.save();

    const aiMessage = new Message({
      sender: RAJA_ID,
      receiver: userId,
      content: aiResponse,
      isAIResponse: true
    });
    await aiMessage.save();

    res.json({ 
      response: aiResponse,
      userMessageId: userMessage._id,
      aiMessageId: aiMessage._id
    });
  } catch (error) {
    console.error('AI response error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response',
      response: "I'm having trouble right now. Please try again!"
    });
  }
});

module.exports = router;

