/**
 * Test what the scheduler would detect for today, tomorrow, and next day
 * Simulates the getTodaysGameIDs() function for different dates
 */

const fs = require('fs');
const path = require('path');

function simulateGetTodaysGameIDs(simulatedDate) {
  const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  const configPath = path.join(__dirname, '..', 'config', 'game-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Check if manual config is set
  if (config.currentGames && config.currentGames.length > 0) {
    return {
      mode: 'manual',
      games: config.currentGames
    };
  }

  // Auto-detect mode
  if (config.autoDetect) {
    // Get simulated date in YYYY-MM-DD format
    const dateStr = simulatedDate.toISOString().split('T')[0];

    // Find games for this date
    const todaysGames = schedule
      .filter(game => game.date === dateStr)
      .map(game => game.gameId);

    if (todaysGames.length > 0) {
      return {
        mode: 'today',
        date: dateStr,
        games: todaysGames
      };
    }

    // If no games today, check nearby dates (yesterday and tomorrow)
    const yesterday = new Date(simulatedDate);
    yesterday.setDate(simulatedDate.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(simulatedDate);
    tomorrow.setDate(simulatedDate.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const nearbyGames = schedule
      .filter(game => game.date === yesterdayStr || game.date === tomorrowStr)
      .map(game => game.gameId);

    if (nearbyGames.length > 0) {
      return {
        mode: 'nearby',
        date: dateStr,
        nearbyDates: [yesterdayStr, tomorrowStr],
        games: nearbyGames
      };
    }
  }

  return {
    mode: 'none',
    games: []
  };
}

async function testSchedulerBehavior() {
  console.log('Testing what the SCHEDULER would do...\n');
  console.log('='.repeat(80));

  // Get today, tomorrow, day after
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  // Test TODAY (when scheduler runs at 8 AM today)
  console.log(`\n🕐 SCHEDULER RUNS TODAY (${today.toISOString().split('T')[0]}):`);
  const todayResult = simulateGetTodaysGameIDs(today);
  console.log(`   Mode: ${todayResult.mode}`);
  if (todayResult.games.length > 0) {
    console.log(`   ✅ Will monitor: ${todayResult.games.join(', ')}`);
    todayResult.games.forEach(gameId => {
      console.log(`      📊 https://stats.statbroadcast.com/broadcast/?id=${gameId}`);
    });
  } else {
    console.log(`   ❌ No games to monitor`);
  }

  // Test TOMORROW (when scheduler runs at 8 AM tomorrow)
  console.log(`\n🕐 SCHEDULER RUNS TOMORROW (${tomorrow.toISOString().split('T')[0]}):`);
  const tomorrowResult = simulateGetTodaysGameIDs(tomorrow);
  console.log(`   Mode: ${tomorrowResult.mode}`);
  if (tomorrowResult.mode === 'nearby') {
    console.log(`   ⚠️  No games on ${tomorrowResult.date}, checking nearby dates`);
    console.log(`   📅 Checking: ${tomorrowResult.nearbyDates.join(', ')}`);
  }
  if (tomorrowResult.games.length > 0) {
    console.log(`   ✅ Will monitor: ${tomorrowResult.games.join(', ')}`);
    tomorrowResult.games.forEach(gameId => {
      console.log(`      📊 https://stats.statbroadcast.com/broadcast/?id=${gameId}`);
    });
  } else {
    console.log(`   ❌ No games to monitor`);
  }

  // Test DAY AFTER (when scheduler runs at 8 AM day after tomorrow)
  console.log(`\n🕐 SCHEDULER RUNS DAY AFTER (${dayAfter.toISOString().split('T')[0]}):`);
  const dayAfterResult = simulateGetTodaysGameIDs(dayAfter);
  console.log(`   Mode: ${dayAfterResult.mode}`);
  if (dayAfterResult.games.length > 0) {
    console.log(`   ✅ Will monitor: ${dayAfterResult.games.join(', ')}`);
    dayAfterResult.games.forEach(gameId => {
      console.log(`      📊 https://stats.statbroadcast.com/broadcast/?id=${gameId}`);
    });
  } else {
    console.log(`   ❌ No games to monitor`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Scheduler behavior test complete!\n');
}

testSchedulerBehavior();
