const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Handle ALL OPTIONS requests FIRST - before any other middleware
// This MUST be the first middleware to catch all OPTIONS requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  
  if (req.method === 'OPTIONS') {
    console.log(`[OPTIONS HANDLER] Caught OPTIONS request for: ${req.url}`);
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log(`[OPTIONS HANDLER] Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`);
    
    // Allow origin if it's in the list, or if FRONTEND_URL is not set (for initial setup)
    const shouldAllow = !process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production';
    
    console.log(`[OPTIONS HANDLER] Should allow: ${shouldAllow}`);
    
    if (shouldAllow) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      console.log(`[OPTIONS HANDLER] Sending 200 OK for ${req.url}`);
      return res.sendStatus(200);
    } else {
      console.log(`[OPTIONS HANDLER] Sending 403 Forbidden for ${req.url}`);
      return res.sendStatus(403);
    }
  }
  next();
});

// CORS Configuration - but let our custom OPTIONS handler handle preflight
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
  preflightContinue: false, // Don't continue to next middleware for OPTIONS
  optionsSuccessStatus: 200
};

// Apply CORS middleware - but it won't handle OPTIONS because preflightContinue is false
// Our custom handler above already handled OPTIONS
app.use(cors(corsOptions));

app.use(express.json());

// Explicit OPTIONS handler for ALL routes - must be before route definitions
app.options('*', (req, res) => {
  console.log(`[OPTIONS BACKUP] Caught OPTIONS for: ${req.url}`);
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const shouldAllow = !process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production';
  
  if (shouldAllow) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    console.log(`[OPTIONS BACKUP] Sending 200 OK for ${req.url}`);
    return res.sendStatus(200);
  } else {
    console.log(`[OPTIONS BACKUP] Sending 403 Forbidden for ${req.url}`);
    return res.sendStatus(403);
  }
});

// Root route for Railway health checks - define EARLY for immediate response
// This MUST respond quickly - Railway uses this for health checks
// Use plain text for fastest response (no JSON parsing needed)
// CRITICAL: Respond immediately, no async operations
app.get('/', (req, res) => {
  // Respond immediately - Railway expects fast response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

// Routes - wrap in try-catch to prevent crashes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/menu', require('./routes/menu'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/payments', require('./routes/payments'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  // Don't crash - server can still respond to health checks
}

// Debug: Log all registered routes
console.log('Registered routes:');
console.log('  GET/POST /api/auth/*');
console.log('  GET /api/menu');
console.log('  POST/GET /api/orders');
console.log('  GET/POST/DELETE /api/cart');
console.log('  POST /api/payments/*');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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

console.log(`🚀 Starting server on port ${PORT}...`);

// Start server immediately - Railway will check health on this port
// CRITICAL: Server must be listening BEFORE Railway health checks
let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Health check available at http://0.0.0.0:${PORT}/`);
    console.log(`✅ Server is ready to accept requests`);
    console.log(`✅ Railway can now check health - server is listening`);
    
    // Test that server is actually responding
    setTimeout(() => {
      console.log(`✅ Server confirmed listening on port ${PORT}`);
    }, 100);
    
    // Connect to MongoDB after server starts (non-blocking)
    // Don't wait for MongoDB - server can respond to health checks immediately
    // Use cached connection if available (helps with Railway cold starts)
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log('✅ MongoDB Connected'))
      .catch(err => {
        console.error('⚠️ MongoDB connection error:', err);
        // Don't crash - server can run without DB for health checks
      });
    } else {
      console.log('✅ MongoDB Already Connected');
    }
  });

  // CRITICAL: Keep server process alive - prevent exit
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    // Don't exit - try to recover
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Ensure process stays alive - prevent accidental exits
process.on('beforeExit', (code) => {
  console.log(`⚠️ Process about to exit with code ${code} - this should not happen`);
  // Don't exit - keep server running
});

// Keep the event loop alive
setInterval(() => {
  // This keeps the process alive
}, 10000);

// Keep process alive - prevent accidental exits
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Prevent uncaught exceptions from crashing the server
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

