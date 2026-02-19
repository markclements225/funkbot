# Project Audit - Unused Code & Files

## 🔍 UNUSED FILES (Can be deleted)

### Test/Exploration Files (No longer needed):
1. **check-available-models.js** - Old model testing
2. **explore-game-data.js** - RapidAPI exploration (now using StatBroadcast)
3. **explore-statbroadcast.js** - Initial StatBroadcast exploration
4. **explore-statbroadcast-deep.js** - StatBroadcast exploration
5. **fetch-exact-url.js** - StatBroadcast URL testing
6. **fetch-statbroadcast-live.js** - StatBroadcast fetch testing
7. **find-lsu-games-statbroadcast.js** - Game ID finding test
8. **find-upcoming-game-ids.js** - Game ID testing
9. **reverse-engineer-decoder.js** - Tried to decode StatBroadcast data
10. **test-real-statbroadcast-api.js** - API endpoint testing
11. **test-live-statbroadcast.js** - Live game testing
12. **statbroadcast-puppeteer.js** - Early Puppeteer prototype
13. **test-claude.js** - Claude API testing
14. **test-lsu-id.js** - LSU team ID testing
15. **test-groupme.js** - GroupMe posting test
16. **test-home-run-check.js** - Old RapidAPI HR check

### Old Server Files (Replaced):
17. **funkbot-server.js** - Old server version
18. **server2.js** - Old server version
19. **index.js** - Old home run monitor (logic now in server.js)
20. **game-preview.js** - Old game preview logic (now in server.js)
21. **scheduler.js** - Old separate scheduler (still using RapidAPI!)

### Useful Test Files (Keep for debugging):
- ✅ **test-current-games.js** - Test current game detection
- ✅ **test-live-scrape.js** - Test live scraping
- ✅ **test-date-detection.js** - Test date-based detection
- ✅ **test-scheduler-behavior.js** - Test scheduler logic
- ✅ **test-full-flow.js** - Test complete flow
- ✅ **set-todays-game.js** - Helper script for manual game config

---

## 🔍 UNUSED CODE IN ACTIVE FILES

### server.js:

#### 1. **stopHomeRunMonitoring()** function (Line 351)
- **Status**: DEFINED but NEVER CALLED
- **Issue**: No logic to stop monitoring once started
- **Impact**: Monitoring runs forever (until process killed)
- **Fix needed?**: Yes - should stop monitoring after game ends or at midnight

#### 2. **buildGamePreview()** function (Line 396)
- **Status**: CALLED but result is COMMENTED OUT (line 516)
- **Issue**: Function builds a game preview message but never posts it
- **Current behavior**: Builds preview, logs it, but doesn't post to GroupMe
- **Fix needed?**: Either remove function or uncomment posting line

#### 3. **checkForGameToday()** parameter `shouldPost` (Line 492)
- **Status**: USED but always passed as `false` (line 572)
- **Issue**: Game preview is never actually posted
- **Current behavior**: Initial check runs with `shouldPost=false`, so preview never posts
- **Fix needed?**: Remove parameter or implement game day posting

---

## 🔍 OLD/UNUSED IMPORTS & COMMENTS

### server.js:

#### Lines 11-13 - Commented out RapidAPI references:
```javascript
// RapidAPI no longer needed - using StatBroadcast with Puppeteer
// const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
// const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';
```
**Status**: Safe to keep as documentation

---

## 🔍 BACKUP DIRECTORY

### backup-rapidapi/ (Keep for rollback):
- **scheduler-rapidapi.js** - Old RapidAPI scheduler
- **server-rapidapi.js** - Old RapidAPI server
- **test-home-run-check.js** - Old test file

**Status**: Keep these for potential rollback if StatBroadcast fails

---

## 📋 SUMMARY

### Safe to Delete (21 files):
1. All exploration/test files from initial development
2. Old server versions (funkbot-server.js, server2.js, index.js, etc.)
3. scheduler.js (IMPORTANT: This is still the OLD RapidAPI version!)

### Keep for Debugging (6 files):
1. test-current-games.js
2. test-live-scrape.js
3. test-date-detection.js
4. test-scheduler-behavior.js
5. test-full-flow.js
6. set-todays-game.js

### Code Issues to Fix:
1. **stopHomeRunMonitoring()** - Never called, monitoring runs forever
2. **buildGamePreview()** - Result never posted (commented out)
3. **checkForGameToday()** - `shouldPost` parameter not properly used

### Files in Use:
- ✅ server.js - Main server (active)
- ✅ statbroadcast-tracker.js - Scraping logic (active)
- ✅ game-config.json - Game configuration (active)
- ✅ lsu-schedule-2026.json - Schedule data (active)
- ✅ package.json - Dependencies (active)
- ✅ Dockerfile - Railway deployment (active)
- ✅ .env - Environment variables (active)

---

## 🔍 UNUSED CODE IN statbroadcast-tracker.js

### Exported but UNUSED functions:

#### 1. **getAllLSUGameIDs()** (Line 14)
- **Status**: EXPORTED but only used INTERNALLY by getTodaysGameIDs()
- **Impact**: Not called directly by server.js
- **Fix needed?**: No - it's used internally, safe to keep

#### 2. **checkForLSUHomeRuns()** (Line 389)
- **Status**: EXPORTED but NEVER USED by server.js
- **Issue**: server.js implements its own loop instead (lines 428-476)
- **Current behavior**:
  - server.js loops through games manually
  - server.js calls `getGameData()` and `isLSUHomeRun()` directly
  - Duplicates the logic in checkForLSUHomeRuns()
- **Fix needed?**:
  - Option A: Use checkForLSUHomeRuns() in server.js (cleaner)
  - Option B: Remove checkForLSUHomeRuns() export (it's not needed)

### Functions Actually Used by server.js:
- ✅ **getTodaysGameIDs()** - Gets today's games
- ✅ **getGameData()** - Scrapes individual game
- ✅ **isLSUHomeRun()** - Filters LSU home runs

---

## ⚠️ CRITICAL ISSUE

**scheduler.js is STILL using RapidAPI!** This file exists but is NOT being used. The scheduling logic is now in server.js (lines 555-558) using a cron job.

If scheduler.js were run by accident, it would fail because:
1. It's looking for RapidAPI keys
2. It's using the old API
3. It doesn't know about StatBroadcast

**Recommendation**: Delete scheduler.js or clearly rename it to scheduler-OLD.js

---

## 🔍 UNUSED NPM SCRIPTS in package.json

### Lines 7-10 - Old scripts pointing to deleted/unused files:

```json
"scripts": {
  "start": "node server.js",        // ✅ ACTIVE - Used by Railway
  "homer": "node index.js",          // ❌ UNUSED - index.js is old file
  "scheduler": "node scheduler.js",  // ❌ UNUSED - scheduler.js uses RapidAPI
  "ai": "node funkbot-server.js"     // ❌ UNUSED - funkbot-server.js is old
}
```

**Status**:
- `start` is the ONLY script used (by Railway)
- `homer`, `scheduler`, and `ai` point to OLD unused files
- **Fix needed**: Remove unused scripts or update them

---

## 🔍 DEPENDENCIES

All dependencies in package.json are ACTIVELY USED:
- ✅ **dotenv** - Environment variables
- ✅ **express** - Web server
- ✅ **node-cron** - Scheduler (8 AM daily check)
- ✅ **puppeteer** - StatBroadcast scraping

**Status**: All dependencies are necessary ✅

---

## 🔍 DOCKERFILE

All Dockerfile configurations are ACTIVELY USED:
- ✅ Chromium installation for Puppeteer
- ✅ Node.js 18-slim base image
- ✅ Health check for Railway
- ✅ Starts server.js correctly

**Status**: Dockerfile is optimized and ready ✅

---

## 📊 FINAL CLEANUP RECOMMENDATIONS

### High Priority (Delete these):
1. **21 test/exploration files** - No longer needed
2. **scheduler.js** - OLD RapidAPI version still exists!
3. **index.js** - Old home run monitor
4. **game-preview.js** - Logic moved to server.js
5. **funkbot-server.js** - Old server
6. **server2.js** - Old server

### Medium Priority (Fix these):
1. **stopHomeRunMonitoring()** in server.js - Never called
2. **buildGamePreview()** in server.js - Result never posted
3. **checkForLSUHomeRuns()** in statbroadcast-tracker.js - Not used by server.js
4. **package.json scripts** - Remove `homer`, `scheduler`, `ai`

### Low Priority (Keep but document):
1. **backup-rapidapi/** folder - Keep for rollback
2. Test helper scripts - Keep for debugging
3. Commented RapidAPI code - Keep as documentation

---

## 💾 DISK SPACE SAVINGS

Deleting recommended files would save approximately:
- **21 test/exploration files**: ~150 KB
- **6 old server files**: ~80 KB
- **Total**: ~230 KB (not much, but cleaner codebase)

**Main benefit**: Cleaner, more maintainable codebase with less confusion
