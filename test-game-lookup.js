/**
 * Test script to look up a specific game and see what data is found
 */

const statbroadcast = require('./src/statbroadcast-tracker');

async function testGameLookup(gameId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing game lookup for: ${gameId}`);
  console.log('='.repeat(60) + '\n');

  const gameData = await statbroadcast.getGameData(gameId);

  if (!gameData) {
    console.log('❌ No game data returned');
    return;
  }

  console.log('\n📊 GAME DATA SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Title: ${gameData.title}`);
  console.log(`Teams: ${gameData.teams.away} @ ${gameData.teams.home}`);
  console.log(`Score: ${gameData.score || 'N/A'}`);
  console.log(`Inning: ${gameData.inning || 'N/A'}`);
  console.log(`Status: ${gameData.status || 'N/A'}`);
  console.log(`LSU is: ${gameData.lsuIsHome === true ? 'HOME' : gameData.lsuIsHome === false ? 'AWAY' : 'UNKNOWN'}`);
  console.log(`Total plays found: ${gameData.plays.length}`);
  console.log(`Home run mentions found: ${gameData.homeRuns.length}`);

  if (gameData.homeRuns.length > 0) {
    console.log('\n🎾 HOME RUN MENTIONS:');
    console.log('='.repeat(60));
    gameData.homeRuns.forEach((hr, idx) => {
      console.log(`\n[${idx + 1}] ${hr.text}`);
      console.log(`    Line number: ${hr.lineNumber}`);
      console.log(`    Before: ${hr.context.before}`);
      console.log(`    After: ${hr.context.after}`);

      // Check if this is an LSU home run
      const isLSU = statbroadcast.isLSUHomeRun(hr.text, hr.context, gameData.rawText, gameData.lsuIsHome);
      console.log(`    Is LSU HR: ${isLSU ? '✅ YES' : '❌ NO'}`);
    });
  }

  console.log('\n📝 SAMPLE PLAYS (first 20):');
  console.log('='.repeat(60));
  gameData.plays.slice(0, 20).forEach((play, idx) => {
    console.log(`${idx + 1}. ${play}`);
  });

  console.log('\n📄 RAW TEXT PREVIEW (first 1000 chars):');
  console.log('='.repeat(60));
  console.log(gameData.rawText.substring(0, 1000));
  console.log('\n...(truncated)...\n');

  console.log('\n✅ Test complete!');
}

// Run the test
const gameId = process.argv[2] || '651253';
testGameLookup(gameId).then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
