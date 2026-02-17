require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

// Get LSU games for today
async function getLSUGames() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🗓️  Checking for games on: ${today}\n`);

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
    console.log('📦 RAW API RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    const lsuGames = data.data?.filter(match =>
      match.homeTeam.id === parseInt(LSU_TEAM_ID) ||
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    ) || [];

    return lsuGames;
  } catch (error) {
    console.error('❌ Error fetching LSU games:', error);
    return [];
  }
}

// Get detailed match info
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
    console.error('❌ Error fetching match details:', error);
    return null;
  }
}

// Main test function
async function testHomeRunCheck() {
  console.log('🐯 LSU HOME RUN CHECKER TEST 🐯\n');
  console.log('='.repeat(80));

  const games = await getLSUGames();

  if (games.length === 0) {
    console.log('❌ No LSU games found for today.');
    console.log('\nPossible reasons:');
    console.log('  1. No games scheduled today');
    console.log('  2. API is using different date/timezone');
    console.log('  3. Game finished and removed from API');
    return;
  }

  console.log(`✅ Found ${games.length} LSU game(s)!\n`);

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    console.log('='.repeat(80));
    console.log(`GAME ${i + 1}:`);
    console.log('='.repeat(80));
    console.log(`Game ID: ${game.id}`);
    console.log(`Status: ${game.state.description}`);
    console.log(`Away: ${game.awayTeam.displayName} ${game.awayTeam.name} (ID: ${game.awayTeam.id})`);
    console.log(`Home: ${game.homeTeam.displayName} ${game.homeTeam.name} (ID: ${game.homeTeam.id})`);
    console.log(`Date: ${new Date(game.date).toLocaleString()}`);

    const isLSUHome = game.homeTeam.id === parseInt(LSU_TEAM_ID);
    console.log(`\nLSU is: ${isLSUHome ? 'HOME' : 'AWAY'}`);
    console.log(`LSU Team ID: ${isLSUHome ? game.homeTeam.id : game.awayTeam.id}`);

    console.log('\n📋 Fetching match details...\n');
    const details = await getMatchDetails(game.id);

    if (!details) {
      console.log('❌ No match details returned\n');
      continue;
    }

    console.log('📦 MATCH DETAILS (FULL RESPONSE):');
    console.log(JSON.stringify(details, null, 2));
    console.log('\n');

    if (!details.plays) {
      console.log('⚠️  No plays data available\n');
      continue;
    }

    console.log(`✅ Found ${details.plays.length} plays\n`);

    // Look for home runs
    const lsuTeamId = isLSUHome ? game.homeTeam.id : game.awayTeam.id;
    const homeRuns = details.plays.filter(play =>
      play.type && play.type.toLowerCase().includes('home run')
    );

    if (homeRuns.length > 0) {
      console.log(`⚾ Found ${homeRuns.length} total home run(s):\n`);
      homeRuns.forEach((play, idx) => {
        const isLSU = play.teamId === lsuTeamId;
        console.log(`  ${idx + 1}. ${play.description}`);
        console.log(`     Type: ${play.type}`);
        console.log(`     Team ID: ${play.teamId} ${isLSU ? '🐯 (LSU)' : '(Opponent)'}`);
        console.log(`     Period: ${play.period}`);
        console.log('');
      });
    } else {
      console.log('⚾ No home runs found in plays data\n');
    }

    // Show sample of other plays
    console.log('📝 Sample of other plays (first 5):');
    details.plays.slice(0, 5).forEach((play, idx) => {
      console.log(`  ${idx + 1}. [${play.type || 'No type'}] ${play.description}`);
    });
    console.log('\n');
  }

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run the test
testHomeRunCheck();
