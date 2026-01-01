# ChefGPT Restaurant 🍽️

AI-Powered Restaurant Ordering System with UPI QR Code Payments

## 🚀 Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables**:

   **Backend** - Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/amma-chethi-vanta
   JWT_SECRET=your-random-secret-key-here
   FRONTEND_URL=http://localhost:3000
   UPI_ID=yourname@paytm
   MERCHANT_NAME=ChefGPT
   ```

   **Frontend** - Create `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Run both frontend and backend**:
   ```bash
   npm run raju
   ```
   Or run separately:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

4. **Seed menu items** (first time only):
   ```bash
   cd backend
   npm run seed
   ```

## 📦 Deployment

### Frontend (Vercel)

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
5. Add Environment Variable:
   - `REACT_APP_API_URL` = your Railway backend URL (e.g., `https://your-app.railway.app`)
6. Click "Deploy"
7. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

### Backend (Railway)

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click on the service → Settings → Set **Root Directory** to `backend`
5. Go to **Variables** tab and add:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-random-secret-key
   FRONTEND_URL=https://your-frontend.vercel.app
   UPI_ID=yourname@paytm
   MERCHANT_NAME=ChefGPT
   NODE_ENV=production
   ```
6. Railway will auto-deploy
7. Copy your Railway URL (e.g., `https://your-app.railway.app`)

### Update Frontend After Backend Deployment

1. Go back to Vercel Dashboard
2. Settings → Environment Variables
3. Update `REACT_APP_API_URL` to your Railway URL
4. Redeploy (Vercel will rebuild automatically)

## 🔧 Environment Variables

### Backend (`.env` file in `backend/` folder)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `FRONTEND_URL` | ✅ Yes | Your Vercel frontend URL | `https://your-app.vercel.app` |
| `UPI_ID` | ✅ Yes | UPI ID for QR code payments | `merchant@paytm` or `merchant@phonepe` |
| `MERCHANT_NAME` | ❌ No | Merchant name (default: ChefGPT) | `ChefGPT` |
| `PORT` | ❌ No | Server port (Railway auto-assigns) | `5000` |
| `NODE_ENV` | ❌ No | Environment mode | `production` |
| `ADMIN_EMAIL` | ❌ No | Email for order notifications | `admin@example.com` |
| `SMTP_HOST` | ❌ No | SMTP server (default: smtp.gmail.com) | `smtp.gmail.com` |
| `SMTP_PORT` | ❌ No | SMTP port (default: 587) | `587` |
| `SMTP_USER` | ❌ No | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | ❌ No | SMTP password (Gmail App Password) | `your-app-password` |

**📧 Need help configuring SMTP?** See [SMTP_SETUP.md](./SMTP_SETUP.md) for detailed step-by-step instructions!
| `ADMIN_PHONE` | ❌ No | Phone for WhatsApp notifications | `+919876543210` |
| `WHATSAPP_API_KEY` | ❌ No | WhatsApp API key | `your-api-key` |
| `GEMINI_API_KEY` | ❌ No | Google Gemini API key (for @bro AI) | Get free key at https://makersuite.google.com/app/apikey |

### Frontend (Vercel Environment Variables)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_API_URL` | ✅ Yes | Backend API URL | `http://localhost:5000` (local) or `https://your-backend.railway.app` (production) |
| `REACT_APP_MERCHANT_NAME` | ❌ No | Merchant name | `ChefGPT` |

**Important**: Frontend variables MUST start with `REACT_APP_` prefix!

## 📝 Features

- ✅ User authentication (email/password based)
- ✅ Beautiful animated sign-in/sign-up page with 2 face cards
- ✅ **Auto-onboard friends** - Automatically create accounts and send invitation emails
- ✅ **Dark/Light theme** - Toggle between themes with smooth transitions
- ✅ Menu browsing with 9 curated items and beautiful images
- ✅ Shopping cart with persistence
- ✅ UPI QR code payment integration
- ✅ Order management and tracking
- ✅ Real-time chat with friends
- ✅ Add friends by email (auto-onboard if they don't exist)
- ✅ AI assistant (@bro) powered by Google Gemini
- ✅ Email notifications (optional)
- ✅ WhatsApp notifications (optional)
- ✅ Modern, responsive UI with production-grade polish

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Axios, QRCode React, Socket.io Client
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io
- **Payment**: UPI QR Code
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Real-time Chat**: Socket.io for instant messaging
- **AI Assistant**: Google Gemini AI (free tier)
- **Email**: Nodemailer (SMTP)
- **Database**: MongoDB Atlas

## 📚 Project Structure

```
chefGPT/
├── backend/          # Node.js/Express API
│   ├── models/       # Database models (User, Message, MenuItem, Order, Cart)
│   ├── routes/       # API routes (auth, menu, orders, cart, payments, friends, messages)
│   ├── services/     # Services (email, WhatsApp, Gemini AI)
│   ├── middleware/   # Auth middleware
│   └── server.js     # Main server file with Socket.io
├── frontend/         # React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components (AuthPage, Menu, Chat)
│   │   └── context/    # React Context (Auth)
│   └── public/
└── package.json      # Root package.json (for local dev convenience)
```

## 💬 Chat Features

### Real-time Chat with Friends
- Add friends by email address
- Real-time messaging using Socket.io
- Chat interface with message history
- Clean and modern UI

### AI Assistant (@bro)
- Mention `@bro` in any chat message to get AI assistance
- Powered by Google Gemini AI (free tier)
- Get instant AI responses to your questions
- Example: "@bro what's the weather like?" or "@bro help me with cooking tips"

**Note**: To use @bro, add `GEMINI_API_KEY` to your backend `.env` file. Get a free API key at https://makersuite.google.com/app/apikey

## 🔑 Getting Started with MongoDB

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster (free M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password
7. Add to `backend/.env` as `MONGODB_URI`

## 💡 Tips

- **Root package.json**: Only needed for local development convenience (`npm run raju`). Vercel and Railway don't use it - they use `frontend/package.json` and `backend/package.json` directly.
- **Environment Variables**: Backend uses `.env` file, Frontend uses Vercel's environment variables (set in dashboard).
- **JWT Secret**: Generate a strong secret: `openssl rand -base64 32`
- **Gmail SMTP**: You need to create an "App Password" in Google Account settings (not your regular password)

