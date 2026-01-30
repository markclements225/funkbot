require('dotenv').config();
const cron = require('node-cron');
const { spawn } = require('child_process');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID;

let monitoringProcess = null;

// Function to check if LSU has a game today
async function checkForLSUGameToday() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n[${new Date().toLocaleString()}] Checking for LSU games on ${today}...`);
    
    const response = await fetch(
      `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${today}&league=NCAA`,
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    
    // Filter for LSU games
    const lsuGames = data.data?.filter(match => 
      match.homeTeam.id === parseInt(LSU_TEAM_ID) || 
      match.awayTeam.id === parseInt(LSU_TEAM_ID)
    ) || [];

    if (lsuGames.length > 0) {
      console.log(`✅ Found ${lsuGames.length} LSU game(s) today!`);
      
      lsuGames.forEach(game => {
        const gameTime = new Date(game.date);
        const opponent = game.homeTeam.id === parseInt(LSU_TEAM_ID) 
          ? game.awayTeam.displayName 
          : game.homeTeam.displayName;
        
        console.log(`   📅 LSU vs ${opponent}`);
        console.log(`   ⏰ Game time: ${gameTime.toLocaleString()}`);
        console.log(`   📊 Status: ${game.state.description}`);
      });
      
      return lsuGames;
    } else {
      console.log('❌ No LSU games scheduled for today.');
      return [];
    }
  } catch (error) {
    console.error('Error checking for games:', error);
    return [];
  }
}

// Function to calculate when to start and stop monitoring
function calculateMonitoringWindow(games) {
  if (games.length === 0) return null;
  
  // Get the earliest game start time
  const gameTimes = games.map(g => new Date(g.date));
  const earliestGame = new Date(Math.min(...gameTimes));
  
  // Start monitoring 30 minutes before first game
  const startTime = new Date(earliestGame.getTime() - 30 * 60 * 1000);
  
  // End monitoring 4 hours after first game (typical game length + buffer)
  const endTime = new Date(earliestGame.getTime() + 4 * 60 * 60 * 1000);
  
  return { startTime, endTime };
}

// Function to start the home run monitoring
function startMonitoring() {
  if (monitoringProcess) {
    console.log('⚠️  Monitoring already running.');
    return;
  }
  
  console.log('\n🚀 Starting LSU home run monitoring...');
  
  monitoringProcess = spawn('node', ['index.js'], {
    stdio: 'inherit'
  });
  
  monitoringProcess.on('error', (error) => {
    console.error('Error starting monitoring:', error);
    monitoringProcess = null;
  });
  
  monitoringProcess.on('exit', (code) => {
    console.log(`Monitoring process exited with code ${code}`);
    monitoringProcess = null;
  });
}

// Function to stop the home run monitoring
function stopMonitoring() {
  if (monitoringProcess) {
    console.log('\n🛑 Stopping LSU home run monitoring...');
    monitoringProcess.kill();
    monitoringProcess = null;
  }
}

// Schedule monitoring based on game time
async function scheduleMonitoringForToday() {
  const games = await checkForLSUGameToday();
  
  if (games.length === 0) {
    console.log('No monitoring needed today.\n');
    return;
  }
  
  const window = calculateMonitoringWindow(games);
  const now = new Date();
  
  console.log(`\n📋 Monitoring Schedule:`);
  console.log(`   Start: ${window.startTime.toLocaleString()}`);
  console.log(`   End: ${window.endTime.toLocaleString()}`);
  
  // If we're already in the monitoring window, start immediately
  if (now >= window.startTime && now <= window.endTime) {
    console.log('\n🎯 We\'re in the game window! Starting monitoring now...');
    startMonitoring();
    
    // Schedule stop time
    const msUntilEnd = window.endTime.getTime() - now.getTime();
    setTimeout(() => {
      stopMonitoring();
      console.log('Game window ended. Monitoring stopped.');
    }, msUntilEnd);
    
  } else if (now < window.startTime) {
    // Schedule future start
    const msUntilStart = window.startTime.getTime() - now.getTime();
    const msUntilEnd = window.endTime.getTime() - now.getTime();
    
    console.log(`\n⏳ Monitoring will start in ${Math.round(msUntilStart / 1000 / 60)} minutes...`);
    
    setTimeout(() => {
      startMonitoring();
      
      // Schedule stop
      setTimeout(() => {
        stopMonitoring();
        console.log('Game window ended. Monitoring stopped.');
      }, msUntilEnd - msUntilStart);
      
    }, msUntilStart);
    
  } else {
    console.log('\n⏰ Game window has already passed for today.');
  }
}

// Main function
async function main() {
  console.log('⚾ LSU Baseball Game Scheduler Started!');
  console.log('=' .repeat(50));
  
  // Check immediately on startup
  await scheduleMonitoringForToday();
  
  // Schedule daily check at 6 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('\n' + '='.repeat(50));
    console.log('📅 Daily game check triggered (6:00 AM)');
    console.log('='.repeat(50));
    await scheduleMonitoringForToday();
  });
  
  console.log('\n✅ Scheduler is running!');
  console.log('   - Checking for games daily at 6:00 AM');
  console.log('   - Will auto-start monitoring when games are scheduled');
  console.log('\nPress Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  stopMonitoring();
  process.exit(0);
});

main();