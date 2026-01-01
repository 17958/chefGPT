// ============================================
// AUTH MIDDLEWARE - Checks if user is logged in
// ============================================

// What is middleware?
// Middleware is like a security guard at the entrance of a building
// It checks if you have permission before allowing you to enter
// In our case, it checks if user is logged in before allowing access to protected routes

// What does this middleware do?
// 1. Gets the token from request header (like checking your ID card)
// 2. Verifies the token is valid (like checking if ID card is real)
// 3. Finds the user from database (like looking up your name in a register)
// 4. Attaches user info to request object (like giving you a visitor badge)
// 5. Allows request to continue to the route handler (like letting you enter)

const jwt = require('jsonwebtoken'); // Library to work with JWT tokens (like a token validator)
const User = require('../models/User'); // User model (database structure for users)

const auth = async (req, res, next) => {
  try {
    // Step 1: Get token from request header
    // Frontend sends token in Authorization header like: "Bearer abc123xyz"
    // We extract just the token part (remove "Bearer ")
    // The ?. is called optional chaining - if header doesn't exist, it won't crash
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Step 2: Check if token exists
    // If no token, user is not logged in (like not having an ID card)
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Step 3: Verify the token
    // jwt.verify checks if token is valid and not expired
    // It also extracts the userId from the token (like reading your ID number)
    // If token is invalid, it will throw an error (caught by try-catch)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Step 4: Find user in database using userId from token
    // .select('-password') means: get all fields except password (for security)
    // We don't want to send password to frontend even if it's hashed
    const user = await User.findById(decoded.userId).select('-password');
    
    // Step 5: Check if user exists
    // If user was deleted but token still exists, this will be null
    // (like having an ID card for someone who no longer exists)
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Step 6: Attach user to request object
    // Now the route handler can access req.user to know who is logged in
    // (like giving you a visitor badge with your name on it)
    req.user = user;
    
    // Step 7: Call next() to continue to the actual route handler
    // If we don't call next(), the request stops here (like not opening the door)
    next();
  } catch (error) {
    // If anything goes wrong (invalid token, expired token, etc.)
    // Send error message and stop the request
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
