require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting (60 requests per minute)
const limiter = rateLimit({
    windowMs: 60 * 1000,
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
        model: "gemini-1.5-flash",
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
            <p>Using <strong>Gemini 1.5 Flash</strong> model</p>
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

        // Use the model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 500
            }
        });

        // Generate response
        const result = await model.generateContent(req.body.prompt);
        const response = await result.response;
        const text = response.text();

        // Send successful response
        res.json({
            response: text,
            model: "gemini-1.5-flash",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Error:', error);
        
        // More helpful error messages
        let details = error.message;
        if (error.message.includes('API key')) {
            details = "Invalid or missing Gemini API key";
        } else if (error.message.includes('model')) {
            details = "Model configuration error - check model name";
        }
        
        res.status(500).json({
            error: "AI service unavailable",
            details: details,
            help: "Check your Gemini API key at https://aistudio.google.com/app/apikey"
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 Roblox AI Assistant Online
    ► Port: ${PORT}
    ► Model: gemini-1.5-flash
    ► Rate Limit: 60 requests/minute
    ► Ready to help with Roblox development!
    `);
});