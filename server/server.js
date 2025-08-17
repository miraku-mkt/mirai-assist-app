const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Ollama API endpoint
const OLLAMA_BASE_URL = 'http://localhost:11434';
const MODEL_NAME = 'gemma2:2b';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mirai Assist Server is running' });
});

// AI generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('=== API GENERATE REQUEST RECEIVED ===');
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body || {}));
  
  try {
    const { systemPrompt, userPrompt } = req.body;
    
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ 
        error: 'systemPrompt and userPrompt are required' 
      });
    }

    console.log('AI Generation Request:');
    console.log('System Prompt Length:', systemPrompt.length);
    console.log('User Prompt Length:', userPrompt.length);

    // Combine system and user prompts for ollama
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Call ollama API
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt: combinedPrompt,
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_ctx: 4096
      }
    });

    let generatedText = response.data.response;
    
    // マークダウン記法のクリーニング
    generatedText = generatedText.replace(/```json\n?/g, '');
    generatedText = generatedText.replace(/```\n?/g, '');
    generatedText = generatedText.trim();
    
    // JSON構造の後の説明文を除去
    const jsonEndIndex = generatedText.lastIndexOf('}');
    if (jsonEndIndex !== -1) {
      generatedText = generatedText.substring(0, jsonEndIndex + 1);
    }
    
    // 追加のクリーニング（**で始まる説明文除去）
    generatedText = generatedText.replace(/\*\*[^*]+\*\*.*$/s, '');
    generatedText = generatedText.replace(/\n\n.*$/s, ''); // 空行以降の説明文を除去
    generatedText = generatedText.trim();
    
    console.log('AI Generation Success:');
    console.log('Generated Text Length:', generatedText.length);
    console.log('Response Preview:', generatedText.slice(0, 200) + '...');

    res.json({ 
      response: generatedText,
      model: MODEL_NAME,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Generation Error:', error.message);
    
    if (error.response) {
      console.error('Ollama API Error:', error.response.data);
      res.status(500).json({ 
        error: 'Ollama API Error', 
        details: error.response.data 
      });
    } else if (error.request) {
      console.error('Network Error - Is ollama running?');
      res.status(503).json({ 
        error: 'Cannot connect to ollama. Please ensure ollama is running.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        details: error.message 
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Mirai Assist Server running on http://localhost:${PORT}`);
  console.log(`Using AI Model: ${MODEL_NAME}`);
  console.log('Health check: http://localhost:3006/health');
});