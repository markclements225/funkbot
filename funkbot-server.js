require('dotenv').config();
const express = require('express');

const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BOT_NAME = 'FunkBot'; // Your bot's name in GroupMe

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🤖 FunkBot is running!');
});

// GroupMe webhook endpoint
app.post('/webhook', async (req, res) => {
  // Immediately respond to GroupMe with 200 OK
  res.sendStatus(200);
  
  const message = req.body;
  
  // Ignore messages from the bot itself to prevent loops
  if (message.sender_type === 'bot') {
    return;
  }
  
  // Log incoming message
  console.log('\n' + '='.repeat(60));
  console.log('📨 Received message:');
  console.log(`From: ${message.name}`);
  console.log(`Text: ${message.text}`);
  console.log('='.repeat(60));
  
  // Check if bot is @mentioned (only respond to tags, not casual mentions)
  const text = message.text || '';
  const mentionsBot = text.toLowerCase().includes('@funkbot');
  
  if (!mentionsBot) {
    console.log('ℹ️  Bot not mentioned, ignoring message.');
    return;
  }
  
  console.log('🎯 Bot mentioned! Processing...\n');
  
  // Extract the question (remove @FunkBot mention - case insensitive)
  const question = message.text
    .replace(/@funkbot/gi, '')
    .trim();
  
  if (!question || question.length < 3) {
    console.log('⚠️  No question detected after mention.');
    await postToGroupMe("Hey! You mentioned me but didn't ask anything. Try: FunkBot what's the weather?");
    return;
  }
  
  console.log(`❓ Question: "${question}"\n`);
  
  // Get AI response
  const aiResponse = await getClaudeResponse(question);
  
  if (aiResponse) {
    await postToGroupMe(aiResponse);
  } else {
    await postToGroupMe("Sorry, I had trouble processing that. Try again!");
  }
});

// Function to get response from Claude API
async function getClaudeResponse(question) {
  try {
    console.log('🤖 Sending to Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200, // Shorter responses for GroupMe (roughly 150-400 chars)
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        system: 'You are FunkBot, a helpful assistant in a GroupMe chat. Keep responses concise, friendly, and informative. Use emojis occasionally but not excessively. If asked about LSU sports, be enthusiastic and use purple and gold emojis 🟣🟡. IMPORTANT: Do NOT ask conversational follow-up questions like "Have you been there?" or "What do you think?". Only ask clarifying questions if you genuinely need more information to answer (e.g., "Which sport?" or "Which year?"). Just provide direct, helpful answers. Keep all responses under 400 characters when possible - be concise and to the point.'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Claude API error:', error);
      return null;
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;
    
    console.log('✅ Got response from Claude');
    console.log(`📝 Response: ${aiMessage.substring(0, 100)}...`);
    
    // GroupMe has a 1000 character limit, but we aim for 400 for readability
    if (aiMessage.length > 400) {
      return aiMessage.substring(0, 397) + '...';
    }
    
    return aiMessage;
    
  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
    return null;
  }
}

// Function to post message to GroupMe
async function postToGroupMe(message) {
  try {
    console.log('\n📤 Posting to GroupMe...');
    
    const response = await fetch('https://api.groupme.com/v3/bots/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: GROUPME_BOT_ID,
        text: message
      })
    });

    if (response.status === 202) {
      console.log('✅ Successfully posted to GroupMe!\n');
      return true;
    } else {
      console.error('❌ Failed to post to GroupMe:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error posting to GroupMe:', error);
    return false;
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 FunkBot AI Server Started!');
  console.log('='.repeat(60));
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log('\n💡 To receive messages:');
  console.log('   1. Deploy this to a public server (Railway, Render, etc.)');
  console.log('   2. Update your GroupMe bot callback URL');
  console.log('   3. @mention FunkBot in your group!');
  console.log('\n' + '='.repeat(60) + '\n');
});