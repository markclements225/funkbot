# 🚀 Railway Deployment Guide

## ✅ PRE-DEPLOYMENT CHECKLIST

All systems ready:
- ✅ Code organized and tested
- ✅ Dockerfile configured
- ✅ package.json correct
- ✅ Environment variables documented
- ✅ .gitignore configured

---

## 📋 STEP-BY-STEP DEPLOYMENT

### **Step 1: Commit Your Code**

```bash
# Check git status
git status

# Add all changes
git add .

# Commit
git commit -m "Deploy FunkBot v2.0 - Enhanced system with RapidAPI + StatBroadcast"

# Push to GitHub
git push origin main
```

---

### **Step 2: Create Railway Project**

1. Go to https://railway.app/
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select the **`funk-bot`** repository
6. Click **"Deploy"**

Railway will automatically:
- Detect the Dockerfile
- Build the container
- Deploy the app

---

### **Step 3: Set Environment Variables**

In Railway project settings, add these variables:

#### **Required Variables:**
```
GROUPME_BOT_ID=your_bot_id_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

#### **Optional Variables (for rich game alerts):**
```
RAPIDAPI_KEY=your_rapidapi_key_here
LSU_TEAM_ID=10291565
```

**To add variables:**
1. Click on your deployment
2. Go to **"Variables"** tab
3. Click **"Add Variable"**
4. Add each variable name and value
5. Click **"Add"**

---

### **Step 4: Verify Deployment**

After deployment completes:

1. **Check Logs:**
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - View logs for:
     ```
     ✅ Server listening on port XXXX
     🎉 ALL SYSTEMS ONLINE!
     ```

2. **Check GroupMe:**
   - Should receive deployment success message:
     ```
     🚀 FunkBot has been deployed successfully! All systems are
     FUNKY and ready to track LSU home runs! 🐯⚾
     ```

3. **Test Health Check:**
   - Railway will provide a URL (e.g., `https://funkbot.up.railway.app`)
   - Visit URL in browser
   - Should see: "🤖 FunkBot Master Server v2.0 - All Systems Online! 🐯⚾🤖"

---

### **Step 5: Monitor First Run**

The system will:

1. **Startup (immediately):**
   - Post deployment success to GroupMe
   - Run initial game check (doesn't post)

2. **Daily at 8:00 AM CST:**
   - Check for today's games
   - Post game day alert
   - Schedule monitoring

3. **During Game:**
   - Start monitoring 5 min before first pitch
   - Check for HRs every 60 seconds
   - Stop 5 min after game Final

---

## 🔍 TROUBLESHOOTING

### **No Deployment Success Message?**
- Check Railway logs for errors
- Verify GROUPME_BOT_ID is correct
- Check GroupMe bot is active

### **Deployment Failed?**
- Check Railway build logs
- Verify Dockerfile is present
- Ensure all dependencies in package.json

### **Bot Not Posting?**
- Check environment variables are set
- View Railway logs for errors
- Verify GroupMe bot has permission to post

### **RapidAPI Not Working?**
- System will fall back to basic alerts
- Check RAPIDAPI_KEY is correct
- Verify LSU_TEAM_ID is set

---

## 📊 WHAT TO EXPECT

### **This Weekend (Testing):**

**Saturday/Sunday Game Day:**
1. **8:00 AM CST** - Game day alert posted
   - With RapidAPI: Full info (time, location, records)
   - Without: Basic (opponent only)

2. **~5:55 PM CST** - Monitoring starts (5 min before game)

3. **During Game** - Home runs posted as they happen
   ```
   🎉 LSU HOME RUN! 🟣🟡

   Player FUNKBLAST!!! The Tigers score X runs on the
   home run to left field!!! LETS GET FUNKY!!!

   📸 [FunkBlastoise.jpg attached]
   ```

4. **~9:05 PM CST** - Monitoring stops (5 min after Final)

---

## 🛠️ POST-DEPLOYMENT

### **Monitor the Logs:**
Check Railway logs to see:
- Game detection working
- RapidAPI calls succeeding/failing
- Home run detection working
- Monitoring start/stop times

### **After First Game:**
Evaluate:
- Did game alert have all info you wanted?
- Did monitoring start at right time?
- Were all home runs detected?
- Did monitoring stop after game?

### **Make Adjustments:**
Can tweak:
- Message formats
- Timing buffers (currently 5 min)
- Fallback behavior
- Any other feature

---

## 🔄 REDEPLOYMENT

To deploy changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Railway will automatically:
- Detect the push
- Rebuild the container
- Deploy the new version
- Post new deployment success message

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:
- ✅ Railway build completes
- ✅ Health check returns 200
- ✅ Deployment success message in GroupMe
- ✅ No errors in Railway logs
- ✅ Server shows "ALL SYSTEMS ONLINE"

---

## 📞 SUPPORT

If issues arise:
1. Check Railway logs first
2. Verify environment variables
3. Test locally: `npm start`
4. Check .env file matches Railway vars

---

## 🚀 READY TO DEPLOY!

Follow the steps above and you'll be live in ~5 minutes!

**Good luck with the first game this weekend! 🐯⚾**
