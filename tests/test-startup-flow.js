/**
 * Test the startup flow to verify ongoing game detection
 */

require('dotenv').config();
const statbroadcast = require('./src/statbroadcast-tracker');

// Copy functions from server.js for testing
function isGameLive(gameData) {
  if (!gameData) return false;

  const title = (gameData.title || '').toLowerCase();
  const rawText = (gameData.rawText || '').toLowerCase();

  if (title.includes('final') || title.includes('postponed') || title.includes('cancelled')) {
    return false;
  }

  const hasScore = gameData.plays && gameData.plays.length > 10;
  const hasInning = title.match(/(top|bot|mid|end|t\d|b\d)/i);
  const hasTeamScores = title.match(/\d+,.*\d+/);

  if ((hasInning || hasTeamScores) && hasScore) {
    return true;
  }

  if (rawText.includes('in progress') || rawText.includes('live')) {
    return true;
  }

  return false;
}

async function simulateStartup() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SIMULATING SERVER STARTUP');
  console.log('='.repeat(60) + '\n');

  console.log('🔍 Startup check: Looking for ongoing games...');

  try {
    const gameIds = await statbroadcast.getTodaysGameIDs();

    if (gameIds.length === 0) {
      console.log('   ⚠️  No games found in schedule');
      console.log('\n⏰ No live games at this time.');
      console.log('   Waiting for 8:00 AM CST scheduler to check for games...');
      return;
    }

    console.log(`   📊 Found ${gameIds.length} game(s) in schedule\n`);

    let foundLiveGame = false;

    for (const gameId of gameIds) {
      const gameData = await statbroadcast.getGameData(gameId);

      if (!gameData) {
        console.log(`   ⚠️  Game ${gameId}: No data available`);
        continue;
      }

      const isLive = isGameLive(gameData);
      const title = gameData.title || 'Unknown';

      console.log(`   📝 Game ${gameId}: ${title}`);
      console.log(`      Status: ${isLive ? '🟢 LIVE' : '⚪ Not live'}`);

      if (isLive) {
        console.log(`\n   🎯 LIVE GAME DETECTED!`);
        console.log(`   ✅ Would start home run monitoring immediately...`);
        foundLiveGame = true;
        break; // Only monitor first live game
      }
    }

    if (!foundLiveGame) {
      console.log('\n   ✅ No live games detected at this time');
      console.log('\n⏰ No live games at this time.');
      console.log('   Waiting for 8:00 AM CST scheduler to check for games...');
    }

  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Startup simulation complete!');
  console.log('='.repeat(60) + '\n');
}

simulateStartup().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
