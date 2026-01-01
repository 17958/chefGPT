// ============================================
// MAIN SERVER FILE - This is where our app starts
// ============================================
// Think of this file as the "main door" of a restaurant
// All requests come here first, then get directed to the right place

// Step 1: Load environment variables from .env file
// Environment variables are like secret settings stored in a .env file
// Examples: database password, API keys, etc.
require('dotenv').config();

// Step 2: Import required libraries (like importing tools)
// express - helps us create a web server (like building a restaurant)
// mongoose - helps us talk to MongoDB database (like talking to a storage room)
// cors - allows frontend to talk to backend (like allowing customers to enter)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Step 3: Create our Express app
// This creates a new web server (like opening a new restaurant)
const app = express();

// Step 4: Handle OPTIONS requests (CORS preflight)
// When frontend makes a request, browser first sends an OPTIONS request
// This is like asking "Can I make this request?" before actually making it
// We need to say "Yes, you can!" by sending proper headers
app.use((req, res, next) => {
  // Log every request for debugging (like a security camera recording)
  console.log(`[REQUEST] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  
  // If it's an OPTIONS request (browser asking permission)
  if (req.method === 'OPTIONS') {
    console.log(`[OPTIONS HANDLER] Caught OPTIONS request for: ${req.url}`);
    
    // Get where the request is coming from
    const origin = req.headers.origin;
    
    // List of allowed origins (who can access our API)
    const allowedOrigins = [
      'http://localhost:3000', // Local development (React app running on your computer)
      process.env.FRONTEND_URL // Production frontend URL
    ].filter(Boolean); // Remove any empty values
    
    console.log(`[OPTIONS HANDLER] Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`);
    
    // Decide if we should allow this request
    // Allow if: FRONTEND_URL not set (initial setup) OR origin is in allowed list OR not in production
    const shouldAllow = !process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production';
    
    console.log(`[OPTIONS HANDLER] Should allow: ${shouldAllow}`);
    
    if (shouldAllow) {
      // Say "Yes, you can make requests!" by setting these headers
      res.header('Access-Control-Allow-Origin', origin || '*'); // Who can access
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'); // What methods allowed
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'); // What headers allowed
      res.header('Access-Control-Allow-Credentials', 'true'); // Allow cookies
      res.header('Access-Control-Max-Age', '86400'); // Cache this permission for 24 hours
      console.log(`[OPTIONS HANDLER] Sending 200 OK for ${req.url}`);
      return res.sendStatus(200); // Say "OK, you have permission!"
    } else {
      console.log(`[OPTIONS HANDLER] Sending 403 Forbidden for ${req.url}`);
      return res.sendStatus(403); // Say "No, you don't have permission!"
    }
  }
  next(); // Continue to next middleware
});

// Step 5: Setup CORS (Cross-Origin Resource Sharing)
// CORS is like a bouncer at a club - decides who can enter
// This allows our frontend (running on different port) to make requests to backend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000', // Local React app
      process.env.FRONTEND_URL // Production frontend
    ].filter(Boolean);
    
    // Decide if we should allow this origin
    // Allow if: FRONTEND_URL not set OR origin is in allowed list OR not in production
    if (!process.env.FRONTEND_URL || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true); // Say "Yes, you're allowed!"
    } else {
      callback(new Error('Not allowed by CORS')); // Say "No, you're not allowed!"
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // What HTTP methods allowed
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // What headers allowed
  preflightContinue: false, // Don't continue to next middleware for OPTIONS
  optionsSuccessStatus: 200 // Success status for OPTIONS
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Step 6: Tell Express to understand JSON data
// When frontend sends JSON data (like {"name": "John"}), Express will automatically convert it to JavaScript object
app.use(express.json());

// Step 7: Backup OPTIONS handler (in case first one doesn't catch it)
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

// Step 8: Root route for health checks
// This is like a heartbeat - tells us if server is alive
// Railway (hosting platform) checks this to see if server is running
app.get('/', (req, res) => {
  // Respond immediately with "OK" (like saying "I'm alive!")
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

// Step 9: Connect all our routes
// Routes are like different pages/endpoints of our API
// Think of routes as different rooms in a restaurant:
// /api/auth - Login/Signup room
// /api/menu - Menu items room
// /api/orders - Orders room
// /api/cart - Shopping cart room
// /api/payments - Payment room
try {
  app.use('/api/auth', require('./routes/auth')); // Login and signup
  app.use('/api/menu', require('./routes/menu')); // Get menu items
  app.use('/api/orders', require('./routes/orders')); // Create and view orders
  app.use('/api/cart', require('./routes/cart')); // Shopping cart
  app.use('/api/payments', require('./routes/payments')); // Payment processing
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  // Don't crash - server can still respond to health checks
}

// Step 10: Log all registered routes (for debugging)
console.log('Registered routes:');
console.log('  GET/POST /api/auth/*');
console.log('  GET /api/menu');
console.log('  POST/GET /api/orders');
console.log('  GET/POST/DELETE /api/cart');
console.log('  POST /api/payments/*');

// Step 11: Health check endpoint
// Frontend can call GET /api/health to check if backend is alive
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(), // Current time
    uptime: process.uptime() // How long server has been running (in seconds)
  });
});

// Step 12: Catch-all for unmatched routes
// If someone tries to access a route that doesn't exist, send 404 error
app.use((req, res) => {
  console.log('[404] Unmatched route:', req.method, req.url);
  res.status(404).json({ 
    error: 'Not Found', 
    method: req.method, 
    path: req.url
  });
});

// Step 13: Get port number
// Get from .env file, or use 5000 as default
const PORT = process.env.PORT || 5000;

console.log(`🚀 Starting server on port ${PORT}...`);

// Step 14: Start the server
// This is like opening the restaurant for business
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
    
    // Step 15: Connect to MongoDB database
    // MongoDB is where we store all our data (users, orders, menu items, etc.)
    // We connect AFTER server starts so server can respond to health checks immediately
    if (mongoose.connection.readyState === 0) {
      // Get database URL from .env file, or use default local database
      const databaseUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta';
      
      mongoose.connect(databaseUrl, {
        useNewUrlParser: true, // Use new URL parser
        useUnifiedTopology: true, // Use new connection management
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

  // Handle server errors
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    // Don't exit - try to recover
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1); // Exit with error code
}

// Step 16: Keep server process alive
// Prevent accidental exits
process.on('beforeExit', (code) => {
  console.log(`⚠️ Process about to exit with code ${code} - this should not happen`);
  // Don't exit - keep server running
});

// Keep the event loop alive (prevents server from shutting down)
setInterval(() => {
  // This keeps the process alive
}, 10000);

// Handle graceful shutdown (when server needs to stop)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0); // Exit successfully
  });
});

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
