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

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check
app.get('/health', (req, res) => res.status(200).send('OK'));

// AI endpoint
app.post('/', async (req, res) => {
  try {
    if (!req.body.prompt) {
      return res.status(400).json({ error: 'Please provide a prompt' });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: "You are a helpful AI assistant specialized in Roblox game development. Provide clear, concise answers with code examples when possible."
    });

    const result = await model.generateContent(req.body.prompt);
    const response = await result.response.text();

    res.json({
      response: response,
      model: "gemini-pro",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ 
      error: "AI service unavailable",
      details: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => res.send(`
  <html>
    <body>
      <h1>Roblox AI Assistant (Gemini)</h1>
      <p>Send POST requests to / with JSON body: {"prompt":"your question"}</p>
    </body>
  </html>
`));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));