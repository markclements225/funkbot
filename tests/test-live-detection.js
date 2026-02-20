/**
 * Test the isGameLive detection logic
 */

const statbroadcast = require('./src/statbroadcast-tracker');

// Copy the isGameLive function from server.js for testing
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

async function testLiveDetection(gameId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing live game detection for: ${gameId}`);
  console.log('='.repeat(60) + '\n');

  const gameData = await statbroadcast.getGameData(gameId);

  if (!gameData) {
    console.log('❌ No game data returned');
    return;
  }

  console.log('📊 GAME INFO:');
  console.log(`   Title: ${gameData.title}`);
  console.log(`   Plays found: ${gameData.plays.length}`);
  console.log(`   Home runs found: ${gameData.homeRuns.length}`);

  // Run the detection logic
  const title = (gameData.title || '').toLowerCase();
  const hasScore = gameData.plays && gameData.plays.length > 10;
  const hasInning = title.match(/(top|bot|mid|end|t\d|b\d)/i);
  const hasTeamScores = title.match(/\d+,.*\d+/);
  const isFinal = title.includes('final');

  console.log('\n🔍 DETECTION CRITERIA:');
  console.log(`   Has "Final" in title: ${isFinal ? '✅ YES' : '❌ NO'}`);
  console.log(`   Has substantial plays (>10): ${hasScore ? '✅ YES' : '❌ NO'}`);
  console.log(`   Has inning indicator: ${hasInning ? '✅ YES' : '❌ NO'}`);
  console.log(`   Has team scores: ${hasTeamScores ? '✅ YES' : '❌ NO'}`);

  const isLive = isGameLive(gameData);

  console.log('\n🎯 RESULT:');
  console.log(`   Game is LIVE: ${isLive ? '🟢 YES' : '⚪ NO'}`);

  if (isLive) {
    console.log('\n   ✅ This game would trigger immediate monitoring on startup!');
  } else {
    console.log('\n   ⚪ This game would NOT trigger monitoring on startup.');
  }

  console.log('\n' + '='.repeat(60));
}

// Test on the current LSU game
const gameId = process.argv[2] || '651253';
testLiveDetection(gameId).then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
