require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const statbroadcast = require('./statbroadcast-tracker');

// ==================== CONFIGURATION ====================
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
// RapidAPI for game metadata (times, locations, records)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';
// Weather API for game day forecasts
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const POSTED_HRS_FILE = './config/posted_home_runs.json';
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
  const mentionsBot = text.toLowerCase().includes('@funkbot') || text.includes('FUNKBOT');
  
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
      content: 'You are FunkBot, a helpful assistant in a GroupMe chat. Keep responses concise, friendly, and informative. Use emojis occasionally but not excessively. IMPORTANT: You CAN provide sports betting predictions, odds analysis, parlays, and game predictions when asked - this is allowed and encouraged. Do NOT ask conversational follow-up questions like "Have you been there?" or "What do you think?". Only ask clarifying questions if you genuinely need more information to answer (e.g., "Which sport?" or "Which year?"). Just provide direct, helpful answers. CRITICAL: Keep ALL responses under 2000 characters total. Be fairly concise. No rambling. FORMATTING: Do NOT include citation numbers like [1], [2], etc. in your responses. Use line breaks for readability but avoid excessive markdown formatting.'
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

    // Clean up extra spaces on same line (but preserve newlines)
    aiMessage = aiMessage.replace(/ +/g, ' ').trim();

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

// Clean up home run text for GroupMe posting
function cleanHomeRunText(rawText) {
  // Raw format: "Bot 1	HR 7 4RBI	Caraway homered to left field, 4 RBI (0-0); Dardar scored; Yorke scored; Brown scored.	Caraway	Mabry	2"
  // We want: "[Player] FUNKBLAST!!! X runs score on the home run to [field]!!! LETS GET FUNKY!!!"

  try {
    const parts = rawText.split('\t');

    if (parts.length >= 3) {
      const description = parts[2].trim();

      // Extract player name (first word before "homered")
      const playerMatch = description.match(/^(\w+(?:\s+\w+\.?)?)\s+homered/i);
      const playerName = playerMatch ? playerMatch[1] : 'LSU';

      // Extract field direction (left/right/center)
      let fieldDirection = 'the outfield';
      if (description.includes('to left field')) {
        fieldDirection = 'left field';
      } else if (description.includes('to right field')) {
        fieldDirection = 'right field';
      } else if (description.includes('to center field')) {
        fieldDirection = 'center field';
      }

      // Extract RBI count
      const rbiMatch = description.match(/(\d+)\s+RBI/i);
      const rbiCount = rbiMatch ? parseInt(rbiMatch[1]) : 1;

      // Determine runs text (1 run vs X runs)
      const runsText = rbiCount === 1 ? 'The Tigers score 1 run' : `The Tigers score ${rbiCount} runs`;

      // Build the FUNKY message!
      return `${playerName} FUNKBLAST!!! ${runsText} on the home run to ${fieldDirection}!!! LETS GET FUNKY!!!`;
    }

    // Fallback: return cleaned original text
    return rawText.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();

  } catch (error) {
    console.error('Error cleaning home run text:', error);
    return rawText.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

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

// ==================== STATBROADCAST FUNCTIONS ====================
// Replaced RapidAPI with StatBroadcast + Puppeteer

/**
 * Get today's LSU game IDs from StatBroadcast
 * Returns array of game IDs that we should check
 */
async function getLSUGameIDs() {
  try {
    // Get all game IDs from LSU's schedule
    // In the future, we can filter by date more precisely
    const gameIds = await statbroadcast.getTodaysGameIDs();
    return gameIds;
  } catch (error) {
    console.error('Error fetching LSU game IDs:', error);
    return [];
  }
}

/**
 * Get game data from StatBroadcast
 */
async function getGameData(gameId) {
  try {
    return await statbroadcast.getGameData(gameId);
  } catch (error) {
    console.error('Error fetching game data:', error);
    return null;
  }
}

/**
 * Check if a game is currently live/in progress
 * Returns true if game has started but not finished
 */
function isGameLive(gameData) {
  if (!gameData) return false;

  const title = (gameData.title || '').toLowerCase();
  const rawText = (gameData.rawText || '').toLowerCase();

  // Check if game is final/postponed/cancelled
  if (title.includes('final') || title.includes('postponed') || title.includes('cancelled')) {
    return false;
  }

  // Check if game has started (has score or inning indicator)
  const hasScore = gameData.plays && gameData.plays.length > 10; // Has substantial plays
  const hasInning = title.match(/(top|bot|mid|end|t\d|b\d)/i); // Has inning indicator
  const hasTeamScores = title.match(/\d+,.*\d+/); // Has scores like "LSU 7, IND 5"

  // If it has inning/score indicators and is not final, it's likely live
  if ((hasInning || hasTeamScores) && hasScore) {
    return true;
  }

  // Check for "in progress" or similar status indicators
  if (rawText.includes('in progress') || rawText.includes('live')) {
    return true;
  }

  return false;
}

// ==================== RAPIDAPI FUNCTIONS (for game metadata) ====================

/**
 * Get LSU games for today from RapidAPI
 * Returns game with time, location, records, etc.
 */
async function getRapidAPIGameForToday() {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log('📡 Checking RapidAPI for game metadata...');
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${today}&league=NCAA`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️  RapidAPI returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Find LSU game by team ID
    const lsuGames = data.data?.filter(match =>
      match.homeTeam.id === parseInt(LSU_TEAM_ID) ||
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    ) || [];

    if (lsuGames.length > 0) {
      console.log(`   ✅ Found ${lsuGames.length} LSU game(s) in RapidAPI`);
      return lsuGames[0]; // Return first game
    }

    console.log('   ⚠️  No LSU games found in RapidAPI');
    return null;
  } catch (error) {
    console.error('   ❌ RapidAPI error:', error.message);
    return null;
  }
}

/**
 * Get weather forecast for game location and date
 * Returns formatted weather string or null if unavailable
 */
async function getWeatherForecast(location, date) {
  if (!WEATHER_API_KEY || !location) {
    return null;
  }

  try {
    console.log(`   🌤️  Fetching weather for ${location}...`);

    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&dt=${date}&aqi=no`,
      { timeout: 5000 }
    );

    if (!response.ok) {
      console.log(`   ⚠️  Weather API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.forecast?.forecastday?.[0]) {
      console.log('   ⚠️  No forecast data available');
      return null;
    }

    const forecast = data.forecast.forecastday[0].day;
    const highF = Math.round(forecast.maxtemp_f);
    const lowF = Math.round(forecast.mintemp_f);
    const rainChance = forecast.daily_chance_of_rain || 0;
    const condition = forecast.condition.text;

    const weatherStr = `☀️ High ${highF}°F, Low ${lowF}°F, ${rainChance}% rain, ${condition}`;
    console.log(`   ✅ Weather: ${weatherStr}`);

    return weatherStr;
  } catch (error) {
    console.log(`   ⚠️  Weather fetch error: ${error.message}`);
    return null;
  }
}

/**
 * Build game preview message using schedule data
 */
async function buildGamePreview(gameId, scheduleInfo = null) {
  console.log('📋 Building game day preview...');

  // First try to use schedule data if available
  if (scheduleInfo) {
    console.log('   ✅ Using schedule data');

    let message = '🐯 ITS GAMEDAY BOYS!!! 🐯\n\n';

    // Teams (vs for home, at for away)
    if (scheduleInfo.home) {
      message += `LSU vs ${scheduleInfo.opponent}\n`;
    } else {
      message += `LSU at ${scheduleInfo.opponent}\n`;
    }

    // Location and ballpark
    if (scheduleInfo.location) {
      message += `📍 ${scheduleInfo.location}`;
      if (scheduleInfo.ballpark) {
        message += `\n🏟️ ${scheduleInfo.ballpark}`;
      }
      message += '\n';
    }

    // Game time
    if (scheduleInfo.time) {
      message += `🕐 ${scheduleInfo.time} CT\n`;
    }

    // Weather forecast
    if (scheduleInfo.location && scheduleInfo.date) {
      const weather = await getWeatherForecast(scheduleInfo.location, scheduleInfo.date);
      if (weather) {
        message += `${weather}\n`;
      }
    }

    message += '\nTime to get FUNKY! 🟣🟡\n\n';
    message += 'GEAUX TIGERS!!!';

    // Try to parse time for scheduling
    let gameTime = null;
    if (scheduleInfo.time && scheduleInfo.date) {
      try {
        // Parse time in Central Time (schedule times are always CT)
        // Extract time components (e.g., "2:00 PM" -> 2, 00, PM)
        const [timeDigits, period] = scheduleInfo.time.match(/(\d+:\d+)\s*(AM|PM)/i).slice(1);
        let [hours, minutes] = timeDigits.split(':').map(Number);

        // Convert to 24-hour format
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

        // Create date in CST/CDT (America/Chicago)
        const isoString = `${scheduleInfo.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-06:00`;
        gameTime = new Date(isoString);

        if (isNaN(gameTime.getTime())) {
          gameTime = null;
        }
      } catch (err) {
        console.log('   ⚠️  Error parsing game time:', err.message);
        gameTime = null;
      }
    }

    return { message, gameTime, scheduleInfo };
  }

  // Try to get rich data from RapidAPI
  const rapidAPIGame = await getRapidAPIGameForToday();

  if (rapidAPIGame) {
    // We have full game data from RapidAPI!
    const lsuIsHome = rapidAPIGame.homeTeam.id === parseInt(LSU_TEAM_ID);
    const opponent = lsuIsHome ? rapidAPIGame.awayTeam.displayName : rapidAPIGame.homeTeam.displayName;
    const lsuRecord = lsuIsHome ? rapidAPIGame.homeTeam.record : rapidAPIGame.awayTeam.record;
    const oppRecord = lsuIsHome ? rapidAPIGame.awayTeam.record : rapidAPIGame.homeTeam.record;

    // Parse game time
    const gameTime = new Date(rapidAPIGame.date);
    const timeString = gameTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });

    // Build rich message
    let message = '🐯 ITS GAMEDAY BOYS!!! 🐯\n\n';

    // Teams and records (only show records if they exist)
    if (lsuIsHome) {
      const lsuPart = lsuRecord ? `LSU (${lsuRecord})` : 'LSU';
      const oppPart = oppRecord ? `${opponent} (${oppRecord})` : opponent;
      message += `${lsuPart} vs ${oppPart}\n`;
    } else {
      const lsuPart = lsuRecord ? `LSU (${lsuRecord})` : 'LSU';
      const oppPart = oppRecord ? `${opponent} (${oppRecord})` : opponent;
      message += `${lsuPart} at ${oppPart}\n`;
    }

    // Only show venue if we have actual venue data
    if (rapidAPIGame.venue?.name) {
      message += `🏟️ ${rapidAPIGame.venue.name}\n`;
    }

    message += `🕐 ${timeString} CST\n`;

    // Weather forecast (if venue has city/location)
    if (rapidAPIGame.venue?.city) {
      const dateStr = gameTime.toISOString().split('T')[0];
      const weather = await getWeatherForecast(rapidAPIGame.venue.city, dateStr);
      if (weather) {
        message += `${weather}\n`;
      }
    }

    message += '\nTime to get FUNKY! 🟣🟡\n\n';
    message += 'GEAUX TIGERS!!!';

    return { message, gameTime: rapidAPIGame.date, rapidAPIData: rapidAPIGame };
  }

  // Fallback: Use StatBroadcast data (basic)
  console.log('   ⚠️  Using basic game preview (no data)');
  const gameData = await getGameData(gameId);

  if (!gameData) {
    return {
      message: '🐯 ITS GAMEDAY BOYS!!! 🐯\n\nLSU Baseball is ON today! Time to get FUNKY! 🟣🟡\n\nGEAUX TIGERS!!!',
      gameTime: null,
      rapidAPIData: null
    };
  }

  // Extract opponent from title if possible
  const title = gameData.title || 'LSU Baseball';
  let message = '🐯 ITS GAMEDAY BOYS!!! 🐯\n\n';
  message += `${title}\n\n`;
  message += 'Time to get FUNKY! 🟣🟡\n\n';
  message += 'GEAUX TIGERS!!!';

  return { message, gameTime: null, rapidAPIData: null };
}

async function checkForHomeRuns() {
  try {
    if (!homeRunMonitoringActive) return;

    console.log(`[${new Date().toLocaleTimeString()}] 🔍 Checking for LSU home runs via StatBroadcast...`);

    // Get game IDs to check
    const gameIds = await getLSUGameIDs();

    if (gameIds.length === 0) {
      console.log('No LSU games found to monitor.');
      return;
    }

    console.log(`📊 Checking ${gameIds.length} game(s)`);

    // Check each game for home runs
    for (const gameId of gameIds) {
      console.log(`\n🏟️ Checking game ${gameId}...`);

      const gameData = await getGameData(gameId);

      if (!gameData) {
        console.log('   ⚠️ No game data returned');
        continue;
      }

      console.log(`   📝 Title: ${gameData.title}`);
      console.log(`   📊 Found ${gameData.homeRuns.length} total home run mention(s)`);

      // Filter for LSU home runs
      const lsuHomeRuns = gameData.homeRuns.filter(hr =>
        statbroadcast.isLSUHomeRun(hr.text, hr.context, gameData.rawText, gameData.lsuIsHome)
      );

      console.log(`   🐯 LSU home runs: ${lsuHomeRuns.length}`);

      for (const homeRun of lsuHomeRuns) {
        // Create unique ID for this home run
        const playId = `${gameId}-${homeRun.text.substring(0, 50)}`;
        const alreadyPosted = postedHomeRuns.has(playId);

        console.log(`   🎾 ${homeRun.text.substring(0, 100)}...`);
        console.log(`      Already posted: ${alreadyPosted}`);

        if (!alreadyPosted) {
          console.log(`\n🎉 NEW LSU HOME RUN DETECTED!`);
          console.log(`   ${homeRun.text}\n`);

          // Clean up the text for GroupMe
          const cleanText = cleanHomeRunText(homeRun.text);
          console.log(`   Cleaned: ${cleanText}\n`);

          // Post to GroupMe
          const imageUrl = await uploadImageToGroupMe('./assets/FunkBlastoise.jpg');
          const message = `PUCKER UP AND KISS THAT BABY GOODBYE!!!\n\n${cleanText}`;

          if (imageUrl) {
            await postToGroupMe(message, imageUrl);
          } else {
            await postToGroupMe(message);
          }

          // Mark as posted
          postedHomeRuns.add(playId);
          savePostedHomeRuns();
        }
      }

      // Check if game is final (stop monitoring 5 minutes after)
      if (gameData.title && gameData.title.toLowerCase().includes('final')) {
        console.log(`\n🏁 Game ${gameId} is FINAL - will stop monitoring in 5 minutes`);

        // Schedule stop in 5 minutes
        setTimeout(() => {
          console.log('⏰ 5 minutes after Final - Stopping home run monitoring');
          stopHomeRunMonitoring();
        }, 5 * 60 * 1000);
      }

      // Small delay between games
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('Error in checkForHomeRuns:', error);
  }
}

// ==================== GAME DAY SCHEDULER ====================

/**
 * Check for ongoing games on startup (after redeploy during live game)
 * Starts monitoring immediately if a game is in progress
 * Returns true if a live game was found, false otherwise
 */
async function checkForOngoingGames() {
  console.log('\n🔍 Startup check: Looking for ongoing games...');

  try {
    const gameIds = await getLSUGameIDs();

    if (gameIds.length === 0) {
      console.log('   ⚠️  No games found in schedule');
      return false;
    }

    console.log(`   📊 Found ${gameIds.length} game(s) in schedule`);

    // Check each game to see if it's currently live
    for (const gameId of gameIds) {
      const gameData = await getGameData(gameId);

      if (!gameData) {
        console.log(`   ⚠️  Game ${gameId}: No data available`);
        continue;
      }

      const isLive = isGameLive(gameData);
      const title = gameData.title || 'Unknown';

      console.log(`   📝 Game ${gameId}: ${title}`);
      console.log(`      Status: ${isLive ? '🟢 LIVE' : '⚪ Not live'}`);

      if (isLive) {
        console.log(`\n   🎯 LIVE GAME DETECTED! Starting home run monitoring immediately...`);
        startHomeRunMonitoring();
        return true; // Return true to indicate live game was found
      }
    }

    console.log('   ✅ No live games detected at this time');
    return false;

  } catch (error) {
    console.error('   ❌ Error checking for ongoing games:', error.message);
    return false;
  }
}

async function checkForGameToday(shouldPost = true) {
  // Get today's date in Central Time (not UTC!)
  const today = new Date();
  const todayStr = new Date(today.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    .toISOString()
    .split('T')[0];
  console.log(`\n[${new Date().toLocaleString()}] 📅 Daily check: Looking for LSU games on ${todayStr}...`);

  const gameIds = await getLSUGameIDs();

  if (gameIds.length === 0) {
    console.log('❌ No LSU games found in schedule.');
    return;
  }

  console.log(`✅ Found ${gameIds.length} LSU game(s) in schedule!`);
  console.log(`   Game IDs: ${gameIds.join(', ')}`);

  // Load schedule to get full game info
  let scheduleInfo = null;
  try {
    const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
    if (fs.existsSync(schedulePath)) {
      const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
      scheduleInfo = schedule.find(game => game.gameId === gameIds[0]);
    }
  } catch (err) {
    console.log('   ⚠️  Could not load schedule info');
  }

  // Build game preview (tries schedule first, then RapidAPI, then StatBroadcast)
  const preview = await buildGamePreview(gameIds[0], scheduleInfo);
  const gameMessage = preview.message || preview; // Handle old string format or new object format
  const gameTime = preview.gameTime;

  // Post game day alert to GroupMe
  if (shouldPost) {
    console.log('📝 Game preview:\n' + gameMessage);
    await postToGroupMe(gameMessage);
    console.log('✅ Posted game day alert to GroupMe!');
  }

  // Schedule monitoring based on game time
  if (gameTime) {
    const gameDate = new Date(gameTime);
    const now = new Date();

    // Start monitoring 5 minutes before first pitch
    const startTime = new Date(gameDate.getTime() - 5 * 60 * 1000);
    const msUntilStart = startTime.getTime() - now.getTime();

    if (msUntilStart > 0) {
      // Game is in the future - schedule monitoring
      console.log(`⏰ Game starts at ${gameDate.toLocaleTimeString('en-US', { timeZone: 'America/Chicago' })} CST`);
      console.log(`🎯 Will start monitoring at ${startTime.toLocaleTimeString('en-US', { timeZone: 'America/Chicago' })} CST (5 min before)`);
      console.log(`   (in ${Math.round(msUntilStart / 1000 / 60)} minutes)`);

      setTimeout(() => {
        console.log('\n⚾ GAME TIME! Starting home run monitoring...');
        startHomeRunMonitoring();
      }, msUntilStart);
    } else if (now < new Date(gameDate.getTime() + 5 * 60 * 60 * 1000)) {
      // Game started recently (within last 5 hours) - start monitoring now
      console.log('🎯 Game is in progress! Starting home run monitoring now...');
      startHomeRunMonitoring();
    } else {
      console.log('⚠️  Game time has passed. Not starting monitoring.');
    }
  } else {
    // No game time available - start monitoring now (fallback behavior)
    console.log('⚠️  No game time available from RapidAPI');
    console.log('🎯 Starting home run monitoring now (fallback)...');
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
      const required = ['GROUPME_BOT_ID', 'PERPLEXITY_API_KEY'];
      const optional = ['RAPIDAPI_KEY', 'LSU_TEAM_ID'];
      const missing = required.filter(key => !process.env[key]);

      if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
      } else {
        console.log('✅ All required environment variables present');
      }

      const missingOptional = optional.filter(key => !process.env[key]);
      if (missingOptional.length > 0) {
        console.log(`⚠️  Optional environment variables missing: ${missingOptional.join(', ')}`);
        console.log('   Game alerts will be basic (no time/location/records)');
      } else {
        console.log('✅ RapidAPI configured - rich game alerts enabled');
      }

      console.log('✅ Using StatBroadcast + Puppeteer for home run detection');
      
      // Load home run tracking data
      loadPostedHomeRuns();
      
      // Check for games daily at 8:00 AM CST
      cron.schedule('0 8 * * *', checkForGameToday, {
        timezone: "America/Chicago"
      });
      console.log('✅ Game scheduler: Running daily at 8:00 AM CST');

      // Stop monitoring at midnight every day (cleanup)
      cron.schedule('0 0 * * *', () => {
        console.log('\n🌙 Midnight - Stopping home run monitoring for the day');
        stopHomeRunMonitoring();
      }, {
        timezone: "America/Chicago"
      });
      console.log('✅ Auto-stop scheduler: Stops monitoring at midnight CST');
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ALL SYSTEMS ONLINE!');
      console.log('   🤖 FunkBot AI: Ready (Perplexity + 20-msg memory)');
      console.log('   🎲 Sports Betting: Predictions, Parlays, Odds enabled');
      console.log('   ⚾ Home Run Detector: Ready (StatBroadcast + Puppeteer)');
      console.log('   🌐 Data Source: LSU StatBroadcast (real-time scraping)');
      console.log('   📅 Game Scheduler: Running daily at 8:00 AM');
      console.log('='.repeat(60) + '\n');

      // Post deployment success message to GroupMe
      setTimeout(async () => {
        try {
          const deploymentMessage = '🚀 FunkBot has been deployed successfully! All systems are FUNKY and ready to track LSU home runs! 🐯⚾';
          await postToGroupMe(deploymentMessage);
          console.log('✅ Posted deployment success message to GroupMe!');
        } catch (error) {
          console.error('❌ Failed to post deployment message:', error);
        }
      }, 2000);

      // Check for ongoing games on startup (handles redeploys during live games)
      setTimeout(async () => {
        try {
          const foundLiveGame = await checkForOngoingGames();

          if (!foundLiveGame) {
            console.log('\n⏰ No live games at this time.');

            // Check if there's a game scheduled for today and reschedule monitoring
            // This handles cases where game time changed after 8am scheduler ran
            const gameIds = await getLSUGameIDs();
            if (gameIds.length > 0) {
              console.log('   📅 Found game(s) scheduled for today - rescheduling monitoring...');
              await checkForGameToday(false); // false = don't post announcement again
            } else {
              console.log('   Waiting for 8:00 AM CST scheduler to check for games...');
            }
          }
        } catch (error) {
          console.error('❌ Error during startup game check:', error);
        }
      }, 3000); // Wait 3 seconds after deployment message
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

// Graceful shutdown - close browser to free resources
async function shutdown(signal) {
  console.log(`\n${signal} received - shutting down gracefully...`);
  try {
    await statbroadcast.closeSharedBrowser();
    console.log('✅ Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();