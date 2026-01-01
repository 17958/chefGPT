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
    // Using only stable, available models
    const modelNames = [
      'gemini-1.5-flash',     // Fast and efficient (recommended)
      'gemini-1.5-pro',      // More capable model
      'gemini-pro',          // Stable fallback
      'gemini-1.0-pro'       // Legacy fallback
    ];

    let lastError = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`🔄 Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const chatPrompt = `You are @bro, a friendly and helpful AI assistant. 
        Keep responses concise, friendly, and helpful. 
        User message: ${prompt}
        
        Respond naturally and conversationally:`;

        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`✅ Successfully using model: ${modelName}`);
          return text;
        }
      } catch (error) {
        console.log(`⚠️ Model ${modelName} failed: ${error.message}`);
        lastError = error;
        // Continue to next model
        continue;
      }
    }

    // If all models failed, log and throw
    console.error('❌ All Gemini models failed. Last error:', lastError?.message);
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

