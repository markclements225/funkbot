require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');

// Configuration
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '99'; // We'll find the real ID

// File to persist posted home runs
const POSTED_HRS_FILE = './posted_home_runs.json';

// Store home runs we've already posted about
let postedHomeRuns = new Set();

// Load previously posted home runs from file
function loadPostedHomeRuns() {
  try {
    if (fs.existsSync(POSTED_HRS_FILE)) {
      const data = fs.readFileSync(POSTED_HRS_FILE, 'utf8');
      const array = JSON.parse(data);
      postedHomeRuns = new Set(array);
      console.log(`📂 Loaded ${postedHomeRuns.size} previously posted home runs from file`);
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

// Function to get today's LSU games
async function getLSUGames() {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
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
    
    // Filter for LSU games (either home or away)
    const lsuGames = data.data.filter(match => 
      match.homeTeam.id === parseInt(LSU_TEAM_ID) || 
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    );

    return lsuGames;
  } catch (error) {
    console.error('Error fetching LSU games:', error);
    return [];
  }
}

// Function to get detailed match info including plays
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
    return data[0]; // API returns array with single match
  } catch (error) {
    console.error('Error fetching match details:', error);
    return null;
  }
}

// Function to check for new LSU home runs
async function checkForHomeRuns() {
  console.log(`[${new Date().toLocaleTimeString()}] Checking for LSU home runs...`);
  
  const games = await getLSUGames();
  
  if (games.length === 0) {
    console.log('No LSU games today or games not started yet.');
    return;
  }

  for (const game of games) {
    // Only check games that are in progress or finished today
    if (game.state.description === 'Scheduled' || game.state.description === 'Postponed') {
      continue;
    }

    console.log(`Checking game: ${game.awayTeam.displayName} @ ${game.homeTeam.displayName}`);
    
    const matchDetails = await getMatchDetails(game.id);
    
    if (!matchDetails || !matchDetails.plays) {
      continue;
    }

    // Check plays for LSU home runs
    const isLSUHome = game.homeTeam.id === parseInt(LSU_TEAM_ID);
    const lsuTeamId = isLSUHome ? game.homeTeam.id : game.awayTeam.id;

    for (const play of matchDetails.plays) {
      // Look for home run plays by LSU
      if (play.type && play.type.toLowerCase().includes('home run') && 
          play.teamId === lsuTeamId) {
        
        const playId = `${game.id}-${play.description}-${play.period}`;
        
        // Check if we've already posted about this home run
        if (!postedHomeRuns.has(playId)) {
          console.log(`🎉 NEW LSU HOME RUN DETECTED: ${play.description}`);
          await postToGroupMe();
          postedHomeRuns.add(playId);
          savePostedHomeRuns(); // Persist to file
        }
      }
    }
  }
}

// Function to post image to GroupMe
async function postToGroupMe() {
  try {
    // First, upload the image to GroupMe's image service
    const imageUrl = await uploadImageToGroupMe();
    
    if (!imageUrl) {
      console.error('Failed to upload image');
      return;
    }

    // Post with image attachment to GroupMe (NO TEXT, just image)
    const response = await fetch('https://api.groupme.com/v3/bots/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: GROUPME_BOT_ID,
        text: '', // No text - just the image!
        attachments: [
          {
            type: 'image',
            url: imageUrl
          }
        ]
      })
    });

    if (response.status === 202) {
      console.log('✅ Successfully posted to GroupMe!');
    } else {
      console.error('Failed to post to GroupMe:', response.status);
    }
  } catch (error) {
    console.error('Error posting to GroupMe:', error);
  }
}

// Function to upload image to GroupMe's image service
async function uploadImageToGroupMe() {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync('./FunkBlastoise.jpg');
    
    // Upload to GroupMe image service with access token
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

// Function to find LSU's team ID
async function findLSUTeamId() {
  try {
    const response = await fetch(
      'https://mlb-college-baseball-api.p.rapidapi.com/teams?league=NCAA&displayName=LSU',
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      console.log('Found LSU team:', data.data[0]);
      console.log(`LSU Team ID: ${data.data[0].id}`);
      return data.data[0].id;
    }
  } catch (error) {
    console.error('Error finding LSU team ID:', error);
  }
}

// Main execution
async function main() {
  console.log('🐯 LSU Home Run Bot Starting...\n');
  
  // Load previously posted home runs
  loadPostedHomeRuns();
  
  // First, let's find LSU's actual team ID
  console.log('Finding LSU team ID...');
  const lsuId = await findLSUTeamId();
  
  if (lsuId) {
    console.log(`\n✅ Update your .env file with: LSU_TEAM_ID=${lsuId}\n`);
  }

  // Run check immediately on startup
  await checkForHomeRuns();

  // Schedule to run every minute
  cron.schedule('* * * * *', async () => {
    await checkForHomeRuns();
  });

  console.log('\n✅ Bot is running! Checking for LSU home runs every minute...');
  console.log('Press Ctrl+C to stop.\n');
}

// Start the bot
main();