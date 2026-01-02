require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time chat
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined chat`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const Message = require('./models/Message');
      const { getAIResponse } = require('./services/gemini');
      
      const { senderId, receiverId, content } = data;
      const isMentioningBro = content.toLowerCase().includes('@bro');
      
      if (isMentioningBro) {
        const prompt = content.replace(/@bro\s*/gi, '').trim();
        if (!prompt) {
          socket.emit('error', { message: 'Please provide a question after @bro' });
          return;
        }
        
        const aiResponse = await getAIResponse(prompt);

        const userMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          content: content
        });
        await userMessage.save();

        const aiMessage = new Message({
          sender: receiverId,
          receiver: senderId,
          content: `🤖 @bro: ${aiResponse}`,
          isAIResponse: true
        });
        await aiMessage.save();

        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId && receiverId !== senderId) {
          io.to(receiverSocketId).emit('newMessage', {
            ...userMessage.toObject(),
            sender: { _id: senderId },
            receiver: { _id: receiverId }
          });
        }

        io.to(socket.id).emit('newMessage', {
          ...userMessage.toObject(),
          sender: { _id: senderId },
          receiver: { _id: receiverId }
        });
        
        io.to(socket.id).emit('newMessage', {
          ...aiMessage.toObject(),
          sender: { _id: receiverId, name: '@bro', email: 'ai@chefgpt.com' },
          receiver: { _id: senderId }
        });
      } else {
        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content: content
        });
        await message.save();

        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', {
            ...message.toObject(),
            sender: { _id: senderId },
            receiver: { _id: receiverId }
          });
        }

        socket.emit('messageSent', {
          ...message.toObject(),
          sender: { _id: senderId },
          receiver: { _id: receiverId }
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'Chat API' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
const friendsRouter = require('./routes/friends');
friendsRouter.setIO(io);
app.use('/api/friends', friendsRouter);
app.use('/api/messages', require('./routes/messages'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    method: req.method, 
    path: req.url
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    const databaseUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/chefgpt-chat';
    
    mongoose.connect(databaseUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
      console.error('⚠️ MongoDB connection error:', err);
    });
  } else {
    console.log('✅ MongoDB Already Connected');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
