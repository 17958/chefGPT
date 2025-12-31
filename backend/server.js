const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Handle ALL OPTIONS requests FIRST - before any other middleware
// This MUST be the first middleware to catch all OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('[OPTIONS HANDLER] Request received:', req.method, req.url);
    console.log('[OPTIONS HANDLER] Origin:', req.headers.origin);
    console.log('[OPTIONS HANDLER] Headers:', JSON.stringify(req.headers));
    
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log('[OPTIONS HANDLER] Allowed origins:', allowedOrigins);
    console.log('[OPTIONS HANDLER] FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('[OPTIONS HANDLER] NODE_ENV:', process.env.NODE_ENV);
    
    // Allow origin if it's in the list, or if FRONTEND_URL is not set (for initial setup)
    const shouldAllow = !process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production';
    
    if (shouldAllow) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      console.log('[OPTIONS HANDLER] Allowing request, sending 200');
      return res.sendStatus(200);
    } else {
      console.log('[OPTIONS HANDLER] Denying request, sending 403');
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Catch-all for unmatched routes (for debugging)
app.use((req, res, next) => {
  console.log('[404 HANDLER] Unmatched route:', req.method, req.url);
  console.log('[404 HANDLER] Headers:', JSON.stringify(req.headers));
  res.status(404).json({ 
    error: 'Not Found', 
    method: req.method, 
    path: req.url,
    message: 'Route not found. Check server logs for details.'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

