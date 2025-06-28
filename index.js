require('ssl-root-cas').inject();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Gemini with free-tier model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

// Rate limiting (100 requests per 15 minutes)
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: JSON.stringify({
    error: "Too many requests",
    details: "Please wait before making more requests"
  })
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).type('text').send('OK');
});

// AI endpoint - now using gemini-1.0-pro
app.post('/', async (req, res) => {
  try {
    // Validate input
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({ 
        error: "Invalid request",
        details: "Please provide a valid 'prompt' string" 
      });
    }

    // Get the model (using free-tier model)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.0-pro", // Free and accessible model
      systemInstruction: "You are a helpful AI assistant specialized in Roblox game development. " +
                       "Provide clear, concise answers with Lua code examples when possible. " +
                       "Keep responses under 200 words."
    });

    // Generate response
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: req.body.prompt
        }]
      }]
    });

    const response = await result.response;
    const text = response.text();

    // Send successful response
    res.json({
      response: text,
      model: "gemini-1.0-pro",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({
      error: "AI service unavailable",
      details: error.message,
      help: "Check your Gemini API key and quota at https://aistudio.google.com/app/apikey"
    });
  }
});

// Documentation endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roblox AI Assistant (Gemini)</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        pre { background: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>🤖 Roblox AI Assistant API</h1>
      <p>Using <strong>gemini-1.0-pro</strong> (free tier model)</p>
      
      <h2>How to Use</h2>
      <pre>{
  "prompt": "Your Roblox question"
}</pre>
      
      <h2>Example</h2>
      <pre>curl -X POST https://your-vercel-url.vercel.app/ \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"How make part spin?"}'</pre>
      
      <p>Check <a href="/health">/health</a> for API status</p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server running on port ${PORT}
  ► Model: gemini-1.0-pro (free tier)
  ► Ready for Roblox assistance!
  `);
});