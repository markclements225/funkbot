# 🔄 Recent Changes & Updates

## Version 2.1 - February 2026

### 🎯 Major Improvements

#### ✅ Fixed Home/Away Detection (Critical Bug Fix)
- **Problem**: Bot incorrectly assumed LSU was always the home team
- **Solution**: Now uses score table to detect home/away dynamically
  - First team in score table = Away team
  - Second team in score table = Home team
- **Impact**: Correctly identifies LSU home runs in both home and away games
- **File**: `src/statbroadcast-tracker.js`

#### 🚀 Added Startup Game Detection
- **Feature**: Bot now checks for ongoing games on startup/redeploy
- **Benefit**: If you redeploy during a live game, monitoring starts immediately
- **Behavior**:
  - Checks all scheduled games on startup
  - Detects if game is currently live (has plays, not final)
  - Starts monitoring automatically if game in progress
- **File**: `src/server.js` - `checkForOngoingGames()`

#### 📅 Enhanced Schedule Structure
- **New Fields**:
  ```json
  {
    "date": "2026-02-27",
    "opponent": "Dartmouth",
    "time": "6:30 PM",
    "home": true,
    "location": "Baton Rouge, LA",
    "ballpark": "Alex Box Stadium, Skip Bertman Field",
    "gameId": "632808"
  }
  ```
- **Benefit**: Game day announcements now include full details
- **File**: `config/lsu-schedule-2026.json`

#### 📱 Improved Game Day Announcements
- **Old Format**:
  ```
  🐯 ITS GAMEDAY YALL!!! 🐯
  LSU vs Opponent
  ```
- **New Format**:
  ```
  🐯 ITS GAMEDAY BOYS!!! 🐯

  LSU vs Dartmouth
  📍 Baton Rouge, LA
  🏟️ Alex Box Stadium, Skip Bertman Field
  🕐 6:30 PM CT

  Time to get FUNKY! 🟣🟡
  GEAUX TIGERS!!!
  ```
- **File**: `src/server.js` - `buildGamePreview()`

### 🛠️ Technical Changes

#### Schedule Management
- Created `scrape-future-schedule.js` to scrape LSU schedule from lsusports.net
- Manual override system: `node scripts/set-todays-game.js <gameId>`
- After manual override, remember to run: `node scripts/set-todays-game.js auto`

#### Code Organization
- ✅ Moved all test files to `tests/` directory
- ✅ Archived old experimental scraper scripts
- ✅ Updated README.md with new features
- ✅ Updated DEPLOY.md with startup behavior

### 📊 Current System Flow

#### Daily Scheduler (8:00 AM CST)
1. Load `lsu-schedule-2026.json`
2. Find game for today's date
3. Build rich game announcement with schedule data
4. Post to GroupMe
5. Start monitoring based on game time

#### Startup Detection (On Deploy)
1. Check `lsu-schedule-2026.json` for today's games
2. Fetch game data from StatBroadcast
3. Check if game is currently live
4. Start monitoring immediately if live

#### Home Run Detection (Every 60 seconds)
1. Load game page with Puppeteer
2. Click "Scoring" tab
3. Extract score table to detect home/away
4. Find home run plays (Top/Bottom inning indicators)
5. Filter for LSU home runs using home/away status
6. Post to GroupMe if new HR detected

### 🐛 Known Issues & Workarounds

#### Manual Game Override Required
- **Issue**: Tournament games often have different game IDs than scheduled
- **Workaround**: Use `node scripts/set-todays-game.js <gameId>`
- **Example**: Jacksonville tournament games (651253, 651255, 651258) vs scheduled IDs

#### Schedule Scraper Limitations
- **Issue**: LSU sports website has complex HTML structure
- **Current**: Schedule manually updated through April 2026
- **Future**: May need to manually add games or refine scraper

### 📝 Files Changed

#### Core Application
- `src/server.js` - Home/away detection, startup check, game announcements
- `src/statbroadcast-tracker.js` - Score table detection logic

#### Configuration
- `config/lsu-schedule-2026.json` - Enhanced structure with full game details
- `config/game-config.json` - Manual override configuration

#### Documentation
- `README.md` - Updated features and message formats
- `DEPLOY.md` - Updated startup behavior
- `CHANGES.md` - This file

#### Scripts
- `scripts/scrape-future-schedule.js` - Future game scraper (kept)
- `scripts/set-todays-game.js` - Manual override utility (kept)

#### Tests
- Moved 5 new test files to `tests/` directory
- Archived 3 experimental scraper scripts to `archive/`

### ✅ Testing Completed

- ✅ Home/away detection with game 651253 (LSU away)
- ✅ Home/away detection with game 651255 (LSU home)
- ✅ Live game detection on startup
- ✅ Game announcement format with rich schedule data
- ✅ Manual game override functionality

### 🎯 Next Steps

1. **Monitor First Real Game**: Verify all systems work in production
2. **Schedule Updates**: Add new games as they're announced
3. **Auto-detect Return**: Remember to switch back to auto mode after manual overrides
4. **Scraper Refinement**: Optionally improve schedule scraper for future use

---

## Version 2.0 - February 2026 (Initial Release)

### Features
- Real-time home run detection via StatBroadcast
- Daily game day alerts
- AI-powered chat with Perplexity
- Automatic game scheduling
- Railway deployment

---

*Last Updated: February 24, 2026*
