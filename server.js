require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const fs = require('fs');

// ==================== CONFIGURATION ====================
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

const POSTED_HRS_FILE = './posted_home_runs.json';
let postedHomeRuns = new Set();

// Store recent conversation history (last 20 messages)
const conversationHistory = [];
const MAX_HISTORY = 20;

// Home run monitoring state
let homeRunMonitoringActive = false;
let monitoringInterval = null;

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
    console.log('\n📤 Posting to GroupMe...');
    console.log('Message:', message);
    console.log('Image URL:', imageUrl);
    console.log('Bot ID:', GROUPME_BOT_ID);
    
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

    console.log('GroupMe response status:', response.status);
    
    if (response.status === 202) {
      console.log('✅ Successfully posted to GroupMe!');
      return true;
    } else {
      const text = await response.text();
      console.error('❌ GroupMe post failed:', response.status, text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error posting to GroupMe:', error);
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
  
  if (!mentionsBot) {
    // Store non-bot messages for context
    conversationHistory.push({
      role: 'user',
      content: `${message.name}: ${text}`,
      timestamp: Date.now()
    });
    
    // Keep only last MAX_HISTORY messages
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory.shift();
    }
    return;
  }
  
  console.log('🎯 FunkBot mentioned!');
  
  const question = message.text.replace(/@funkbot/gi, '').trim();
  
  if (!question || question.length < 3) {
    await postToGroupMe("Hey! You mentioned me but didn't ask anything. Try: @FunkBot what's the weather?");
    return;
  }
  
  console.log(`❓ Question: "${question}"`);
  
  // Add this question to history
  conversationHistory.push({
    role: 'user',
    content: `${message.name}: ${question}`,
    timestamp: Date.now()
  });
  
  const aiResponse = await getPerplexityResponse(question, message.name);
  
  if (aiResponse) {
    await postToGroupMe(aiResponse);
    
    // Add bot response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    });
    
    // Keep only last MAX_HISTORY messages
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory.shift();
    }
  } else {
    await postToGroupMe("Sorry, I had trouble processing that. Try again!");
  }
});

async function getPerplexityResponse(question, userName) {
  try {
    console.log('🤖 Asking Perplexity with web search and conversation context...');

    // Build messages array with conversation history
    const messages = [];

    // Add system message first (Perplexity uses system in messages array)
    messages.push({
      role: 'system',
      content: 'You are FunkBot, a helpful assistant in a GroupMe chat. Keep responses concise, friendly, and informative. Use emojis occasionally but not excessively. If asked about LSU sports, be enthusiastic and use purple and gold emojis 🟣🟡. IMPORTANT: You CAN provide sports betting predictions, odds analysis, parlays, and game predictions when asked - this is allowed and encouraged. Do NOT ask conversational follow-up questions like "Have you been there?" or "What do you think?". Only ask clarifying questions if you genuinely need more information to answer (e.g., "Which sport?" or "Which year?"). Just provide direct, helpful answers. CRITICAL: Keep ALL responses under 2000 characters total. Be fairly concise. No rambling.'
    });

    // Add conversation history (last 20 messages)
    if (conversationHistory.length > 0) {
      const contextSummary = conversationHistory
        .slice(-20)
        .map(msg => msg.content)
        .join('\n');

      messages.push({
        role: 'user',
        content: `Recent conversation context:\n${contextSummary}\n\nCurrent question from ${userName}: ${question}`
      });
    } else {
      messages.push({
        role: 'user',
        content: question
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        search_recency_filter: 'day' // Get recent results (valid parameter)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected Perplexity response format:', data);
      return 'Sorry, I had trouble with that. Try asking differently!';
    }

    let aiMessage = data.choices[0].message.content;

    console.log('✅ Got response from Perplexity (with automatic web search)');

    if (!aiMessage) {
      console.error('No text in Perplexity response');
      return 'Sorry, I had trouble with that. Try asking differently!';
    }

    // Clean up Perplexity's response for GroupMe
    // Remove citation numbers like [1], [2], [1][2][5], etc.
    aiMessage = aiMessage.replace(/\[\d+\](\[\d+\])*/g, '');

    // Remove markdown bold (**text** -> text)
    aiMessage = aiMessage.replace(/\*\*(.*?)\*\*/g, '$1');

    // Clean up extra spaces left by removed citations
    aiMessage = aiMessage.replace(/\s+/g, ' ').trim();

    // GroupMe has 1000 char limit, but we asked Perplexity to keep it under 2000
    // Only trim if Perplexity ignored our instructions
    if (aiMessage.length > 2500) {
      console.warn('⚠️ Response too long, trimming:', aiMessage.length, 'chars');
      return aiMessage.substring(0, 897) + '...';
    }

    return aiMessage.trim();

  } catch (error) {
    console.error('Error calling Perplexity:', error);
    return null;
  }
}

// ==================== HOME RUN DETECTOR ====================

// Start home run monitoring
function startHomeRunMonitoring() {
  if (homeRunMonitoringActive) {
    console.log('⚠️ Home run monitoring already active');
    return;
  }
  
  console.log('🚀 Starting home run monitoring (checks every minute)');
  homeRunMonitoringActive = true;
  
  // Check immediately
  checkForHomeRuns();
  
  // Then check every minute
  monitoringInterval = setInterval(checkForHomeRuns, 60 * 1000);
}

// Stop home run monitoring
function stopHomeRunMonitoring() {
  if (!homeRunMonitoringActive) return;
  
  console.log('🛑 Stopping home run monitoring');
  homeRunMonitoringActive = false;
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

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
    if (!homeRunMonitoringActive) return;
    
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Checking for LSU home runs...`);
    
    const games = await getLSUGames();
    
    if (games.length === 0) {
      console.log('No LSU games in progress.');
      return;
    }

    let allGamesFinished = true;

    for (const game of games) {
      const status = game.state.description;
      
      // Skip scheduled/postponed games
      if (status === 'Scheduled' || status === 'Postponed') {
        continue;
      }
      
      // Check if game is still in progress
      if (status !== 'Finished') {
        allGamesFinished = false;
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
            
            const imageUrl = await uploadImageToGroupMe('./FunkBlastoise.jpg');
            if (imageUrl) {
              await postToGroupMe('', imageUrl);
            } else {
              await postToGroupMe('🎉 LSU HOME RUN! 🟣🟡');
            }
            
            postedHomeRuns.add(playId);
            savePostedHomeRuns();
          }
        }
      }
    }
    
    // If all games are finished, stop monitoring
    if (allGamesFinished && games.length > 0) {
      console.log('✅ All LSU games finished! Stopping home run monitoring.');
      stopHomeRunMonitoring();
    }
    
  } catch (error) {
    console.error('Error in checkForHomeRuns:', error);
  }
}

// ==================== GAME DAY SCHEDULER ====================

async function checkForGameToday() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n[${new Date().toLocaleString()}] 📅 Daily check: Looking for LSU games on ${today}...`);
  
  const games = await getLSUGames();
  
  if (games.length === 0) {
    console.log('❌ No LSU games today.');
    return;
  }
  
  console.log(`✅ Found ${games.length} LSU game(s) today!`);
  
  // Get first game time
  const firstGame = games[0];
  const gameTime = new Date(firstGame.date);
  const now = new Date();
  
  const opponent = firstGame.homeTeam.id === parseInt(LSU_TEAM_ID)
    ? firstGame.awayTeam.displayName
    : firstGame.homeTeam.displayName;
  
  console.log(`🏟️ LSU vs ${opponent}`);
  console.log(`⏰ First pitch: ${gameTime.toLocaleString()}`);
  
  // Calculate when to start monitoring (1 hour before first pitch)
  const monitorStartTime = new Date(gameTime.getTime() - 60 * 60 * 1000);
  
  if (now < monitorStartTime) {
    // Schedule monitoring to start later
    const msUntilStart = monitorStartTime.getTime() - now.getTime();
    const minutesUntil = Math.round(msUntilStart / 1000 / 60);
    
    console.log(`⏳ Will start monitoring in ${minutesUntil} minutes (1 hour before first pitch)`);
    
    setTimeout(() => {
      console.log('🎯 Game time! Starting home run monitoring...');
      startHomeRunMonitoring();
    }, msUntilStart);
    
  } else if (now < gameTime) {
    // We're within the 1-hour window before the game
    console.log('🎯 Game starting soon! Starting home run monitoring now...');
    startHomeRunMonitoring();
    
  } else {
    // Game should have already started
    console.log('🎯 Game in progress! Starting home run monitoring now...');
    startHomeRunMonitoring();
  }
}

// ==================== STARTUP & CRON JOBS ====================

app.get('/', (req, res) => {
  res.send('🤖 FunkBot Master Server v2.0 - All Systems Online! 🐯⚾🤖');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🐯 FUNKBOT MASTER SERVER STARTING 🐯');
    console.log('='.repeat(60));
    
    // START EXPRESS SERVER FIRST (Railway needs this immediately!)
    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
      console.log(`📡 Webhook endpoint: /webhook\n`);
      
      console.log('Checking environment variables...');
      const required = ['GROUPME_BOT_ID', 'PERPLEXITY_API_KEY', 'RAPIDAPI_KEY'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
      } else {
        console.log('✅ All required environment variables present');
      }
      
      // Load home run tracking data
      loadPostedHomeRuns();
      
      // Check for games daily at 8 AM CST
      cron.schedule('0 8 * * *', checkForGameToday);
      console.log('✅ Game scheduler: Running daily at 8:00 AM CST');
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ALL SYSTEMS ONLINE!');
      console.log('   🤖 FunkBot AI: Ready (Perplexity + 20-msg memory)');
      console.log('   🎲 Sports Betting: Predictions, Parlays, Odds enabled');
      console.log('   ⚾ Home Run Detector: Ready (auto-starts on game days)');
      console.log('   📅 Game Scheduler: Running daily at 8 AM');
      console.log('='.repeat(60) + '\n');
      
      // Run initial game check AFTER server is up (non-blocking)
      setTimeout(() => {
        checkForGameToday().catch(err => {
          console.error('Error in initial game check:', err);
        });
      }, 1000);
    });
  } catch (error) {
    console.error('❌ FATAL ERROR ON STARTUP:', error);
    console.error(error.stack);
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