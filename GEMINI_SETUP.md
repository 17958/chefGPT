# Gemini AI Setup Guide

## Where to Add Gemini API Key

Add your Gemini API key to the **backend `.env` file**:

1. Open or create `backend/.env` file
2. Add this line:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
3. Save the file
4. Restart your backend server

## How to Get a Free Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Paste it in your `backend/.env` file as shown above

## Example `.env` File

```env
MONGODB_URI=mongodb://localhost:27017/amma-chethi-vanta
JWT_SECRET=your-random-secret-key-here
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Using @bro in Chat

Once the API key is set up:
1. Go to the Chat page
2. Select a friend or start a conversation
3. Type `@bro your question here`
4. The AI will respond instantly!

Example messages:
- `@bro what's the weather like?`
- `@bro help me with cooking tips`
- `@bro tell me a joke`

## Note

- The API key is **free** for personal use
- Without the API key, @bro will show a message asking you to add the key
- The API key is only used on the backend, never exposed to the frontend

