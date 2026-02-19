#!/usr/bin/env node

/**
 * Helper script to manually set today's game IDs
 * Run this when you know LSU has a game today
 *
 * Usage:
 *   node set-todays-game.js 632807
 *   node set-todays-game.js 632807 632808  (multiple games)
 *   node set-todays-game.js clear  (clear all)
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'game-config.json');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📋 Current Configuration:\n');

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log('No config file found');
  }

  console.log('\n💡 Usage:');
  console.log('   node set-todays-game.js 632807           # Set game ID');
  console.log('   node set-todays-game.js 632807 632808   # Multiple games');
  console.log('   node set-todays-game.js clear           # Clear all');
  console.log('   node set-todays-game.js auto            # Auto-detect mode');

  process.exit(0);
}

if (args[0] === 'clear') {
  const config = {
    comment: "Manually configure which games to monitor",
    currentGames: [],
    autoDetect: true,
    checkRecentGames: 3
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Cleared game config - will auto-detect recent games');
  process.exit(0);
}

if (args[0] === 'auto') {
  const config = {
    comment: "Manually configure which games to monitor",
    currentGames: [],
    autoDetect: true,
    checkRecentGames: 5
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Set to auto-detect mode (checks 5 most recent games)');
  process.exit(0);
}

// Set specific game IDs
const gameIds = args.filter(arg => /^\d+$/.test(arg));

if (gameIds.length === 0) {
  console.log('❌ No valid game IDs provided');
  console.log('   Game IDs should be numbers, e.g.: 632807');
  process.exit(1);
}

const config = {
  comment: "Manually configure which games to monitor",
  currentGames: gameIds,
  autoDetect: false,
  checkRecentGames: 3
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Set today\'s game(s):');
gameIds.forEach(id => {
  console.log(`   📊 Game ID: ${id}`);
  console.log(`   🔗 URL: https://stats.statbroadcast.com/broadcast/?id=${id}`);
});

console.log('\n💡 The bot will now monitor these games only');
console.log('   Run "node set-todays-game.js auto" to return to auto-detect mode');
