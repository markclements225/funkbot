# 🐯 FunkBot - LSU Baseball Home Run Tracker

FunkBot is an automated bot that tracks LSU Baseball home runs in real-time and posts FUNKY alerts to GroupMe!

## 🚀 Features

- **Real-time Home Run Detection** - Scrapes StatBroadcast every 60 seconds during games
- **Accurate Home/Away Detection** - Uses score table to correctly identify LSU home runs
- **Daily Game Day Alerts** - Posts rich game info to GroupMe at 8:00 AM CST
- **Weather Forecasts** - Includes game day weather (high/low temps, rain chance, conditions)
- **Smart Startup Detection** - Checks for ongoing games on redeploy and starts monitoring
- **AI-Powered Chat** - Responds to @FunkBot mentions with Perplexity AI
- **Rich Schedule Data** - Includes opponent, time, location, and ballpark info
- **Deployment Notifications** - Posts to GroupMe when successfully deployed

## 📁 Project Structure

```
funk-bot/
├── src/                           # Source code
│   ├── server.js                  # Main application server
│   └── statbroadcast-tracker.js   # StatBroadcast scraping logic
│
├── config/                        # Configuration files
│   ├── game-config.json           # Manual game configuration
│   ├── lsu-schedule-2026.json     # LSU 2026 baseball schedule
│   └── posted_home_runs.json      # Tracks posted HRs (auto-generated)
│
├── scripts/                       # Utility scripts
│   └── set-todays-game.js         # Helper to manually set game IDs
│
├── tests/                         # Test scripts
│   ├── test-current-games.js      # Test current game detection
│   ├── test-game-lookup.js        # Test game data extraction
│   ├── test-live-detection.js     # Test live game detection
│   ├── test-startup-flow.js       # Test startup game check
│   ├── verify-todays-game.js      # Verify game configuration
│   └── (other test files)         # Additional test utilities
│
├── assets/                        # Static assets
│   └── FunkBlastoise.jpg          # Home run celebration image
│
├── docs/                          # Documentation
│   ├── AUDIT-UNUSED-CODE.md       # Code audit report
│   ├── CHANGES-FINAL-SETUP.md     # Final setup changes
│   └── CLEANUP-COMPLETE.md        # Cleanup summary
│
├── archive/                       # Archived old files
│   ├── archived-old-files/        # Old exploration/test files
│   └── backup-rapidapi/           # RapidAPI backup (rollback)
│
├── package.json                   # Node.js dependencies
├── Dockerfile                     # Railway deployment config
├── .env                           # Environment variables (not committed)
└── .gitignore                     # Git ignore rules
```

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express** - Web server
- **Puppeteer** - Headless browser for scraping
- **Perplexity AI** - AI chat responses
- **node-cron** - Job scheduling
- **GroupMe API** - Message posting

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# GroupMe
GROUPME_BOT_ID=your_bot_id
GROUPME_ACCESS_TOKEN=your_access_token

# AI
PERPLEXITY_API_KEY=your_api_key

# Weather (optional - for game day forecasts)
WEATHER_API_KEY=your_weatherapi_key

# Railway (optional - auto-set by Railway)
PORT=3000
RAILWAY_ENVIRONMENT=production
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Run the server
npm start

# Or run specific scripts
npm run test-flow       # Test complete flow
npm run test-live       # Test live scraping
npm run set-game        # Manually set game ID
npm run test-messages   # Show message formats
```

## 🚂 Deployment (Railway)

The bot is configured to deploy automatically to Railway:

1. Push to GitHub
2. Railway detects changes
3. Builds Docker container
4. Runs `npm start` → `node src/server.js`
5. Posts deployment success to GroupMe

## 📅 How It Works

### Daily Schedule (8:00 AM CST)
1. Checks `config/lsu-schedule-2026.json` for today's games
2. Posts "GAMEDAY" alert to GroupMe if game found
3. Starts home run monitoring

### Home Run Monitoring (Every 60 seconds)
1. Uses Puppeteer to load StatBroadcast game page
2. Clicks "Scoring Plays" tab
3. Detects home/away using score table (first team = away, second = home)
4. Extracts home run data
5. Filters for LSU home runs based on Top/Bottom inning and home/away status
6. Posts FUNKY message to GroupMe with FunkBlastoise image

### Midnight Cleanup (12:00 AM CST)
- Stops monitoring to reset for next day

## 📱 GroupMe Messages

### Deployment Success
```
🚀 FunkBot has been deployed successfully! All systems are
FUNKY and ready to track LSU home runs! 🐯⚾
```

### Game Day Alert
```
🐯 ITS GAMEDAY BOYS!!! 🐯

LSU vs Dartmouth
📍 Baton Rouge, LA
🏟️ Alex Box Stadium, Skip Bertman Field
🕐 6:30 PM CT
☀️ High 73°F, Low 55°F, 10% rain, Partly cloudy

Time to get FUNKY! 🟣🟡

GEAUX TIGERS!!!
```

### Home Run Alert
```
PUCKER UP AND KISS THAT BABY GOODBYE!!!

Caraway FUNKBLAST!!! The Tigers score 4 runs on the home run
to left field!!! LETS GET FUNKY!!!

📸 [FunkBlastoise.jpg attached]
```

## 🧪 Testing

Run tests from the root directory:

```bash
# Test full system flow
npm run test-flow

# Test live game scraping
npm run test-live

# Show all message formats
npm run test-messages

# Test weather integration
npm run test-weather

# Manually set today's game
npm run set-game 632807

# Or run individual test files
node tests/test-current-games.js
node tests/test-date-detection.js
```

## 🔧 Manual Game Configuration

If auto-detection isn't working, manually set game IDs:

```bash
# Set specific game
npm run set-game 632807

# Set multiple games
npm run set-game 632807 632808

# Return to auto-detect
npm run set-game auto

# Clear all games
npm run set-game clear
```

## 📊 Monitoring

- **Logs**: Check Railway logs for activity
- **posted_home_runs.json**: Tracks which HRs have been posted (prevents duplicates)
- **Health Check**: Dockerfile includes health check on port 3000

## 🤖 AI Chat

Mention @FunkBot in GroupMe to chat:
- "@FunkBot what's the weather?"
- "@FunkBot who won the LSU game?"
- "@FunkBot give me a parlay for tonight"

## 🏗️ Development

Built with industry-standard Node.js project structure:
- `/src` - Application code
- `/tests` - Test files
- `/scripts` - Utility scripts
- `/config` - Configuration data
- `/docs` - Documentation
- `/assets` - Static files
- `/archive` - Old/backup files

## 📄 License

ISC

## 🎉 Credits

Go Tigers! 🐯⚾🟣🟡
