require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const fs = require('fs');

// ==================== CONFIGURATION ====================
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

const POSTED_HRS_FILE = './posted_home_runs.json';
let postedHomeRuns = new Set();

const app = express();
app.use(express.json());

// ==================== UTILITY FUNCTIONS ====================

// Load previously posted home runs from file
function loadPostedHomeRuns() {
  try {
    if (fs.existsSync(POSTED_HRS_FILE)) {
      const data = fs.readFileSync(POSTED_HRS_FILE, 'utf8');
      const array = JSON.parse(data);
      postedHomeRuns = new Set(array);
      console.log(`📂 Loaded ${postedHomeRuns.size} previously posted home runs`);
    }
  } catch (error) {
    console.error('Error loading posted home runs:', error);
    postedHomeRuns = new Set();
  }
}

// Save posted home runs to file
function savePostedHomeRuns() {
  try {
    const array = Array.from(postedHomeRuns);
    fs.writeFileSync(POSTED_HRS_FILE, JSON.stringify(array, null, 2));
  } catch (error) {
    console.error('Error saving posted home runs:', error);
  }
}

// Post message to GroupMe
async function postToGroupMe(message, imageUrl = null) {
  try {
    const payload = {
      bot_id: GROUPME_BOT_ID,
      text: message
    };

    if (imageUrl) {
      payload.attachments = [{
        type: 'image',
        url: imageUrl
      }];
    }

    const response = await fetch('https://api.groupme.com/v3/bots/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.status === 202;
  } catch (error) {
    console.error('Error posting to GroupMe:', error);
    return false;
  }
}

// Upload image to GroupMe
async function uploadImageToGroupMe(imagePath) {
  try {
    // Check if file exists first
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️ Image file not found: ${imagePath}`);
      return null;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const response = await fetch('https://image.groupme.com/pictures', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Access-Token': GROUPME_ACCESS_TOKEN
      },
      body: imageBuffer
    });

    const data = await response.json();
    return data.payload.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// ==================== AI BOT (FunkBot) ====================

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  
  const message = req.body;
  
  if (message.sender_type === 'bot') return;
  
  console.log(`\n📨 Message from ${message.name}: ${message.text}`);
  
  const text = message.text || '';
  const mentionsBot = text.toLowerCase().includes('@funkbot');
  
  if (!mentionsBot) return;
  
  console.log('🎯 FunkBot mentioned!');
  
  const question = message.text.replace(/@funkbot/gi, '').trim();
  
  if (!question || question.length < 3) {
    await postToGroupMe("Hey! You mentioned me but didn't ask anything. Try: @FunkBot what's the weather?");
    return;
  }
  
  console.log(`❓ Question: "${question}"`);
  
  const aiResponse = await getClaudeResponse(question);
  
  if (aiResponse) {
    await postToGroupMe(aiResponse);
  } else {
    await postToGroupMe("Sorry, I had trouble processing that. Try again!");
  }
});

async function getClaudeResponse(question) {
  try {
    console.log('🤖 Asking Claude with web search enabled...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: question }],
        system: 'You are FunkBot, a helpful assistant in a GroupMe chat. Keep responses concise, friendly, and informative. Use emojis occasionally but not excessively. If asked about LSU sports, be enthusiastic and use purple and gold emojis 🟣🟡. IMPORTANT: Do NOT ask conversational follow-up questions like "Have you been there?" or "What do you think?". Only ask clarifying questions if you genuinely need more information to answer (e.g., "Which sport?" or "Which year?"). Just provide direct, helpful answers. Keep all responses under 400 characters when possible - be concise and to the point.',
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('📦 Claude response:', JSON.stringify(data, null, 2));
    
    // Claude's response may include multiple content blocks (text + tool use)
    let aiMessage = '';
    
    if (!data.content || data.content.length === 0) {
      console.error('No content in Claude response');
      return null;
    }
    
    for (const block of data.content) {
      if (block.type === 'text') {
        aiMessage += block.text;
      }
    }
    
    if (!aiMessage) {
      console.error('No text found in Claude response');
      return 'Sorry, I got a weird response. Try asking differently!';
    }
    
    console.log('✅ Got response from Claude:', aiMessage);
    
    if (aiMessage.length > 400) {
      return aiMessage.substring(0, 397) + '...';
    }
    
    return aiMessage.trim();
    
  } catch (error) {
    console.error('Error calling Claude:', error);
    return null;
  }
}

// ==================== HOME RUN DETECTOR ====================

async function getLSUGames() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${today}&league=NCAA`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    
    const lsuGames = data.data?.filter(match => 
      match.homeTeam.id === parseInt(LSU_TEAM_ID) || 
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    ) || [];

    return lsuGames;
  } catch (error) {
    console.error('Error fetching LSU games:', error);
    return [];
  }
}

async function getMatchDetails(matchId) {
  try {
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/matches/${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Error fetching match details:', error);
    return null;
  }
}

async function checkForHomeRuns() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Checking for LSU home runs...`);
    
    const games = await getLSUGames();
    
    if (games.length === 0) {
      console.log('No LSU games today.');
      return;
    }

    for (const game of games) {
      if (game.state.description === 'Scheduled' || game.state.description === 'Postponed') {
        continue;
      }

      const matchDetails = await getMatchDetails(game.id);
      
      if (!matchDetails || !matchDetails.plays) continue;

      const isLSUHome = game.homeTeam.id === parseInt(LSU_TEAM_ID);
      const lsuTeamId = isLSUHome ? game.homeTeam.id : game.awayTeam.id;

      for (const play of matchDetails.plays) {
        if (play.type && play.type.toLowerCase().includes('home run') && 
            play.teamId === lsuTeamId) {
          
          const playId = `${game.id}-${play.description}-${play.period}`;
          
          if (!postedHomeRuns.has(playId)) {
            console.log(`🎉 NEW LSU HOME RUN: ${play.description}`);
            
            // Try to upload image, but continue if it fails
            const imageUrl = await uploadImageToGroupMe('./FunkBlastoise.jpg');
            if (imageUrl) {
              await postToGroupMe('', imageUrl);
            } else {
              // Post text if image fails
              await postToGroupMe('🎉 LSU HOME RUN! 🟣🟡');
            }
            
            postedHomeRuns.add(playId);
            savePostedHomeRuns();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkForHomeRuns:', error);
  }
}

// ==================== GAME DAY SCHEDULER ====================

async function checkForGameToday() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n[${new Date().toLocaleString()}] 📅 Checking for LSU games on ${today}...`);
  
  const games = await getLSUGames();
  
  if (games.length > 0) {
    console.log(`✅ Found ${games.length} LSU game(s) today!`);
    // Home run checker already running via cron
  } else {
    console.log('❌ No LSU games today.');
  }
}

// ==================== STARTUP & CRON JOBS ====================

app.get('/', (req, res) => {
  res.send('🤖 FunkBot Master Server - All Systems Online! 🐯⚾🤖');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🐯 FUNKBOT MASTER SERVER STARTING 🐯');
    console.log('='.repeat(60));
    
    // Check required environment variables
    console.log('Checking environment variables...');
    const required = ['GROUPME_BOT_ID', 'ANTHROPIC_API_KEY', 'RAPIDAPI_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.log('Please add them in Railway Variables tab!');
    } else {
      console.log('✅ All required environment variables present');
    }
    
    // Load home run tracking data
    loadPostedHomeRuns();
    
    // Check for home runs every minute (only during games)
    cron.schedule('* * * * *', checkForHomeRuns);
    console.log('✅ Home run detector: Running every minute');
    
    // Check for games daily at 6 AM
    cron.schedule('0 6 * * *', checkForGameToday);
    console.log('✅ Game scheduler: Running daily at 6:00 AM CST');
    
    // Start Express server for FunkBot AI
    app.listen(PORT, () => {
      console.log('✅ FunkBot AI: Listening for @mentions');
      console.log(`\n🌐 Server running on port ${PORT}`);
      console.log(`📡 Webhook URL: /webhook`);
      console.log('\n' + '='.repeat(60));
      console.log('ALL SYSTEMS ONLINE! 🎉');
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ FATAL ERROR ON STARTUP:', error);
    console.error(error.stack);
    // Don't exit - try to keep server running anyway
    app.listen(PORT, () => {
      console.log(`⚠️ Server started on port ${PORT} despite errors`);
    });
  }
}

// Catch any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

startServer();