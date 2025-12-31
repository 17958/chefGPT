const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Handle ALL OPTIONS requests FIRST - before any other middleware
// This MUST be the first middleware to catch all OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow origin if it's in the list, or if FRONTEND_URL is not set (for initial setup)
    const shouldAllow = !process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production';
    
    if (shouldAllow) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.sendStatus(200);
    } else {
      return res.sendStatus(403);
    }
  }
  next();
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // If FRONTEND_URL is not set, allow all origins (for initial setup)
    // In development mode, allow all origins
    // In production with FRONTEND_URL set, only allow specific origins
    if (!process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Apply CORS middleware for non-OPTIONS requests
app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/payments', require('./routes/payments'));

// Debug: Log all registered routes
console.log('Registered routes:');
console.log('  GET/POST /api/auth/*');
console.log('  GET /api/menu');
console.log('  POST/GET /api/orders');
console.log('  GET/POST/DELETE /api/cart');
console.log('  POST /api/payments/*');

// Root route for Railway health checks (must be fast!)
app.get('/', (req, res) => {
  console.log('[HEALTH CHECK] Root route hit');
  res.status(200).json({ status: 'OK', message: 'ChefGPT Backend API', version: '1.0.0' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Explicit OPTIONS handler for all API routes
app.options('/api/auth/auth', (req, res) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  return res.sendStatus(200);
});

// Catch-all for unmatched routes (for debugging)
app.use((req, res) => {
  console.log('[404] Unmatched route:', req.method, req.url);
  res.status(404).json({ 
    error: 'Not Found', 
    method: req.method, 
    path: req.url
  });
});

const PORT = process.env.PORT || 5000;

// Start server immediately - Railway will check health on this port
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/`);
  
  // Connect to MongoDB after server starts (non-blocking)
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't crash - server can run without DB for health checks
  });
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

