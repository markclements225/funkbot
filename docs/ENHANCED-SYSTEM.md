# 🚀 Enhanced System - RapidAPI + StatBroadcast Hybrid

## ✅ WHAT WAS IMPLEMENTED

### **Hybrid Approach:**
- **RapidAPI** for game metadata (time, location, records)
- **StatBroadcast** for home run detection (real-time)

---

## 🎯 NEW FEATURES

### 1. **Rich Game Day Alerts** ✅

**With RapidAPI:**
```
🐯 ITS GAMEDAY YALL!!! 🐯

LSU (5-0) vs Nicholls (2-3)
🏟️ Alex Box Stadium
🕐 6:00 PM CST

Time to get FUNKY! 🟣🟡

GEAUX TIGERS!!!
```

**Includes:**
- ✅ Teams with records
- ✅ Game time (CST)
- ✅ Location/venue
- ✅ Home/away indicator

**Without RapidAPI (fallback):**
```
🐯 ITS GAMEDAY YALL!!! 🐯

NICH 1, LSU 9 - B8th

Time to get FUNKY! 🟣🟡

GEAUX TIGERS!!!
```

---

### 2. **Smart Monitoring Timing** ✅

**Before:**
- Start: 8:00 AM (when scheduler runs)
- Stop: 12:00 AM (midnight)
- Duration: 16 hours (mostly before game)

**After:**
- Start: **5 min before first pitch** (e.g., 5:55 PM)
- Stop: **5 min after game is Final** (e.g., 9:05 PM)
- Duration: ~3-4 hours (only during game)

**Benefits:**
- Saves Railway compute resources
- Saves Puppeteer browser resources
- More efficient
- Still catches all home runs

---

## 🔄 HOW IT WORKS

### **Daily Flow (8:00 AM CST):**

```
1. Scheduler Runs
   └─ Checks lsu-schedule-2026.json for today's date
   └─ Finds game ID (e.g., 632807)

2. Try RapidAPI
   └─ Fetch matches for today by date
   └─ Filter by LSU_TEAM_ID
   └─ Get: time, location, records, venue

3. Build Game Alert
   ├─ WITH RapidAPI: Rich alert (time/location/records)
   └─ WITHOUT RapidAPI: Basic alert (opponent only)

4. Post to GroupMe
   └─ Send game day alert message

5. Schedule Monitoring
   ├─ WITH game time: Schedule start 5 min before
   ├─ Game in progress: Start now
   └─ NO game time: Start now (fallback)
```

### **During Game:**

```
Every 60 seconds:
1. Scrape StatBroadcast page
2. Click "Scoring Plays" tab
3. Extract home runs
4. Filter for LSU (Bot = LSU, Top = opponent)
5. Post FUNKY messages to GroupMe
6. Check if game status = "Final"
   └─ If Final: Stop monitoring in 5 minutes
```

---

## 🔧 TECHNICAL DETAILS

### **New Functions Added:**

#### `getRapidAPIGameForToday()`
- Calls RapidAPI MLB College Baseball API
- Filters by LSU_TEAM_ID
- Returns game object with full metadata
- Returns null if not found or error

#### `buildGamePreview()` - Enhanced
- **NEW:** Returns object `{ message, gameTime, rapidAPIData }`
- **OLD:** Returned string only
- Tries RapidAPI first
- Falls back to StatBroadcast basic data

#### `checkForHomeRuns()` - Enhanced
- **NEW:** Checks if game status is "Final"
- **NEW:** Schedules stop 5 min after Final
- Still posts home runs every 60 seconds

#### `checkForGameToday()` - Enhanced
- **NEW:** Parses game time from RapidAPI
- **NEW:** Schedules monitoring 5 min before first pitch
- **NEW:** Handles game already in progress
- Falls back to immediate start if no time

---

## 📋 ENVIRONMENT VARIABLES

### **Required:**
```env
GROUPME_BOT_ID=your_bot_id
PERPLEXITY_API_KEY=your_api_key
```

### **Optional (for rich game alerts):**
```env
RAPIDAPI_KEY=your_rapidapi_key
LSU_TEAM_ID=10291565
```

**If optional vars missing:**
- Game alerts will be basic (opponent only)
- Monitoring starts immediately (8 AM)
- Still fully functional, just less info

**If optional vars present:**
- Game alerts include time/location/records
- Monitoring starts 5 min before game
- Stops 5 min after Final

---

## ✅ BENEFITS

### **1. Better User Experience**
- Full game information in alerts
- More professional looking
- Matches expectations

### **2. Resource Efficiency**
- Monitoring only runs during games (~4 hours)
- Instead of all day (16 hours)
- 75% reduction in Puppeteer usage
- Lower Railway costs

### **3. Graceful Degradation**
- Works with or without RapidAPI
- Falls back intelligently
- Never breaks

### **4. Flexibility**
- Can add/remove RapidAPI anytime
- No code changes needed
- Just set/unset environment variable

---

## 🧪 TESTING

Run the test to see both formats:
```bash
npm run test-flow
# Or
node tests/test-enhanced-flow.js
```

---

## 🚀 DEPLOYMENT

### **Option 1: With RapidAPI (Recommended)**

1. Set environment variables in Railway:
   - GROUPME_BOT_ID
   - PERPLEXITY_API_KEY
   - RAPIDAPI_KEY ← NEW
   - LSU_TEAM_ID ← NEW

2. Deploy

3. Result:
   - Rich game alerts
   - Smart monitoring timing
   - Resource efficient

### **Option 2: Without RapidAPI (Still Works)**

1. Set only required variables:
   - GROUPME_BOT_ID
   - PERPLEXITY_API_KEY

2. Deploy

3. Result:
   - Basic game alerts
   - Monitoring starts at 8 AM
   - Still catches all HRs

---

## 📊 COMPARISON

| Feature | Old System | New System (with RapidAPI) | New System (no RapidAPI) |
|---------|-----------|---------------------------|-------------------------|
| **Game Alerts** | Basic | Rich (time/location/records) | Basic |
| **Monitoring Start** | 8 AM | 5 min before first pitch | 8 AM (fallback) |
| **Monitoring Stop** | Midnight | 5 min after Final | 5 min after Final |
| **Duration** | ~16 hours | ~4 hours | ~4-16 hours |
| **HR Detection** | Perfect | Perfect | Perfect |
| **Resource Usage** | High | Low | Medium |

---

## 🎉 READY TO DEPLOY!

Everything is implemented and tested. The system:

- ✅ Posts rich game day alerts (with RapidAPI)
- ✅ Falls back gracefully (without RapidAPI)
- ✅ Starts monitoring 5 min before first pitch
- ✅ Stops monitoring 5 min after game Final
- ✅ Detects home runs perfectly
- ✅ Posts FUNKY messages
- ✅ Saves resources

**Next step: Deploy to Railway!** 🚀
