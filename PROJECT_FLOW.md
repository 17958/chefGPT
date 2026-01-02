# 💬 ChefGPT Chat - Project Flow

## 📋 Overview

ChefGPT Chat is a modern, real-time chat application with AI assistance. Built with React, Node.js, Socket.io, and MongoDB.

---

## 🎬 User Flow

### 1️⃣ **Sign Up / Sign In**

- Visit the app → See animated sign-in/sign-up page
- **Sign Up**: Enter email & password (min 6 chars) → Account created → Auto-login
- **Sign In**: Enter credentials → Login → Redirected to chat

---

### 2️⃣ **Add Friends**

- Click **"+ Add Friend"** button
- Enter friend's email address
- Click **"Add"**
- Friend request sent → Friend receives notification
- Once accepted, friend appears in your list

---

### 3️⃣ **Chat with Friends**

- Select a friend from the sidebar
- Type your message → Press Enter or click Send
- Messages appear in real-time (Socket.io)
- Chat history automatically saved

---

### 4️⃣ **AI Assistant (@bro)**

- In any chat, type: `@bro your question`
- Example: `@bro what's the weather?`
- AI responds instantly using Google Gemini
- AI messages appear with 🤖 icon
- Supports code blocks, markdown, and formatting

---

## 🎯 Key Features

- ✅ Real-time messaging (Socket.io)
- ✅ AI assistant integration (@bro)
- ✅ Friend management system
- ✅ Message history
- ✅ WhatsApp-like smooth UI
- ✅ Beautiful animations (Framer Motion)
- ✅ Responsive design

---

## 🛠️ Technical Stack

**Frontend:**
- React 18
- Framer Motion (animations)
- Socket.io Client
- Lucide React (icons)

**Backend:**
- Node.js + Express
- Socket.io (real-time)
- MongoDB + Mongoose
- Google Gemini AI

---

## 📱 Routes

- `/` → Redirects to `/chat`
- `/signin` → Sign in page
- `/signup` → Sign up page
- `/chat` → Main chat interface (requires auth)

---

## 🗄️ Database Collections

1. **`yumsters`** - Users (email, password, friends)
2. **`messages`** - Chat messages (sender, receiver, content)
3. **`friendrequests`** - Friend requests (from, to, status)

---

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start backend
cd backend && npm start

# Start frontend (new terminal)
cd frontend && npm start
```

Visit: `http://localhost:3000`

---

## 💡 Usage Tips

1. **AI Help**: Type `@` in message input for AI suggestions
2. **Smooth Experience**: All animations optimized for performance
3. **Real-time**: Messages sync instantly across devices
4. **Friends**: Add friends by email - they must sign up first

---

## 🎨 UI Highlights

- WhatsApp-inspired design
- Smooth spring animations
- Modern color scheme (#075e54 green)
- Clean, intuitive interface
- Message status indicators (✓/✓✓)
- Responsive on all devices

---

**Built with ❤️ - A modern chat experience!**
