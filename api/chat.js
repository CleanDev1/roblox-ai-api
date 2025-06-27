const express = require('express');
const app = express();
const responses = require('../responses.json');

app.use(express.json());

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
    else if (/nice|good|great|awesome/i.test(message)) {
      response = responses.compliments[Math.floor(Math.random() * responses.compliments.length)];
    }
    else {
      response = responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
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
