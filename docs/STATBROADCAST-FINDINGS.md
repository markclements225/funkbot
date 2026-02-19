# StatBroadcast vs RapidAPI Comparison

## Current Setup (RapidAPI)

You're currently using **RapidAPI's MLB College Baseball API**:
- Endpoint: `https://mlb-college-baseball-api.p.rapidapi.com/`
- Requires: `RAPIDAPI_KEY` environment variable
- Used in: `scheduler.js`, `server.js`, `test-home-run-check.js`, etc.

### RapidAPI Pros:
- ✅ Documented API with consistent endpoints
- ✅ Works for all NCAA teams (not just LSU)
- ✅ Provides game schedule, scores, play-by-play
- ✅ Team statistics available
- ✅ Reliable structure and uptime

### RapidAPI Cons:
- ❌ Requires API key (potential cost/limits)
- ❌ May have rate limiting
- ❌ Third-party dependency
- ❌ Updates may be delayed vs. live stats

---

## StatBroadcast (LSU's Official Stats Provider)

### What We Discovered:

1. **LSU's StatBroadcast page exists**: https://lsusports.statbroadcast.com/
2. **No documented public API**, but data is accessible
3. **Common endpoint patterns**:
   ```
   XML Feed:  https://stats.statbroadcast.com/feed/getxml.asp?eventid={GAMEID}
   JSON Feed: https://stats.statbroadcast.com/feed/getjson.asp?eventid={GAMEID}
   Box Score: https://stats.statbroadcast.com/broadcast/getxml.asp?id={GAMEID}
   ```

### StatBroadcast Pros:
- ✅ Direct from LSU's official source
- ✅ Likely more real-time during live games
- ✅ No API key required
- ✅ More detailed play-by-play data
- ✅ Same data source LSU uses

### StatBroadcast Cons:
- ❌ No official documentation
- ❌ No guaranteed stability (could change anytime)
- ❌ Only works for games currently in StatBroadcast system
- ❌ Requires finding game IDs manually
- ❌ May only serve data during/around game time
- ❌ Potential rate limiting if detected as a bot
- ❌ LSU-specific (can't easily track other teams)

---

## Recommendation

### For Home Run Tracking Specifically:

**Option 1: Stick with RapidAPI** (Recommended)
- Pros: Stable, documented, already working
- Cons: Potential API costs, slight delay
- Best for: Production reliability

**Option 2: Hybrid Approach** (Advanced)
- Use RapidAPI for game schedule and basic data
- Switch to StatBroadcast during live games for real-time play-by-play
- Fallback to RapidAPI if StatBroadcast fails
- Best for: Maximum real-time accuracy with reliability backup

**Option 3: Pure StatBroadcast** (Risky)
- Pros: Free, most real-time
- Cons: Unstable, undocumented, LSU-only
- Best for: Personal projects with manual monitoring

---

## How to Implement StatBroadcast (If Desired)

### Step 1: Find Game IDs

During baseball season, you can:
1. Visit https://lsusports.statbroadcast.com/
2. Find today's game
3. Click on it to get the game ID from URL: `?id=XXXXXX`

OR use your existing RapidAPI to get game schedule, then manually map to StatBroadcast IDs.

### Step 2: Fetch Live Data

```javascript
async function getStatBroadcastData(gameId) {
  try {
    // Try JSON first
    const jsonUrl = `https://stats.statbroadcast.com/feed/getjson.asp?eventid=${gameId}`;
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': `https://stats.statbroadcast.com/broadcast/?id=${gameId}`
      }
    });

    if (response.ok) {
      return await response.json();
    }

    // Fallback to XML
    const xmlUrl = `https://stats.statbroadcast.com/feed/getxml.asp?eventid=${gameId}`;
    const xmlResponse = await fetch(xmlUrl);
    // Parse XML...

  } catch (error) {
    console.error('StatBroadcast fetch failed:', error);
    return null;
  }
}
```

### Step 3: Poll During Live Games

```javascript
// Poll every 15 seconds during live games
setInterval(async () => {
  const data = await getStatBroadcastData(currentGameId);
  if (data) {
    checkForHomeRuns(data);
  }
}, 15000);
```

---

## Testing Strategy

To properly evaluate StatBroadcast:

1. **Wait for a live LSU game** (baseball season)
2. **Open DevTools** on https://stats.statbroadcast.com/broadcast/?id=XXXXX
3. **Monitor Network tab** to see actual API calls
4. **Compare data quality** with RapidAPI
5. **Test reliability** over multiple games

---

## Questions to Consider

1. **Is RapidAPI costing money?** If it's free or cheap, stay with it.
2. **How real-time do you need?** If 30-second delays are OK, RapidAPI is fine.
3. **Do you track other teams?** If yes, RapidAPI is better (NCAA-wide).
4. **Maintenance effort?** StatBroadcast = more manual work.

---

## Next Steps

### If staying with RapidAPI:
- ✅ You're good! Current implementation works.

### If testing StatBroadcast:
1. ⏰ Wait for LSU baseball season (typically starts mid-February)
2. 🔍 Find a live game on lsusports.statbroadcast.com
3. 🧪 Run `node find-lsu-games-statbroadcast.js` during the game
4. 📊 Compare data quality with RapidAPI
5. 🏗️ Build hybrid system if needed

---

## Files Created for Testing

1. `explore-statbroadcast.js` - Tests common API endpoint patterns
2. `explore-statbroadcast-deep.js` - Deep analysis of page structure
3. `find-lsu-games-statbroadcast.js` - Finds current LSU games and tests data access

Run these during a live LSU baseball game for best results!
