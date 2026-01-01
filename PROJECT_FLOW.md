# 🍽️ ChefGPT - Project Flow & Demo Guide

## 📋 Overview

ChefGPT is a full-stack restaurant ordering system with real-time chat, AI assistance, and friend management. Everything is **FREE** and easy to use!

---

## 🎬 User Flow Demo

### 1️⃣ **Initial Setup & Sign Up**

**Step 1: First Visit**
- User lands on the beautiful animated sign-in/sign-up page
- Two face cards: 😊 Sign In (left) and 👋 Sign Up (right)
- Cards are clickable - click anywhere on a card to switch between them
- Only the active card is interactive (blurred card is completely disabled)

**Step 2: Create Account**
- Click on Sign Up card (or it's already active)
- Enter:
  - **Name**: Your full name
  - **Email**: Your email address
  - **Password**: Minimum 6 characters
- Click "Sign Up" button
- Account created! Automatically logged in and redirected to Menu

**Alternative: Sign In**
- If you already have an account
- Enter email and password
- Click "Sign In"
- Redirected to Menu

---

### 2️⃣ **Menu Browsing & Ordering**

**Step 1: View Menu**
- After login, you see the Menu page
- Header shows:
  - Restaurant name: "ChefGPT"
  - Your personalized greeting (e.g., "Hey Biryani Lover!")
  - Theme toggle button (🌙/☀️) - switch between dark/light mode
  - Chat button (💬 Chat) - navigate to chat
  - Logout button

**Step 2: Browse Items**
- 9 curated menu items with beautiful images:
  1. Butter Chicken
  2. Classic Biryani
  3. Tandoori Chicken
  4. Chicken Tikka Masala
  5. Garlic Naan
  6. Mango Lassi
  7. Gulab Jamun
  8. Chicken Seekh Kebab
  9. Chicken Korma

**Step 3: Add to Cart**
- Click "+ Add" button on any menu item
- Item added to cart
- Cart button appears at bottom right: "🛒 Cart (X) - ₹XXX"
- Click cart button to view/modify cart

**Step 4: Checkout**
- Review items in cart
- Update quantities or remove items
- Proceed to payment (UPI QR code)

---

### 3️⃣ **Real-Time Chat with Friends**

**Step 1: Access Chat**
- Click "💬 Chat" button in header
- Navigate to Chat page

**Step 2: Add Friends**
- Click "+ Add Friend" button
- Enter friend's email address
- Click "Add"
- **Magic happens**: 
  - If friend doesn't exist → Auto-creates account for them
  - Sends invitation email with login details
  - Friend appears in your friends list immediately

**Step 3: Start Chatting**
- Click on a friend from the friends list
- Chat interface opens on the right
- Type your message and press Enter or click "Send"
- Messages appear in real-time (using Socket.io)

**Step 4: Use AI Assistant (@bro)**
- In any chat, type: `@bro your question here`
- Example: `@bro what's the weather like?`
- AI responds instantly using Google Gemini
- AI messages appear with 🤖 icon

**Features:**
- Real-time message delivery
- Message history saved
- Online/offline status
- Clean, modern chat UI

---

### 4️⃣ **Friend Invitation Flow (Auto-Onboarding)**

**When You Add a Friend:**

1. **You add friend's email** → System checks if they exist
2. **If they don't exist:**
   - Account auto-created with temporary password
   - Invitation email sent (even without SMTP - logs to console)
   - Email contains:
     - Welcome message
     - Login credentials (email + temp password)
     - Direct link to signup page with email pre-filled
     - Step-by-step instructions

3. **Friend receives email:**
   - Clicks link → Opens signup page
   - Email is pre-filled automatically
   - Enters name and sets their own password
   - Completes registration
   - Can now chat with you!

4. **If friend already exists:**
   - Simply added to your friends list
   - No email sent

---

### 5️⃣ **Theme Switching**

**Dark/Light Mode:**
- Click 🌙 button in header → Switches to dark mode
- Click ☀️ button in header → Switches to light mode
- Theme preference saved in localStorage
- Smooth transitions between themes
- All components adapt automatically

---

## 🔄 Complete User Journey Example

### Scenario: New User Experience

1. **Day 1 - Sign Up**
   - User visits site → Sees animated sign-up page
   - Creates account with email/password
   - Redirected to menu
   - Browses items, adds to cart
   - Places first order

2. **Day 2 - Add Friends**
   - User clicks "Chat" button
   - Adds friend "john@example.com"
   - System auto-creates account for John
   - John receives email invitation

3. **Day 3 - Friend Joins**
   - John clicks email link
   - Email pre-filled in signup form
   - John completes registration
   - John can now chat with user

4. **Day 4 - Chatting**
   - User and John chat in real-time
   - User asks: "@bro recommend a good dish"
   - AI responds with suggestions
   - Both order food and enjoy!

---

## 🎯 Key Features Flow

### Authentication Flow
```
Sign Up → Create Account → Auto Login → Menu
Sign In → Verify Credentials → Menu
```

### Friend Management Flow
```
Add Friend Email → Check Exists?
  ├─ No → Auto-Create Account → Send Email → Add to List
  └─ Yes → Add to List
```

### Chat Flow
```
Select Friend → Load Messages → Type Message → Send
  ├─ Regular Message → Real-time Delivery
  └─ @bro Message → AI Processing → AI Response
```

### Ordering Flow
```
Browse Menu → Add to Cart → Review Cart → Payment (UPI) → Order Confirmed
```

---

## 🛠️ Technical Flow

### Frontend → Backend Communication

1. **Authentication:**
   - Frontend: `POST /api/auth/signup` or `/api/auth/auth`
   - Backend: Validates → Creates/Verifies User → Returns JWT Token
   - Frontend: Stores token → Sets auth headers

2. **Real-Time Chat:**
   - Frontend: Connects via Socket.io
   - Backend: Socket.io server handles messages
   - Messages saved to MongoDB
   - Real-time broadcast to connected users

3. **Friend Management:**
   - Frontend: `POST /api/friends` with email
   - Backend: Checks user → Creates if needed → Sends email → Returns friend list

4. **AI Integration:**
   - User types "@bro message"
   - Frontend: Sends via Socket.io
   - Backend: Detects @bro → Calls Gemini API → Returns response
   - Response sent back via Socket.io

---

## 📱 Pages & Routes

1. **`/signin`** - Sign In page (also handles signup)
2. **`/signup`** - Sign Up page (same as signin, different card active)
3. **`/menu`** - Main menu page (requires auth)
4. **`/chat`** - Chat page (requires auth)
5. **`/`** - Redirects to `/signin`

---

## 🎨 UI/UX Highlights

- **Animated Face Cards**: Smooth transitions, blur effects
- **Dark/Light Theme**: Toggle anytime, preference saved
- **Real-Time Updates**: Instant message delivery
- **Responsive Design**: Works on mobile and desktop
- **Clean Interface**: Modern, refreshing design
- **Error Handling**: User-friendly error messages
- **Loading States**: Clear feedback during operations

---

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes (requires login)
- Email validation
- Input sanitization

---

## 💡 Pro Tips

1. **Theme**: Switch to dark mode for night browsing
2. **Chat**: Use @bro for quick AI help
3. **Friends**: Add friends by email - they'll get auto-onboarded
4. **Cart**: Items persist across sessions
5. **Menu**: Images load from Unsplash (free, high-quality)

---

## 🚀 Getting Started

1. **Install dependencies**: `npm run install:all`
2. **Set up environment**: Create `.env` files
3. **Seed menu**: `cd backend && npm run seed`
4. **Start servers**: `npm run raja`
5. **Open browser**: `http://localhost:3000`

---

## 📊 Database Structure

- **Users**: Email, password, name, friends list
- **Messages**: Sender, receiver, content, timestamp
- **MenuItems**: Name, description, price, image, category
- **Orders**: User, items, total, status
- **Cart**: User, items, quantities

---

This is a complete, production-ready system with real-time chat, AI integration, friend management, and ordering capabilities - all **FREE** and easy to use! 🎉

