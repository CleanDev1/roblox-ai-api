require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

// Rate limiting (60 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: JSON.stringify({
    error: "Rate limit exceeded",
    details: "Maximum 60 requests per minute allowed"
  })
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    model: "gemini-1.0-pro",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roblox AI Assistant</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>🤖 Roblox AI Assistant API</h1>
      <p>This API is running and ready to process requests.</p>
      <p>Use POST <code>/api/chat</code> to ask questions about Roblox development.</p>
      <p>Check <a href="/health">/health</a> for system status.</p>
    </body>
    </html>
  `);
});

// AI endpoint
app.post('/api/chat', async (req, res) => {
  try {
    // Validate input
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({ 
        error: "Invalid request",
        details: "Please provide a valid 'prompt' string" 
      });
    }

    // Get the model (with fallback)
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    } catch (modelError) {
      console.warn('Falling back to gemini-pro model');
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    // Generate response
    const result = await model.generateContent(req.body.prompt);
    const response = await result.response;
    const text = response.text();

    // Send successful response
    res.json({
      response: text,
      model: model.model,
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Roblox AI Assistant Online
  ► Port: ${PORT}
  ► Model: gemini-1.0-pro (with fallback)
  ► Rate Limit: 60 requests/minute
  ► Ready to help with Roblox development!
  `);
});