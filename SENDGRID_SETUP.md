# 🚀 Quick SendGrid Setup Guide

## ✅ Your SendGrid Credentials

Based on your SendGrid account, here's what you need:

```
Server: smtp.sendgrid.net
Port: 587 (TLS) or 465 (SSL)
Username: apikey
Password: SG.your-sendgrid-api-key-here
```

**Note:** Replace `SG.your-sendgrid-api-key-here` with your actual SendGrid API key from your SendGrid dashboard (Settings → API Keys).

## 📋 Setup Steps

### Option 1: Local Development (.env file)

1. **Create `backend/.env` file** (if it doesn't exist)
2. **Add these variables:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
FRONTEND_URL=http://localhost:3000
```

**Note:** Replace `SG.your-sendgrid-api-key-here` with your actual SendGrid API key.

3. **Restart your backend server**

### Option 2: Railway (Production)

1. **Go to your Railway project dashboard**
2. **Click on your backend service**
3. **Go to the "Variables" tab**
4. **Add these environment variables:**

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASSWORD` | `SG.your-sendgrid-api-key-here` |
| `FRONTEND_URL` | `https://chef-gpt-tau.vercel.app` |

**Note:** Replace `SG.your-sendgrid-api-key-here` with your actual SendGrid API key from your SendGrid dashboard.

5. **Redeploy your backend** (Railway will auto-redeploy when you add variables)

### Option 3: Vercel (If backend is on Vercel)

1. **Go to Vercel Dashboard → Your Project**
2. **Settings → Environment Variables**
3. **Add the same variables as above**
4. **Redeploy**

## 🧪 Test It!

1. **Start your backend server**
2. **Add a friend** in the chat interface
3. **Check the console** - you should see:
   ```
   ✅ Invitation email sent to: friend@example.com
   ```
4. **Check your friend's inbox** (and spam folder)

## ✅ Success Indicators

- ✅ No "SMTP not configured" messages in console
- ✅ "Invitation email sent" message appears
- ✅ Friend receives email in inbox
- ✅ Email links work correctly

## 🚨 Troubleshooting

### Still seeing "SMTP not configured"?
- Check that environment variables are set correctly
- Make sure you restarted the server after adding variables
- For Railway: Make sure you redeployed after adding variables

### Connection timeout?
- Try port `465` instead of `587` (SSL instead of TLS)
- Update `SMTP_PORT=465` in your environment variables
- Railway might need a moment to establish connection

### Authentication failed?
- Double-check the API key is correct
- Make sure `SMTP_USER` is exactly `apikey` (not your email)
- Verify the API key has "Mail Send" permissions in SendGrid

### Emails not arriving?
- Check spam folder
- Verify the email address is correct
- Check SendGrid dashboard for delivery status
- Free tier limit: 100 emails/day

## 📊 SendGrid Dashboard

Monitor your emails:
- **SendGrid Dashboard** → **Activity** → See all sent emails
- **Statistics** → Track delivery rates
- **Settings** → **API Keys** → Manage your keys

## 🔒 Security Note

⚠️ **Important:** Your API key is sensitive! 
- Never commit it to Git
- Don't share it publicly
- If exposed, regenerate it in SendGrid dashboard
- Use environment variables, never hardcode in files

---

**Need help?** Check the backend console logs - they show detailed email sending status!
