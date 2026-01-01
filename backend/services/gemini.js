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

    // Try different model names in order of preference
    const modelNames = [
      'gemini-pro',           // Most stable and widely available
      'gemini-1.0-pro',      // Alternative stable model
      'gemini-1.5-pro',      // If available
      'gemini-2.0-flash-exp' // Experimental
    ];

    let lastError = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const chatPrompt = `You are @bro, a friendly and helpful AI assistant. 
        Keep responses concise, friendly, and helpful. 
        User message: ${prompt}
        
        Respond naturally and conversationally:`;

        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`✅ Using model: ${modelName}`);
          return text;
        }
      } catch (error) {
        console.log(`⚠️ Model ${modelName} failed, trying next...`);
        lastError = error;
        continue;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All models failed');
  } catch (error) {
    console.error('Gemini AI error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Return user-friendly error message
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return "Sorry! The AI model is currently unavailable. Please check your GEMINI_API_KEY and try again later.";
    }
    
    return "Oops! I'm having trouble right now. Try again in a moment!";
  }
}

module.exports = { getAIResponse };

