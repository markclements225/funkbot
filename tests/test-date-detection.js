/**
 * Test date-based game detection for today, tomorrow, and next day
 */

const fs = require('fs');
const path = require('path');

function getGamesForDate(dateStr) {
  const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  // Find games for this date
  const games = schedule.filter(game => game.date === dateStr);

  return games;
}

function testDateDetection() {
  console.log('Testing date-based game detection...\n');
  console.log('='.repeat(80));

  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Day after tomorrow
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  // Test today
  console.log(`\n📅 TODAY (${todayStr}):`);
  const todayGames = getGamesForDate(todayStr);
  if (todayGames.length > 0) {
    todayGames.forEach(game => {
      console.log(`   ✅ Game ${game.gameId} - ${game.opponent}`);
      console.log(`      URL: https://stats.statbroadcast.com/broadcast/?id=${game.gameId}`);
    });
  } else {
    console.log('   ❌ No games scheduled');
  }

  // Test tomorrow
  console.log(`\n📅 TOMORROW (${tomorrowStr}):`);
  const tomorrowGames = getGamesForDate(tomorrowStr);
  if (tomorrowGames.length > 0) {
    tomorrowGames.forEach(game => {
      console.log(`   ✅ Game ${game.gameId} - ${game.opponent}`);
      console.log(`      URL: https://stats.statbroadcast.com/broadcast/?id=${game.gameId}`);
    });
  } else {
    console.log('   ❌ No games scheduled');
  }

  // Test day after tomorrow
  console.log(`\n📅 DAY AFTER TOMORROW (${dayAfterStr}):`);
  const dayAfterGames = getGamesForDate(dayAfterStr);
  if (dayAfterGames.length > 0) {
    dayAfterGames.forEach(game => {
      console.log(`   ✅ Game ${game.gameId} - ${game.opponent}`);
      console.log(`      URL: https://stats.statbroadcast.com/broadcast/?id=${game.gameId}`);
    });
  } else {
    console.log('   ❌ No games scheduled');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Date detection test complete!\n');
}

testDateDetection();
