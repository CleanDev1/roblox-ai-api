require('ssl-root-cas').inject();
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

// AI endpoint
app.post('/', async (req, res) => {
  try {
    // Validate input
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({ 
        error: "Invalid request",
        details: "Please provide a valid 'prompt' string" 
      });
    }

    // Get the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",
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
      model: "gemini-1.5-pro-latest",
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
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        code {
          background: #f4f4f4;
          padding: 2px 5px;
          border-radius: 3px;
        }
        pre {
          background: #f8f8f8;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>🤖 Roblox AI Assistant API</h1>
      <p>This API provides AI-powered assistance for Roblox development using Google Gemini.</p>
      
      <h2>How to Use</h2>
      <p>Send POST requests to <code>/</code> with:</p>
      <pre>{
  "prompt": "Your question about Roblox development"
}</pre>
      
      <h2>Example Request</h2>
      <pre>curl -X POST https://roblox-ai-api-pi.vercel.app/ \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"How do I make a part change color?"}'</pre>
      
      <h2>Response Format</h2>
      <pre>{
  "response": "Use script.Parent.Color = Color3.new(1,0,0)",
  "model": "gemini-1.5-pro-latest",
  "timestamp": "2024-03-15T12:00:00.000Z"
}</pre>
      
      <p>Check <a href="/health">/health</a> for API status</p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Roblox AI Assistant Online
  ► Port: ${PORT}
  ► Model: gemini-1.5-pro-latest
  ► Ready to help with Roblox development!
  `);
});