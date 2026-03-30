const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initializing with your Google API Key
const genAI = new GoogleGenerativeAI(process.env.ANTHROPIC_API_KEY); 

const transformPost = async (originalContent, platforms = ['facebook', 'instagram', 'twitter']) => {
  // ✅ Using the Gemini 2.0 Flash-Lite identifier
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.8 // Slightly higher for more creative social media variants
    }
  });

  const prompt = `You are a social media expert. Rewrite this post for each platform.
Return ONLY a valid JSON object.

Original post: "${originalContent}"

Rules:
- facebook: Friendly and engaging. Up to 500 characters. 1-2 emojis.
- instagram: Exciting and visual. Up to 400 characters. Add 5-8 hashtags at the end.
- twitter: Short and punchy. MUST be under 280 characters. 1-2 emojis. No hashtags.

Required JSON Structure:
{
  "facebook": "...",
  "instagram": "...",
  "twitter": "..."
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON directly
    const all = JSON.parse(text);
    
    // Filter results to only include requested platforms
    const filteredResult = {};
    platforms.forEach(p => { 
      if (all[p]) filteredResult[p] = all[p]; 
    });

    return filteredResult;
  } catch (error) {
    console.error("AI Service Error:", error);
    // Fallback if the specific lite model isn't available in your region yet
    throw new Error("AI transformation failed. Check your API key or model availability.");
  }
};

module.exports = { transformPost };