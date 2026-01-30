require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

// Function to get LSU games on a specific date
async function getLSUGamesOnDate(dateString) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Searching for LSU games on ${dateString}`);
    console.log('='.repeat(60) + '\n');
    
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
    
    // Filter for LSU games
    const lsuGames = data.data?.filter(match => 
      match.homeTeam.id === parseInt(LSU_TEAM_ID) || 
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    ) || [];

    console.log(`📊 API Response Summary:`);
    console.log(`   Total NCAA games: ${data.data?.length || 0}`);
    console.log(`   LSU games found: ${lsuGames.length}\n`);

    if (lsuGames.length > 0) {
      console.log('🎯 LSU GAMES FOUND!\n');
      
      for (let i = 0; i < lsuGames.length; i++) {
        const game = lsuGames[i];
        console.log(`${'─'.repeat(60)}`);
        console.log(`GAME ${i + 1} - BASIC DATA:`);
        console.log(`${'─'.repeat(60)}\n`);
        console.log(JSON.stringify(game, null, 2));
        console.log('\n');
      }
      
      return lsuGames;
    } else {
      console.log('❌ No LSU games found on this date.');
      console.log('\n💡 Sample of other games available:');
      if (data.data && data.data.length > 0) {
        console.log(JSON.stringify(data.data.slice(0, 2), null, 2));
      }
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    return [];
  }
}

// Function to get detailed match info
async function getDetailedMatchInfo(matchId) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Fetching DETAILED data for match ID: ${matchId}`);
    console.log('='.repeat(60) + '\n');
    
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
    
    console.log('📋 DETAILED MATCH DATA:');
    console.log('='.repeat(60) + '\n');
    console.log(JSON.stringify(data, null, 2));
    
    return data[0]; // API returns array with single match
  } catch (error) {
    console.error('❌ Error fetching match details:', error);
    return null;
  }
}

// Function to get team statistics
async function getTeamStats(teamId, fromDate) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Fetching team statistics for team ID: ${teamId}`);
    console.log('='.repeat(60) + '\n');
    
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/teams/statistics/${teamId}?fromDate=${fromDate}`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    
    console.log('📊 TEAM STATISTICS:');
    console.log('='.repeat(60) + '\n');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching team stats:', error);
    return null;
  }
}

// Main exploration function
async function exploreData() {
  console.log('\n🐯 LSU GAME DATA EXPLORER');
  console.log('='.repeat(60));
  
  // Try Feb 13, 2026
  const games = await getLSUGamesOnDate('2026-02-13');
  
  if (games.length > 0) {
    const firstGame = games[0];
    
    console.log('\n\n');
    console.log('🎯 Now fetching DETAILED info for first game...\n');
    
    // Get detailed match info
    const detailedMatch = await getDetailedMatchInfo(firstGame.id);
    
    // Get LSU team stats
    console.log('\n\n');
    console.log('📊 Now fetching LSU team statistics...\n');
    await getTeamStats(LSU_TEAM_ID, '2025-02-01');
    
    // Get opponent stats
    const opponentId = firstGame.homeTeam.id === parseInt(LSU_TEAM_ID) 
      ? firstGame.awayTeam.id 
      : firstGame.homeTeam.id;
    
    console.log('\n\n');
    console.log('📊 Now fetching opponent team statistics...\n');
    await getTeamStats(opponentId, '2025-02-01');
    
    console.log('\n\n');
    console.log('='.repeat(60));
    console.log('✅ EXPLORATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 SUMMARY OF AVAILABLE DATA:\n');
    console.log('From basic match endpoint:');
    console.log('  ✅ Teams (home/away)');
    console.log('  ✅ Team logos');
    console.log('  ✅ Game date/time');
    console.log('  ✅ Game status');
    console.log('  ✅ Score (if game started)');
    console.log('  ✅ League/season info');
    console.log('\nFrom detailed match endpoint:');
    console.log('  ✅ Venue (stadium name, city, state)');
    console.log('  ✅ Weather forecast');
    console.log('  ✅ Referees/umpires');
    console.log('  ✅ Play-by-play data');
    console.log('  ✅ Rosters');
    console.log('\nFrom team statistics endpoint:');
    console.log('  ✅ Win/loss record');
    console.log('  ✅ Points scored/received');
    console.log('  ✅ Home/away splits');
    console.log('\n');
    
  } else {
    console.log('\n\n💡 TIP: Try different dates to find LSU games!');
    console.log('   Baseball season typically runs Feb-June');
    console.log('\n   Example dates to try:');
    console.log('   - 2026-02-14 (Opening weekend)');
    console.log('   - 2026-02-21');
    console.log('   - 2026-03-01\n');
  }
}

exploreData();