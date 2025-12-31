# Deployment Guide for ChefGPT Restaurant

## Quick Deploy Options

### Frontend (React App) - Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend folder**:
   ```bash
   cd frontend
   vercel
   ```

3. **Or deploy via Vercel Dashboard**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Add environment variable: `REACT_APP_API_URL` = your backend URL

### Backend (Node.js API) - Deploy to Railway (Recommended)

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → Deploy from GitHub
4. **Select your repository**
5. **Set root directory** to `backend`
6. **Add Environment Variables**:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = your JWT secret
   - `RAZORPAY_KEY_ID` = your Razorpay key
   - `RAZORPAY_KEY_SECRET` = your Razorpay secret
   - `FRONTEND_URL` = your Vercel frontend URL
   - `PORT` = 5000 (or Railway will auto-assign)

### Alternative: Render.com (Backend)

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as Railway)

## Environment Variables Checklist

### Backend (.env):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
FRONTEND_URL=https://your-frontend.vercel.app
PORT=5000
NODE_ENV=production
```

### Frontend (Vercel Environment Variables):
```
REACT_APP_API_URL=https://your-backend.railway.app
```

## MongoDB Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to backend environment variables

## Post-Deployment Steps

1. Update frontend `REACT_APP_API_URL` to point to deployed backend
2. Update backend `FRONTEND_URL` to point to deployed frontend
3. Run seed script to populate menu:
   ```bash
   cd backend
   npm run seed
   ```
4. Test the application!

