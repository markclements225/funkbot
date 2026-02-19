# 🚀 Quick Deployment Steps

## **Step 1: Commit & Push to GitHub**

Run these commands:

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Deploy FunkBot v2.0 - Enhanced hybrid system

- Organized code into industry-standard folder structure
- Implemented hybrid RapidAPI + StatBroadcast system
- Rich game alerts with time, location, and records
- Smart monitoring: starts 5 min before game, stops 5 min after Final
- Home run detection with FUNKY messages
- Deployment success notifications
- Graceful fallback if RapidAPI unavailable
- Comprehensive documentation"

# Push to GitHub
git push origin main
```

---

## **Step 2: Deploy to Railway**

1. Go to https://railway.app/
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`funk-bot`** repository
5. Click **"Deploy"**

Railway will automatically detect Dockerfile and deploy!

---

## **Step 3: Add Environment Variables**

In Railway project → Variables tab, add:

### **Required:**
```
GROUPME_BOT_ID=your_bot_id
PERPLEXITY_API_KEY=your_perplexity_key
```

### **Optional (for rich game alerts):**
```
RAPIDAPI_KEY=your_rapidapi_key
LSU_TEAM_ID=10291565
```

---

## **Step 4: Verify Deployment**

1. **Check Railway Logs** for:
   ```
   ✅ Server listening on port XXXX
   🎉 ALL SYSTEMS ONLINE!
   ```

2. **Check GroupMe** for deployment message:
   ```
   🚀 FunkBot has been deployed successfully!
   ```

3. **Visit Railway URL** - Should see:
   ```
   🤖 FunkBot Master Server v2.0 - All Systems Online! 🐯⚾🤖
   ```

---

## **✅ That's It!**

Bot is now live and will:
- Post game alerts at 8:00 AM CST
- Monitor for home runs during games
- Post FUNKY messages for each HR

**Ready for this weekend's games! 🐯⚾**
