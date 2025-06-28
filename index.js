require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Current working endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!req.body.prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Try both current model names
    const modelNames = ["gemini-1.0-pro", "gemini-pro"];
    let lastError;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(req.body.prompt);
        const response = await result.response;
        
        return res.json({
          response: response.text(),
          model: modelName,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    throw lastError;

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: "AI service error",
      details: error.message.includes('API key') 
        ? "Invalid API key configuration" 
        : "Model service unavailable"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});