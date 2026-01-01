// ============================================
// GEMINI AI SERVICE - Free AI responses using Google Gemini
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (free tier)
// Get API key from: https://makersuite.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get AI response using Gemini
 * @param {string} prompt - User's message
 * @returns {Promise<string>} - AI response
 */
async function getAIResponse(prompt) {
  try {
    // If no API key, return a friendly message
    if (!process.env.GEMINI_API_KEY) {
      return "Hey! I'm @bro, your AI assistant. To use me, add GEMINI_API_KEY to your .env file. Get a free API key at https://makersuite.google.com/app/apikey";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const chatPrompt = `You are @bro, a friendly and helpful AI assistant. 
    Keep responses concise, friendly, and helpful. 
    User message: ${prompt}
    
    Respond naturally and conversationally:`;

    const result = await model.generateContent(chatPrompt);
    const response = await result.response;
    return response.text() || "Sorry, I couldn't generate a response. Try again!";
  } catch (error) {
    console.error('Gemini AI error:', error);
    return "Oops! I'm having trouble right now. Try again in a moment!";
  }
}

module.exports = { getAIResponse };

