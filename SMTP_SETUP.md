# 📧 SMTP Email Configuration Guide

This guide will help you configure email sending for ChefGPT friend invitations and notifications.

## 🎯 Why Configure SMTP?

By default, ChefGPT logs email invitations to the console (for free tier). To send **real emails** to your friends, you need to configure SMTP.

## 📋 Step-by-Step Setup

### Option 1: Gmail (Recommended - Free & Easy)

#### Step 1: Enable App Password in Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select app: **Mail**
7. Select device: **Other (Custom name)**
8. Enter: `ChefGPT`
9. Click **Generate**
10. **Copy the 16-character password** (you'll need this!)

#### Step 2: Add to Backend `.env` File

Create or edit `backend/.env`:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password

# Frontend URL (for email links)
FRONTEND_URL=https://your-app.vercel.app
```

**Important:**
- `SMTP_USER` = Your Gmail address (e.g., `john@gmail.com`)
- `SMTP_PASSWORD` = The 16-character app password from Step 1 (NOT your regular Gmail password)

#### Step 3: Restart Backend Server

```bash
# Stop the server (Ctrl+C)
# Then restart
cd backend
npm run dev
```

### Option 2: Outlook/Hotmail (Free)

#### Step 1: Enable App Password

1. Go to https://account.microsoft.com/security
2. Click **Security** → **Advanced security options**
3. Under **App passwords**, click **Create a new app password**
4. Name it: `ChefGPT`
5. **Copy the password**

#### Step 2: Add to Backend `.env` File

```env
# SMTP Configuration (Outlook)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-app-password

FRONTEND_URL=https://your-app.vercel.app
```

### Option 3: Custom SMTP (Any Email Provider)

```env
# SMTP Configuration (Custom)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password

FRONTEND_URL=https://your-app.vercel.app
```

**Common SMTP Settings:**
- **Gmail**: `smtp.gmail.com:587`
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: `smtp.sendgrid.net:587` (requires API key)
- **Mailgun**: `smtp.mailgun.org:587` (requires API key)

## 🧪 Testing Your Configuration

1. **Add a friend** in the chat interface
2. **Check the backend console** - you should see:
   ```
   ✅ Invitation email sent to: friend@example.com
   ```
3. **Check your friend's inbox** (and spam folder)
4. If you see errors, check the console logs

## 🚨 Troubleshooting

### Error: "Invalid login"
- **Problem**: Wrong password or username
- **Solution**: 
  - For Gmail: Make sure you're using an **App Password**, not your regular password
  - Double-check the email address is correct

### Error: "Connection timeout"
- **Problem**: Firewall or network blocking port 587
- **Solution**: Try port 465 with SSL:
  ```env
  SMTP_PORT=465
  ```
  (You may need to update the code to use SSL)

### Error: "Authentication failed"
- **Problem**: 2-Step Verification not enabled (for Gmail)
- **Solution**: Enable 2-Step Verification first, then create App Password

### Emails going to spam
- **Problem**: Email provider marking as spam
- **Solution**: 
  - Ask friends to mark as "Not Spam"
  - Use a custom domain email (more professional)
  - Configure SPF/DKIM records (advanced)

## 📝 Environment Variables Summary

Add these to your `backend/.env` file:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SMTP_HOST` | ✅ Yes | SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ Yes | SMTP port (usually 587) | `587` |
| `SMTP_USER` | ✅ Yes | Your email address | `your-email@gmail.com` |
| `SMTP_PASSWORD` | ✅ Yes | App password (not regular password) | `abcd efgh ijkl mnop` |
| `FRONTEND_URL` | ✅ Yes | Your frontend URL | `https://your-app.vercel.app` |

## 🔒 Security Notes

1. **Never commit `.env` file to Git** - it contains sensitive passwords
2. **Use App Passwords** - Don't use your main email password
3. **Keep passwords secret** - Don't share them in screenshots or messages
4. **For production** - Use environment variables in your hosting platform (Railway, Vercel, etc.)

## 🌐 Production Deployment

### Railway (Backend)

1. Go to your Railway project
2. Click **Variables** tab
3. Add all SMTP variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Redeploy

### Vercel (Frontend)

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   ```
4. Redeploy

## ✅ Success Checklist

- [ ] Created App Password in Gmail/Outlook
- [ ] Added SMTP variables to `backend/.env`
- [ ] Restarted backend server
- [ ] Tested by adding a friend
- [ ] Friend received email in inbox
- [ ] Email links work correctly

## 💡 Free Alternatives

If you don't want to configure SMTP, ChefGPT will:
- ✅ Still work perfectly
- ✅ Log email invitations to console
- ✅ Auto-create friend accounts
- ❌ Won't send actual emails (friends won't get notifications)

**You can manually share the signup link and temporary password with friends!**

---

**Need help?** Check the console logs when adding a friend - they show exactly what email would be sent!

