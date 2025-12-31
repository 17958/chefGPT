# ChefGPT Restaurant 🍽️

AI-Powered Restaurant Ordering System with Razorpay Payment Integration

## 🚀 Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   - Backend: Create `backend/.env` with MongoDB URI, JWT_SECRET, etc.
   - Frontend: Create `frontend/.env` with `REACT_APP_API_URL=http://localhost:5000`

3. **Run both frontend and backend**:
   ```bash
   npm run raju
   ```

4. **Seed menu items** (first time only):
   ```bash
   cd backend
   npm run seed
   ```

## 📦 Deployment

### Frontend (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `cd frontend && vercel`
3. Add environment variable: `REACT_APP_API_URL` = your backend URL

### Backend (Railway/Render)

1. **Railway**: https://railway.app
   - Connect GitHub repo
   - Set root directory: `backend`
   - Add environment variables

2. **Render**: https://render.com
   - New Web Service
   - Root: `backend`
   - Build: `npm install`
   - Start: `npm start`

See `DEPLOYMENT.md` for detailed instructions.

## 🔧 Environment Variables

### Backend
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `FRONTEND_URL` - Frontend deployment URL
- `PORT` - Server port (default: 5000)

### Frontend
- `REACT_APP_API_URL` - Backend API URL

## 📝 Features

- ✅ User authentication (mobile number)
- ✅ Menu browsing
- ✅ Shopping cart with persistence
- ✅ Razorpay payment integration
- ✅ Order management
- ✅ Google-style UI design

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Payment**: Razorpay
- **Authentication**: JWT

