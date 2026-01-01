// ============================================
// GEMINI API KEY TEST SCRIPT
// ============================================
// Run this script to test if your GEMINI_API_KEY is working
// Usage: node scripts/testGemini.js

require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('🧪 Testing Gemini API Key...\n');

  // Check if API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    console.log('\n📝 To fix this:');
    console.log('1. Get a free API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Add it to backend/.env file: GEMINI_API_KEY=your-key-here');
    console.log('3. Restart your server');
    process.exit(1);
  }

  console.log('✅ GEMINI_API_KEY found in .env file');
  console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);

  // Validate format
  if (!apiKey.startsWith('AIza')) {
    console.error('❌ API key format appears invalid (should start with "AIza")');
    process.exit(1);
  }

  console.log('✅ API key format looks valid\n');

  // Test with different models
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // First, try to list available models using REST API
  console.log('📋 Attempting to list available models...\n');
  let modelNames = [];
  
  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    if (response.data && response.data.models) {
      const availableModels = response.data.models
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .map(model => model.name.replace('models/', ''));
      
      if (availableModels.length > 0) {
        console.log(`✅ Found ${availableModels.length} available models:`);
        availableModels.forEach(model => console.log(`   - ${model}`));
        console.log('');
        modelNames = availableModels;
      } else {
        console.log('⚠️ No models found with generateContent support\n');
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not list models: ${error.message}`);
    console.log('   Trying common model names instead...\n');
  }
  
  // Fallback to common model names if listing failed
  if (modelNames.length === 0) {
    modelNames = [
      'gemini-pro',           // Most common
      'gemini-1.5-flash',     // Fast and efficient
      'gemini-1.5-pro',       // More capable
      'gemini-1.0-pro'        // Legacy
    ];
  }

  console.log('🔄 Testing models...\n');

  const axios = require('axios');
  
  for (const modelName of modelNames) {
    try {
      console.log(`Testing ${modelName}...`);
      
      // Try SDK first
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello, I am working!" in one sentence.');
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`✅ ${modelName} is working! (SDK)`);
          console.log(`   Response: ${text.substring(0, 100)}...\n`);
          console.log('🎉 Your Gemini API is configured correctly!');
          process.exit(0);
        }
      } catch (sdkError) {
        // If SDK fails, try REST API directly
        console.log(`   SDK failed, trying REST API...`);
        
        try {
          const restResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
            {
              contents: [{
                parts: [{
                  text: 'Say "Hello, I am working!" in one sentence.'
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
            console.log(`✅ ${modelName} is working! (REST API)`);
            console.log(`   Response: ${text.substring(0, 100)}...\n`);
            console.log('🎉 Your Gemini API is configured correctly!');
            process.exit(0);
          }
        } catch (restError) {
          throw restError; // Throw to outer catch
        }
      }
    } catch (error) {
      const errorMsg = error.message || error.response?.data?.error?.message || 'Unknown error';
      console.log(`❌ ${modelName} failed: ${errorMsg}`);
      
      // Check for specific errors
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('401') || error.response?.status === 401) {
        console.error('\n❌ Your API key is invalid or expired!');
        console.log('📝 Get a new key from: https://makersuite.google.com/app/apikey');
        process.exit(1);
      }
      
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || error.response?.status === 429) {
        console.log('⏱️ Rate limit reached. Wait a minute and try again.');
        continue;
      }
      
      if (errorMsg.includes('404') || errorMsg.includes('not found') || error.response?.status === 404) {
        console.log('⚠️ Model not found (trying next model...)');
        continue;
      }
      
      console.log(`   Error details: ${errorMsg}\n`);
    }
  }

  console.error('❌ All models failed. Please check:');
  console.log('1. Your API key is correct');
  console.log('2. You have internet connection');
  console.log('3. Your API key has access to Gemini models');
  console.log('4. Check server logs for more details');
  process.exit(1);
}

// Run the test
testGemini().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

