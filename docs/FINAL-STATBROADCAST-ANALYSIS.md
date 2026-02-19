# Final StatBroadcast Analysis & Recommendation

## What We Discovered

### ✅ Successfully Found the API Endpoint

Thanks to your network console inspection, we found the real endpoint:
```
https://stats.statbroadcast.com/interface/webservice/stats
```

**Parameters (base64 encoded):**
- `event`: Game ID (632807)
- `xml`: Path to XML file (lsu/632807.xml)
- `xsl`: XSL stylesheet for rendering
- `sport`: bsgame (baseball game)
- `filetime`: Timestamp
- `type`: statbroadcast

### ❌ Data is Proprietary Encoded/Encrypted

The API returns data successfully (200 OK, ~15KB), BUT:
- The data is **encoded/encrypted** with a proprietary format
- It looks like: `CTEcqvOwoTSmpm0vp3EuqUImLzSlVT5iLJEdqKA0VUO0...`
- Standard decompression (gzip, deflate, brotli) doesn't work
- This is custom encoding used by StatBroadcast

### 🔐 How The Browser Decodes It

The browser can display the live game because:
1. StatBroadcast's JavaScript files contain the decoding logic
2. The JavaScript downloads from S3:
   - `StatBroadcast.class.js`
   - `StatUtilities.class.js`
   - `Web.views.js`
3. These files have the proprietary decoder

---

## Options Moving Forward

### Option 1: Stick with RapidAPI (RECOMMENDED ✅)

**Pros:**
- Already working in your codebase
- Documented, stable API
- Clear JSON structure for home runs
- No reverse engineering needed
- Reliable for production use

**Cons:**
- Requires API key (potential cost/rate limits)
- Not as real-time as direct source
- Third-party dependency

**Verdict:** Best for production reliability and maintainability.

---

### Option 2: Reverse Engineer StatBroadcast Decoder (ADVANCED ⚠️)

To decode the StatBroadcast data, you would need to:

1. **Download the JavaScript files:**
   ```
   https://s3.amazonaws.com/s3.statbroadcast.com/js/StatBroadcast.class.js
   https://s3.amazonaws.com/s3.statbroadcast.com/js/StatUtilities.class.js
   ```

2. **Find the decoder function** in the JS code

3. **Reverse engineer or port** the decoder to Node.js

4. **Apply it** to the encoded data

**Pros:**
- Direct from LSU's official source
- Most real-time data possible
- No API key needed
- Free

**Cons:**
- **HIGH EFFORT**: Requires reverse engineering minified JavaScript
- **FRAGILE**: StatBroadcast could change encoding anytime
- **LEGAL GRAY AREA**: Reverse engineering may violate TOS
- **LSU-ONLY**: Wouldn't work for other teams
- **MAINTENANCE BURDEN**: Breaks if they update their code

**Verdict:** Only worth it if:
- You're hitting RapidAPI rate limits/costs
- You need sub-10-second real-time updates
- You're comfortable with reverse engineering
- This is a learning project vs. production system

---

### Option 3: Hybrid Approach (BALANCED 🔄)

Use both APIs with intelligent switching:

```javascript
async function getHomeRunData(gameId) {
  // Try StatBroadcast first (if we have decoder)
  try {
    const sbData = await fetchStatBroadcast(gameId);
    if (sbData && sbData.hasHomeRuns) {
      return sbData;
    }
  } catch (error) {
    console.log('StatBroadcast failed, falling back to RapidAPI');
  }

  // Fallback to RapidAPI (reliable)
  return await fetchRapidAPI(gameId);
}
```

**Pros:**
- Best of both worlds
- Real-time when possible
- Reliable fallback

**Cons:**
- More complex codebase
- Still need to solve the decoder problem
- Maintenance of two systems

---

## Final Recommendation

### For Your Use Case (Home Run Tracking Bot):

**Use RapidAPI** for these reasons:

1. **Already Working**: Your `test-home-run-check.js` already uses it
2. **Play-by-Play Data**: RapidAPI provides `plays` array with home run detection
3. **Reliable**: Documented API won't randomly break
4. **Good Enough Timing**: 30-60 second polling is sufficient for a GroupMe bot
5. **Low Maintenance**: Set it and forget it

### When to Consider StatBroadcast:

Only if ONE of these is true:
- RapidAPI starts costing real money
- RapidAPI removes LSU coverage
- You need under 10-second latency
- This is a learning/research project

---

## Implementation: Stick with RapidAPI

Your current setup in `test-home-run-check.js` is solid:

```javascript
// 1. Get today's LSU games
const games = await fetch(
  `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${today}&league=NCAA`,
  { headers: { 'x-rapidapi-key': RAPIDAPI_KEY } }
);

// 2. Get match details with plays
const details = await fetch(
  `https://mlb-college-baseball-api.p.rapidapi.com/matches/${matchId}`,
  { headers: { 'x-rapidapi-key': RAPIDAPI_KEY } }
);

// 3. Filter for home runs
const homeRuns = details.plays.filter(play =>
  play.type && play.type.toLowerCase().includes('home run')
);
```

### Optimization Suggestions:

1. **Poll every 30 seconds** during live games
2. **Track announced HRs** to avoid duplicates
3. **Cache game IDs** at start of day
4. **Set up error handling** with retry logic

---

## Cost Analysis

### RapidAPI Pricing:
- Check your current plan at https://rapidapi.com
- Free tier usually includes 100-500 requests/day
- Polling every 30 seconds = 120 requests per hour
- For a 3-hour game = 360 requests (within free tier for single game)

### StatBroadcast Cost:
- Free (but requires reverse engineering effort)
- Your time cost: 8-20+ hours to reverse engineer and maintain
- Risk: Could break at any time

---

## What We Built

For your reference, these testing scripts are available:

1. `explore-statbroadcast.js` - Tests common API patterns
2. `explore-statbroadcast-deep.js` - Page analysis
3. `find-lsu-games-statbroadcast.js` - Finds LSU games
4. `test-real-statbroadcast-api.js` - Tests actual endpoint
5. `fetch-statbroadcast-live.js` - Attempts to fetch & decompress
6. `fetch-exact-url.js` - Uses your exact network console URL

**Result**: We can fetch the data, but it's encoded with proprietary format.

---

## Bottom Line

**Keep using RapidAPI.** It's working, it's reliable, and it's the smart choice for a production bot. StatBroadcast would require significant reverse engineering effort for minimal benefit in your use case.

If RapidAPI becomes a problem (cost, reliability, coverage), then revisit StatBroadcast - but for now, the juice isn't worth the squeeze.

---

## Questions?

Run your existing `test-home-run-check.js` during the next LSU game to verify your RapidAPI setup is working correctly. That's all you need!
