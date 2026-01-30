require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

// Get LSU games for a specific date
async function getLSUGames(dateString) {
  try {
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${dateString}&league=NCAA`,
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
    console.error('Error fetching games:', error);
    return [];
  }
}

// Get detailed match info including venue
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

// Get team statistics
async function getTeamStats(teamId) {
  try {
    // Use a date from last season to get stats
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/teams/statistics/${teamId}?fromDate=2025-02-01`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    // Get regular season stats (first entry is usually regular season)
    const regularSeasonStats = data.find(stat => stat.round === 'regular-season');
    return regularSeasonStats || data[0];
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return null;
  }
}

// Convert UTC time to CST and format nicely
function formatGameTime(utcDateString) {
  const date = new Date(utcDateString);
  
  // Convert to CST (UTC-6)
  const cstDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[cstDate.getDay()];
  const month = months[cstDate.getMonth()];
  const day = cstDate.getDate();
  
  let hours = cstDate.getHours();
  const minutes = cstDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${dayName}, ${month} ${day} @ ${hours}:${minutesStr} ${ampm} CST`;
}

// Build the game preview message
async function buildGamePreview(game) {
  console.log('\n📋 Building game preview...\n');
  
  // Get detailed match info for venue
  const details = await getMatchDetails(game.id);
  
  // Determine if LSU is home or away
  const isLSUHome = game.homeTeam.id === parseInt(LSU_TEAM_ID);
  const opponent = isLSUHome ? game.awayTeam : game.homeTeam;
  const lsuTeam = isLSUHome ? game.homeTeam : game.awayTeam;
  
  // Get team stats
  console.log('Fetching LSU stats...');
  const lsuStats = await getTeamStats(LSU_TEAM_ID);
  
  console.log('Fetching opponent stats...');
  const oppStats = await getTeamStats(opponent.id);
  
  // Format the game time
  const gameTime = formatGameTime(game.date);
  
  // Build the message
  let message = '🐯 LSU BASEBALL GAMEDAY 🐯\n\n';
  
  // Teams
  message += `${lsuTeam.displayName} ${lsuTeam.name} vs ${opponent.displayName} ${opponent.name}\n`;
  
  // Date/Time
  message += `📅 ${gameTime}\n`;
  
  // Venue
  if (details && details.venue) {
    message += `🏟️ ${details.venue.name} - ${details.venue.city}, ${details.venue.state}\n`;
  }
  
  // Records
  message += '\n📊 2025 Season Records:\n';
  
  if (lsuStats) {
    const lsuRecord = `${lsuStats.total.games.wins}-${lsuStats.total.games.loses}`;
    const lsuHomeRecord = isLSUHome ? ` (${lsuStats.home.games.wins}-${lsuStats.home.games.loses} Home)` : ` (${lsuStats.away.games.wins}-${lsuStats.away.games.loses} Away)`;
    message += `LSU: ${lsuRecord}${lsuHomeRecord}\n`;
  }
  
  if (oppStats) {
    const oppRecord = `${oppStats.total.games.wins}-${oppStats.total.games.loses}`;
    const oppAwayRecord = !isLSUHome ? ` (${oppStats.home.games.wins}-${oppStats.home.games.loses} Home)` : ` (${oppStats.away.games.wins}-${oppStats.away.games.loses} Away)`;
    message += `${opponent.displayName}: ${oppRecord}${oppAwayRecord}\n`;
  }
  
  message += '\nGEAUX TIGERS! 🟣🟡';
  
  return message;
}

// Post message to GroupMe
async function postToGroupMe(message) {
  try {
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
      console.log('✅ Successfully posted game preview to GroupMe!');
      return true;
    } else {
      console.error('Failed to post to GroupMe:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error posting to GroupMe:', error);
    return false;
  }
}

// Main function - test with Feb 13, 2026
async function testGamePreview() {
  console.log('🐯 LSU Game Preview Generator\n');
  console.log('Testing with Feb 13, 2026...\n');
  
  const games = await getLSUGames('2026-02-13');
  
  if (games.length === 0) {
    console.log('❌ No LSU games found on this date.');
    return;
  }
  
  console.log(`✅ Found ${games.length} LSU game(s)!\n`);
  
  for (const game of games) {
    const preview = await buildGamePreview(game);
    
    console.log('\n' + '='.repeat(50));
    console.log('GENERATED PREVIEW:');
    console.log('='.repeat(50));
    console.log(preview);
    console.log('='.repeat(50) + '\n');
    
    // Ask if we should post
    console.log('📤 Posting to GroupMe...\n');
    await postToGroupMe(preview);
  }
}

testGamePreview();