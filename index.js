require('ssl-root-cas').inject();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Gemini with correct free-tier model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use your "API key 2" here

// Security Middleware
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGIN || '*' // Recommended: Replace with your Roblox game's domain
}));

app.use(express.json({ limit: '10kb' }));

// Strict Rate Limiting (60 requests/min = free tier limit)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Matches Gemini's free quota
  message: JSON.stringify({
    error: "Rate limit exceeded",
    details: "Maximum 60 requests per minute allowed"
  })
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "active",
    model: "gemini-pro",
    rateLimit: "60 requests/minute"
  });
});

// AI Endpoint (Secure Version)
app.post('/api/chat', async (req, res) => {
  try {
    // Input validation
    if (!req.body.prompt || typeof req.body.prompt !== 'string' || req.body.prompt.length > 500) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Prompt must be a string (max 500 chars)" 
      });
    }

    // Initialize model (using current free-tier model)
    const model = genAI.getGenerativeModel({
      model: "gemini-pro", // Correct 2024 free model
      generationConfig: {
        maxOutputTokens: 500 // Control costs
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    });

    // Generate response
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `[Roblox Game Dev Question] ${req.body.prompt}` }]
      }]
    });

    const response = await result.response;
    const text = response.text();

    // Secure response
    res.json({
      success: true,
      response: text,
      model: "gemini-pro",
      tokensUsed: response.usageMetadata?.totalTokenCount || "unknown"
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: "Service error",
      details: error.message.replace(/api key.*/gi, '[REDACTED]'), // Hide sensitive info
      help: "Check the prompt or try again later"
    });
  }
});

// Frontend Documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roblox AI API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 5px; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 5px; }
        .warning { color: red; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Roblox AI API</h1>
      <p>Current model: <strong>gemini-pro</strong> (Free Tier)</p>
      
      <div class="warning">
        <p>⚠️ Important Security Note:</p>
        <ul>
          <li>Your API key is currently UNRESTRICTED</li>
          <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Credentials</a> to restrict it</li>
          <li>Recommended restrictions: HTTP referrers (your Vercel domain) AND API restrictions (Generative Language API)</li>
        </ul>
      </div>

      <h2>Usage</h2>
      <pre>POST /api/chat
Content-Type: application/json

{
  "prompt": "Your Roblox question"
}</pre>

      <h2>Test Command</h2>
      <pre>curl -X POST https://your-vercel-url.vercel.app/api/chat \\
  -H "Content-Type: application/json" \\
  -d "{\"prompt\":\"How to make a part spin?\"}"</pre>
    </body>
    </html>
  `);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server running on port ${PORT}
  ► Model: gemini-pro (Free Tier)
  ► Security: ${process.env.GEMINI_API_KEY ? 'API Key Loaded' : 'WARNING: No API Key!'}
  ► Rate Limit: 60 requests/minute
  `);
});