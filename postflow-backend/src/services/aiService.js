const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.ANTHROPIC_API_KEY);

const transformPost = async (originalContent, platforms = ['facebook', 'instagram', 'twitter', 'linkedin']) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    }
  });

  const prompt = `You are a social media expert. Rewrite this post for each platform.
Return ONLY a valid JSON object.

Original post: "${originalContent}"

Rules:
- facebook: Friendly and engaging. Up to 500 characters. 1-2 emojis.
- instagram: Exciting and visual. Up to 400 characters. Add 5-8 hashtags at the end.
- twitter: Short and punchy. MUST be under 280 characters. 1-2 emojis. No hashtags.
- linkedin: Professional and insightful. Up to 1000 characters. Use a hook in the first line. Minimal hashtags (1-2 max). Focus on value, lessons, or industry insights. 1 emoji max.

Required JSON Structure:
{
  "facebook": "...",
  "instagram": "...",
  "twitter": "...",
  "linkedin": "..."
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const all = JSON.parse(text);

    // ✅ FIX: plain JS object, no TypeScript type annotation
    const filteredResult = {};
    platforms.forEach(p => {
      if (all[p]) filteredResult[p] = all[p];
    });

    return filteredResult;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("AI transformation failed. Check your API key or model availability.");
  }
};

module.exports = { transformPost };