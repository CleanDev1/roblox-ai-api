require('ssl-root-cas').inject(); // Fix SSL issues
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// ===== Vercel Configuration ===== //
app.set('trust proxy', true);
app.disable('x-powered-by');

// ===== Middleware ===== //
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET']
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== Routes ===== //

// Health check
app.get('/health', (req, res) => {
  res.status(200).type('text').send('OK');
});

// AI endpoint
app.post('/', async (req, res) => {
  try {
    // Validate input
    if (!req.body.prompt || typeof req.body.prompt !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid prompt' });
    }

    // Generate helpful response with ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful, kind and patient AI assistant. " +
                   "Provide clear, concise answers to questions. " +
                   "Be supportive and encouraging. " +
                   "Keep responses under 200 characters."
        },
        {
          role: "user",
          content: req.body.prompt.trim()
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const response = completion.choices[0].message.content;
    
    res.json({
      response: response,
      model: "gpt-3.5-turbo",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ 
      error: "I'm having trouble thinking right now",
      details: error.message 
    });
  }
});

// Root endpoint - documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Helpful AI Assistant</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 4px; }
        pre { background: #f8f8f8; padding: 1rem; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>🤖 Helpful AI Assistant API</h1>
      <p>Send POST requests to <code>/</code> with:</p>
      <pre>{
  "prompt": "your question or message"
}</pre>
      <p>Get kind, helpful responses in return!</p>
      <h2>Example Curl Command:</h2>
      <pre>curl -X POST https://your-vercel-app.vercel.app/ \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"How do I make a sandwich?"}'</pre>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Helpful AI Assistant Online
  ► Port: ${PORT}
  ► Ready to assist...
  `);
});