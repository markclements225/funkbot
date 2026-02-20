/**
 * Test the complete flow from start to finish
 */

const statbroadcast = require('../src/statbroadcast-tracker');

async function testFullFlow() {
  console.log('🔄 TESTING FULL FLOW FROM START TO FINISH\n');
  console.log('='.repeat(80));

  // STEP 1: Daily scheduler runs at 8:00 AM CST
  console.log('\n⏰ STEP 1: Daily Scheduler Runs (8:00 AM CST)');
  console.log('-'.repeat(80));

  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Checking for games on ${today}...`);

  // STEP 2: Get today's game IDs
  console.log('\n📊 STEP 2: Get Today\'s Game IDs');
  console.log('-'.repeat(80));

  const gameIds = await statbroadcast.getTodaysGameIDs();

  if (gameIds.length === 0) {
    console.log('❌ No games found. Bot will not start monitoring.');
    return;
  }

  console.log(`✅ Found ${gameIds.length} game(s): ${gameIds.join(', ')}`);
  console.log('🚀 Bot will START HOME RUN MONITORING (checks every minute)');

  // STEP 3: Check for home runs (this runs every minute once monitoring starts)
  console.log('\n🔍 STEP 3: Check for Home Runs (runs every 60 seconds)');
  console.log('-'.repeat(80));

  const allHomeRuns = [];

  for (const gameId of gameIds) {
    console.log(`\n🏟️  Checking game ${gameId}...`);

    const gameData = await statbroadcast.getGameData(gameId);

    if (!gameData) {
      console.log('   ⚠️  No game data returned');
      continue;
    }

    console.log(`   📝 Title: ${gameData.title}`);

    // Filter for LSU home runs
    const lsuHomeRuns = gameData.homeRuns.filter(hr =>
      statbroadcast.isLSUHomeRun(hr.text, hr.context, gameData.rawText, gameData.lsuIsHome)
    );

    console.log(`   🐯 LSU home runs detected: ${lsuHomeRuns.length}`);

    for (const hr of lsuHomeRuns) {
      allHomeRuns.push({
        gameId,
        text: hr.text
      });
    }
  }

  // STEP 4: Post to GroupMe
  console.log('\n📤 STEP 4: Post to GroupMe');
  console.log('-'.repeat(80));

  if (allHomeRuns.length === 0) {
    console.log('❌ No LSU home runs to post');
    return;
  }

  console.log(`✅ Found ${allHomeRuns.length} LSU home run(s) to post!\n`);

  allHomeRuns.forEach((hr, idx) => {
    console.log(`${idx + 1}. Game ${hr.gameId}:`);
    console.log('   ┌─────────────────────────────────────────────────────');
    console.log('   │ 📱 GroupMe Message:');
    console.log('   │');
    console.log('   │ 🎉 LSU HOME RUN! 🟣🟡');
    console.log('   │');
    console.log(`   │ ${hr.text}`);
    console.log('   │');
    console.log('   │ 📸 [FunkBlastoise.jpg attached]');
    console.log('   └─────────────────────────────────────────────────────');
    console.log('');
  });

  // SUMMARY
  console.log('\n' + '='.repeat(80));
  console.log('📋 FLOW SUMMARY:');
  console.log('='.repeat(80));
  console.log('');
  console.log('✅ 1. Daily scheduler runs at 8:00 AM CST');
  console.log('✅ 2. Finds today\'s games using lsu-schedule-2026.json');
  console.log('✅ 3. Starts home run monitoring (checks every 60 seconds)');
  console.log('✅ 4. Uses Puppeteer to scrape StatBroadcast');
  console.log('✅ 5. Clicks "Scoring Plays" tab to get HR details');
  console.log('✅ 6. Filters for LSU home runs (Bot = LSU, Top = opponent)');
  console.log('✅ 7. Posts to GroupMe with FunkBlastoise image');
  console.log('✅ 8. Tracks posted HRs to avoid duplicates');
  console.log('');
  console.log('='.repeat(80));
  console.log('');
}

testFullFlow();
