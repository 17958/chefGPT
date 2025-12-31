# 🚀 Deploy ChefGPT Restaurant - Step by Step

## Step 1: Initialize Git Repository

```bash
cd raju-ternity
git init
git add .
git commit -m "Initial commit - ChefGPT Restaurant"
```

## Step 2: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy Backend (Railway - Recommended)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Add Service" → "Empty Service"
6. Click on the service → Settings → Set Root Directory to `backend`
7. Go to Variables tab and add:
   ```
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-random-secret-key-here
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   FRONTEND_URL=https://your-frontend.vercel.app (add after frontend is deployed)
   NODE_ENV=production
   ```
8. Railway will auto-deploy. Copy the deployment URL (e.g., `https://your-app.railway.app`)

## Step 4: Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Add Environment Variable:
   - `REACT_APP_API_URL` = your Railway backend URL (from Step 3)
7. Click "Deploy"
8. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

## Step 5: Update Backend CORS

1. Go back to Railway
2. Update the `FRONTEND_URL` variable to your Vercel URL
3. Railway will auto-redeploy

## Step 6: Setup MongoDB Atlas (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster (free M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Add to Railway environment variables as `MONGODB_URI`

## Step 7: Seed Menu Items

After deployment, run the seed script locally or via Railway console:
```bash
cd backend
npm run seed
```

## Step 8: Setup Razorpay

1. Complete Razorpay onboarding (use your Vercel URL as website)
2. Get API keys from Dashboard → Settings → API Keys
3. Add to Railway environment variables

## ✅ Done!

Your app should now be live at your Vercel URL!

## Troubleshooting

- **CORS errors**: Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly
- **API not working**: Check Railway logs and ensure all environment variables are set
- **MongoDB connection**: Verify connection string includes password and database name

