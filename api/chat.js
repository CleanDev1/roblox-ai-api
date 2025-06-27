const express = require('express');
const app = express();
const responses = require('../responses.json');

// Enable CORS and JSON parsing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
});
app.use(express.json());

// GET endpoint for browser testing
app.get('/api/chat', (req, res) => {
  res.json({ 
    status: 'API is working!',
    usage: 'Send POST requests to this endpoint',
    model: "github-ai-v1"
  });
});

// POST endpoint for Roblox
app.post('/api/chat', (req, res) => {
  try {
    const { message } = req.body;
    
    let response;
    if (/hello|hi|hey/i.test(message)) {
      response = responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    } 
    else if (/\?$/.test(message)) {
      response = responses.questions[Math.floor(Math.random() * responses.questions.length)];
    }
    else {
      response = responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    res.json({
      response: response,
      model: "github-ai-v1",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = app;