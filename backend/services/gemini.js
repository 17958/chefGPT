// ============================================
// GEMINI AI SERVICE - Free AI responses using Google Gemini
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini AI (free tier)
// Get API key from: https://makersuite.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * List available models using REST API
 */
async function listAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    if (response.data && response.data.models) {
      return response.data.models
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .map(model => model.name.replace('models/', ''));
    }
    return [];
  } catch (error) {
    console.error('Error listing models:', error.message);
    return [];
  }
}

/**
 * Get AI response using Gemini
 * @param {string} prompt - User's message
 * @param {string} context - Context for the AI (e.g., 'raja' or '@bro')
 * @param {Array} chatHistory - Previous messages for context (optional)
 * @returns {Promise<string>} - AI response
 */
async function getAIResponse(prompt, context = '@bro', chatHistory = []) {
  try {
    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ GEMINI_API_KEY is not set in environment variables');
      return "Hey! I'm @bro, your AI assistant. To use me, add GEMINI_API_KEY to your .env file. Get a free API key at https://makersuite.google.com/app/apikey";
    }

    // Validate API key format (should start with AIza)
    if (!apiKey.startsWith('AIza')) {
      console.error('❌ GEMINI_API_KEY format appears invalid (should start with AIza)');
      return "Hey! Your GEMINI_API_KEY appears to be invalid. Please check your API key format. Get a new key at https://makersuite.google.com/app/apikey";
    }

    console.log('✅ GEMINI_API_KEY found, using fastest model...');

    // Skip model listing for speed - use fastest models directly
    // Try fastest models first for better response time
    const modelNames = [
      'gemini-1.5-flash',     // Fastest and most reliable
      'gemini-2.0-flash',     // Fast
      'gemini-2.5-flash',     // Latest and fast
      'gemini-1.5-pro',       // Slower but capable fallback
      'gemini-pro'            // Legacy fallback
    ];

    let lastError = null;
    const identity = context === 'raja' ? 'Raja' : '@bro';
    
    // Build chat history context if available
    let historyContext = '';
    if (chatHistory && chatHistory.length > 0) {
      // Take last 10 messages for context (to avoid token limits)
      const recentHistory = chatHistory.slice(-10);
      historyContext = '\n\nPrevious conversation:\n';
      recentHistory.forEach(msg => {
        const role = msg.sender?.name === identity || msg.isAIResponse ? 'Assistant' : 'User';
        const content = msg.content || '';
        historyContext += `${role}: ${content}\n`;
      });
    }
    
    // Try SDK first, then REST API as fallback
    for (const modelName of modelNames) {
      try {
        console.log(`🔄 Attempting to use model: ${modelName} (SDK)`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const chatPrompt = `You are ${identity}, a helpful and intelligent AI assistant. 
        Respond naturally, professionally, and conversationally. 
        Keep responses concise and relevant. 
        Do not use overly casual terms like "Buddy", "Pal", or "Dude". 
        Address the user naturally by their name if mentioned, or use a neutral, friendly tone.${historyContext}
        
        Current user message: ${prompt}
        
        Provide a helpful and natural response based on the conversation context:`;

        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`✅ Successfully using model: ${modelName}`);
          return text;
        }
      } catch (sdkError) {
        console.log(`⚠️ SDK failed for ${modelName}, trying REST API...`);
        
        // Try REST API as fallback
        try {
          const restResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
            {
              contents: [{
                parts: [{
                  text: `You are ${identity}, a helpful and intelligent AI assistant. Respond naturally, professionally, and conversationally. Keep responses concise and relevant. Do not use overly casual terms like "Buddy", "Pal", or "Dude". Address the user naturally by their name if mentioned, or use a neutral, friendly tone.${historyContext} Current user message: ${prompt}. Provide a helpful and natural response based on the conversation context:`
                }]
              }]
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (restResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = restResponse.data.candidates[0].content.parts[0].text;
            console.log(`✅ Successfully using model: ${modelName} (REST API)`);
            return text;
          }
        } catch (restError) {
          console.log(`⚠️ Both SDK and REST failed for ${modelName}:`, {
            sdkError: sdkError.message,
            restError: restError.message,
            restStatus: restError.response?.status
          });
          lastError = restError;
          continue;
        }
        
        lastError = sdkError;
        continue;
      }
    }

    // If all models failed, log and throw
    console.error('❌ All Gemini models failed. Last error:', lastError?.message);
    throw lastError || new Error('All models failed');
  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Check for specific error types and provide helpful messages
    const errorMessage = error.message || '';
    const errorStatus = error.response?.status;
    
    // API key errors
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorStatus === 401) {
      return "🔑 Your GEMINI_API_KEY is invalid or expired. Please check your API key at https://makersuite.google.com/app/apikey and update it in your .env file.";
    }
    
    // Rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorStatus === 429) {
      return "⏱️ Rate limit reached! You've made too many requests. Please wait a minute and try again. (Free tier: 15 requests/minute)";
    }
    
    // Model not found errors
    if (errorMessage.includes('404') || errorMessage.includes('not found') || errorStatus === 404) {
      return "❌ Model not found. This might be a temporary issue. Please try again in a moment, or check if your API key has access to Gemini models.";
    }
    
    // Quota exceeded
    if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
      return "📊 API quota exceeded. You've reached your free tier limit. Please wait or upgrade your plan at https://ai.google.dev/pricing";
    }
    
    // Generic error
    return `Oops! I'm having trouble right now. Error: ${errorMessage.substring(0, 100)}. Please try again in a moment!`;
  }
}

module.exports = { getAIResponse };

