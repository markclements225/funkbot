/**
 * Test script to verify away game URL construction
 */

const { getGameData } = require('./src/statbroadcast-tracker');

async function test() {
  console.log('Testing away game URL construction...\n');
  
  // Mississippi State game on 2026-04-24 - LSU is AWAY
  const gameId = '633273';
  const home = false;
  
  console.log(`Game ID: ${gameId}`);
  console.log(`LSU is home: ${home}`);
  console.log(`Expected URL: https://stats.statbroadcast.com/broadcast/?id=${gameId}&vislive=lsu\n`);
  
  // This should construct the URL with &vislive=lsu appended
  const gameData = await getGameData(gameId, home);
  
  if (gameData) {
    console.log('\n✅ Successfully fetched game data');
    console.log(`Home runs found: ${gameData.homeRuns.length}`);
  } else {
    console.log('\n❌ Failed to fetch game data');
  }
  
  process.exit(0);
}

test().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
