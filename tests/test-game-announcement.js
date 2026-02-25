const fs = require('fs');
const path = require('path');

// Load schedule
const schedulePath = path.join(__dirname, 'config', 'lsu-schedule-2026.json');
const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

// Find today's game (Feb 24)
const today = '2026-02-24';
const todaysGame = schedule.find(game => game.date === today);

if (!todaysGame) {
  console.log('No game found for today');
  process.exit(0);
}

console.log('📅 Today\'s Game Info:');
console.log(JSON.stringify(todaysGame, null, 2));
console.log();

// Build the message like the server does
let message = '🐯 ITS GAMEDAY YALL!!! 🐯\n\n';

// Teams (vs for home, at for away)
if (todaysGame.home) {
  message += `LSU vs ${todaysGame.opponent}\n`;
} else {
  message += `LSU at ${todaysGame.opponent}\n`;
}

// Location and ballpark
if (todaysGame.location) {
  message += `📍 ${todaysGame.location}`;
  if (todaysGame.ballpark) {
    message += `\n🏟️ ${todaysGame.ballpark}`;
  }
  message += '\n';
}

// Game time
if (todaysGame.time) {
  message += `🕐 ${todaysGame.time} CT\n`;
}

message += '\nTime to get FUNKY! 🟣🟡\n\n';
message += 'GEAUX TIGERS!!!';

console.log('📱 Game Day Message:');
console.log('='.repeat(60));
console.log(message);
console.log('='.repeat(60));
