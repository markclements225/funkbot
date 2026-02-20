require('dotenv').config();
const statbroadcast = require('../src/statbroadcast-tracker');

async function testLiveScrape() {
  console.log('🔍 LIVE GAME DATA EXTRACTION TEST\n');
  console.log('='.repeat(80));

  // Get today's games
  const gameIds = await statbroadcast.getTodaysGameIDs();

  if (gameIds.length === 0) {
    console.log('❌ No games found');
    return;
  }

  // Test the first game
  const gameId = gameIds[0];
  console.log(`\n📊 Testing Game ID: ${gameId}`);
  console.log(`🔗 URL: https://stats.statbroadcast.com/broadcast/?id=${gameId}`);
  console.log('\n' + '='.repeat(80));

  const gameData = await statbroadcast.getGameData(gameId);

  if (!gameData) {
    console.log('❌ No data returned');
    return;
  }

  // Display everything we extracted
  console.log('\n📋 EXTRACTED DATA:\n');
  console.log('─'.repeat(80));

  console.log('\n🏷️  TITLE:');
  console.log(`   ${gameData.title}`);

  console.log('\n👥 TEAMS:');
  console.log(`   Home: ${gameData.teams.home || 'Unknown'}`);
  console.log(`   Away: ${gameData.teams.away || 'Unknown'}`);

  console.log('\n📊 SCORE:');
  console.log(`   ${gameData.score || 'Not found'}`);

  console.log('\n⚾ INNING:');
  console.log(`   ${gameData.inning || 'Not found'}`);

  console.log('\n🎯 GAME STATUS:');
  console.log(`   ${gameData.status || 'Unknown'}`);

  console.log('\n🔥 HOME RUNS DETECTED:');
  if (gameData.homeRuns.length === 0) {
    console.log('   None found (or game finished)');
  } else {
    gameData.homeRuns.forEach((hr, idx) => {
      console.log(`\n   ${idx + 1}. ${hr.text}`);
      console.log(`      Is LSU? ${statbroadcast.isLSUHomeRun(hr.text, hr.context, gameData.rawText, gameData.lsuIsHome) ? '✅ YES' : '❌ NO'}`);
      if (hr.context.before) {
        console.log(`      Context before: ${hr.context.before.substring(0, 80)}`);
      }
      if (hr.context.after) {
        console.log(`      Context after: ${hr.context.after.substring(0, 80)}`);
      }
    });
  }

  console.log('\n\n📝 TOTAL PLAYS FOUND:');
  console.log(`   ${gameData.plays.length} plays`);
  console.log('\n   Sample plays (first 10):');
  gameData.plays.slice(0, 10).forEach((play, idx) => {
    console.log(`   ${idx + 1}. ${play.substring(0, 100)}`);
  });

  // Search for specific keywords in the raw text
  console.log('\n\n🔍 KEYWORD SEARCH IN RAW TEXT:\n');

  const keywords = ['score', 'inning', 'top', 'bottom', 'final', 'runs', 'hits', 'errors'];
  const rawLower = gameData.rawText.toLowerCase();

  keywords.forEach(keyword => {
    const lines = gameData.rawText.split('\n').filter(line =>
      line.toLowerCase().includes(keyword) && line.trim().length > 5 && line.trim().length < 100
    );

    if (lines.length > 0) {
      console.log(`   "${keyword}" found in ${lines.length} line(s):`);
      lines.slice(0, 3).forEach(line => {
        console.log(`      - ${line.trim()}`);
      });
    }
  });

  // Show a chunk of raw text for inspection
  console.log('\n\n📄 RAW TEXT SAMPLE (first 2000 characters):\n');
  console.log('─'.repeat(80));
  console.log(gameData.rawText.substring(0, 2000));
  console.log('─'.repeat(80));
  console.log('\n... (truncated)\n');

  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));

  console.log('\n💡 ANALYSIS:');
  const has2026 = gameData.rawText.includes('2026');
  const has2025 = gameData.rawText.includes('2025');
  const hasFinal = gameData.rawText.toLowerCase().includes('final');
  const hasInProgress = gameData.rawText.toLowerCase().includes('inning') ||
                        gameData.rawText.toLowerCase().includes('top') ||
                        gameData.rawText.toLowerCase().includes('bottom');

  console.log(`   Year: ${has2026 ? '2026 ✅' : has2025 ? '2025 ⚠️' : 'Unknown'}`);
  console.log(`   Status: ${hasFinal ? 'Finished ✅' : hasInProgress ? 'In Progress or Recent 🟡' : 'Unknown'}`);
  console.log(`   Home Runs: ${gameData.homeRuns.length}`);
  console.log(`   Data Quality: ${gameData.plays.length > 20 ? 'Good ✅' : 'Limited ⚠️'}`);

  console.log('\n');
}

testLiveScrape();
