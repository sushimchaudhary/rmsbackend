// const OpenAI = require('openai');

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// let cachedInsight = null;
// let lastFetchTime = 0;
// const CACHE_DURATION = 10 * 60 * 1000;

// const generateSalesInsights = async (salesData) => {
//   const now = Date.now();
//   if (cachedInsight && (now - lastFetchTime < CACHE_DURATION)) {
//     return cachedInsight;
//   }

//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-4o-mini', // fast & cheap model
//       messages: [
//         {
//           role: 'system',
//           content: 'You are an expert Restaurant Data Analyst. Analyze sales data and give 3 short, actionable suggestions to increase revenue.'
//         },
//         {
//           role: 'user',
//           content: JSON.stringify(salesData)
//         }
//       ],
//     });

//     const text = response.choices[0]?.message?.content;
//     if (text) {
//       cachedInsight = text;
//       lastFetchTime = now;
//       return cachedInsight;
//     }
//   } catch (error) {
//     console.error("OpenAI Insights API Error:", error.message || error);
//   }

//   return `1. **Promote Combo Meals:** Pair top-selling items with low-margin drinks.\n2. **Optimize Peak Hours:** Offer small discounts during off-peak hours.\n3. **Menu Engineering:** Highlight high-profit margin dishes.`;
// };

// module.exports = { generateSalesInsights };


const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

let cachedInsight = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minutes Cache

const generateSalesInsights = async (salesData) => {
  const now = Date.now();

  // Return cached result if fresh
  if (cachedInsight && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedInsight;
  }

  try {
    if (!apiKey || !apiKey.startsWith('AIzaSy')) {
      throw new Error("Missing or invalid GEMINI_API_KEY in .env");
    }

    const prompt = `You are an expert Restaurant Data Analyst. Analyze this sales data and give 3 short, actionable suggestions to increase revenue: ${JSON.stringify(salesData)}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    if (response.text) {
      cachedInsight = response.text;
      lastFetchTime = now;
      return cachedInsight;
    }
  } catch (error) {
    console.error("AI Insights Error:", error.message || error);
  }

  // Graceful Fallback if API fails
  return `1. **Promote Combo Meals:** Pair top-selling items with low-margin drinks.\n2. **Optimize Peak Hours:** Offer small discounts during off-peak hours.\n3. **Menu Engineering:** Highlight high-profit margin dishes.`;
};

module.exports = { generateSalesInsights };