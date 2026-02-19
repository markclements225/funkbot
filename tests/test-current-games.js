require('dotenv').config();
const statbroadcast = require('../src/statbroadcast-tracker');

/**
 * Check which games are actually live/recent
 */
async function checkCurrentGames() {
  console.log('🔍 Checking for current LSU games...\n');

  // Get today's game IDs
  const gameIds = await statbroadcast.getTodaysGameIDs();

  if (gameIds.length === 0) {
    console.log('❌ No games found');
    return;
  }

  console.log(`\n📊 Checking ${gameIds.length} game(s) for live data...\n`);

  for (const gameId of gameIds) {
    try {
      console.log(`${'='.repeat(80)}`);
      console.log(`Game ID: ${gameId}`);
      console.log(`URL: https://stats.statbroadcast.com/broadcast/?id=${gameId}`);
      console.log('─'.repeat(80));

      const gameData = await statbroadcast.getGameData(gameId);

      if (!gameData) {
        console.log('❌ No data available\n');
        continue;
      }

      console.log(`✅ Data found!`);
      console.log(`   Title: ${gameData.title}`);
      console.log(`   Home runs detected: ${gameData.homeRuns.length}`);
      console.log(`   Total plays: ${gameData.plays.length}`);

      if (gameData.homeRuns.length > 0) {
        console.log(`\n   🔥 HOME RUNS:`);
        gameData.homeRuns.forEach((hr, idx) => {
          console.log(`   ${idx + 1}. ${hr.text.substring(0, 100)}`);
          console.log(`      LSU? ${statbroadcast.isLSUHomeRun(hr.text, hr.context, gameData.rawText) ? '✅ YES' : '❌ NO'}`);
        });
      }

      // Check if page content looks current (2026)
      const has2026 = gameData.rawText.includes('2026');
      const has2025 = gameData.rawText.includes('2025');

      console.log(`\n   📅 Season markers:`);
      if (has2026) console.log(`      ✅ Contains "2026"`);
      if (has2025) console.log(`      ⚠️  Contains "2025" (might be old)`);
      if (!has2026 && !has2025) console.log(`      ⚠️  No year markers found`);

      console.log();

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('='.repeat(80));
  console.log('✅ Check complete!\n');
  console.log('💡 TIP: If games show 2025 data, they are old games.');
  console.log('   Wait for an actual 2026 LSU game to test live tracking.\n');
}

checkCurrentGames();
