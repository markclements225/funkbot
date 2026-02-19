# 🔍 Deployment Troubleshooting - No GroupMe Message

## **Issue: Deployment succeeded but no GroupMe message**

Follow these steps in order:

---

## **Step 1: Check Railway Logs**

1. Go to your Railway project
2. Click on your deployment
3. Click **"Deployments"** tab
4. Click on the latest deployment
5. View the **logs**

**Look for these messages:**

### ✅ **Success Indicators:**
```
✅ Server listening on port XXXX
✅ All required environment variables present
🎉 ALL SYSTEMS ONLINE!
✅ Posted deployment success message to GroupMe!
```

### ❌ **Error Indicators:**
```
❌ Missing required environment variables: GROUPME_BOT_ID
❌ Failed to post deployment message: [error details]
Error posting to GroupMe: [error details]
```

**What to do:**
- If you see `✅ Posted deployment success message` → Issue is with GroupMe, go to Step 3
- If you see `❌ Failed to post` → Check the error message, go to Step 2
- If you see `❌ Missing required` → Go to Step 2

---

## **Step 2: Verify Environment Variables**

In Railway:
1. Go to your deployment
2. Click **"Variables"** tab
3. Check these are set:

### **Required Variables:**
- `GROUPME_BOT_ID` ← **MUST be set**
- `PERPLEXITY_API_KEY`

### **How to check GROUPME_BOT_ID:**

1. **Go to GroupMe Dev Portal:** https://dev.groupme.com/bots
2. **Find your bot**
3. **Copy the Bot ID** (long string of letters/numbers)
4. **Compare with Railway variable**
   - Should match exactly
   - No spaces before/after
   - All characters included

### **If Variable is Wrong:**
1. Delete the variable in Railway
2. Re-add it with correct value
3. **Redeploy** (Railway should auto-redeploy, or click "Deploy")

---

## **Step 3: Check GroupMe Bot Status**

1. **Go to GroupMe App**
2. **Go to the group** where bot should post
3. **Check bot is in the group:**
   - Look for bot name in members list
   - If not there, bot was removed

4. **Go to Dev Portal:** https://dev.groupme.com/bots
   - Make sure bot still exists
   - Make sure bot is assigned to correct group
   - Check bot is not disabled

---

## **Step 4: Test Manually**

Add a test endpoint to verify GroupMe posting works:

**Check Railway logs for this:**
```
📤 Posting to GroupMe...
Message: 🚀 FunkBot has been deployed...
Bot ID: [your bot id]
GroupMe response status: 202
✅ Successfully posted to GroupMe!
```

**If you see:**
- `202` status → Success! Check GroupMe app
- `4XX` status → Bot ID wrong or bot doesn't exist
- `5XX` status → GroupMe service issue
- Network error → Railway can't reach GroupMe

---

## **Step 5: Common Issues & Fixes**

### **Issue: "Missing required environment variables"**
**Fix:** Add GROUPME_BOT_ID in Railway Variables tab

### **Issue: "GroupMe response status: 404"**
**Fix:**
- Bot ID is wrong
- Bot was deleted
- Create new bot or fix ID

### **Issue: "GroupMe response status: 401/403"**
**Fix:**
- Bot doesn't have permission
- Bot was removed from group
- Re-add bot to group

### **Issue: Logs show success but no message in GroupMe**
**Fix:**
- Check correct group (bot might be in different group)
- Check GroupMe app is updated
- Check you're looking at right chat
- Bot might be muted

### **Issue: "ENOTFOUND" or network error**
**Fix:**
- Railway network issue (rare)
- Try redeploying
- Check Railway status page

---

## **Step 6: Quick Test - Manual Deployment Message**

If you want to test immediately without redeploying:

1. **In Railway, go to your deployment**
2. **Open a shell/terminal** (if Railway provides one)
3. Or **redeploy** to trigger the deployment message again

**To redeploy:**
- Go to Railway project
- Click "Deploy" or "Redeploy"
- Should post deployment message

---

## **Step 7: Check Your .env File Locally**

Compare your local .env with Railway variables:

**Local .env should have:**
```
GROUPME_BOT_ID=your_actual_bot_id
```

**Railway should have same value**

---

## **Quick Checklist:**

- [ ] Railway deployment succeeded (build complete)
- [ ] Railway logs show "ALL SYSTEMS ONLINE"
- [ ] Railway logs show "Posted deployment success message"
- [ ] GROUPME_BOT_ID variable is set in Railway
- [ ] Bot ID matches between Railway and GroupMe Dev Portal
- [ ] Bot is still in the GroupMe group
- [ ] Bot hasn't been deleted or disabled
- [ ] Looking at correct GroupMe chat

---

## **Still Not Working?**

**Share these details:**
1. What Railway logs show (copy/paste relevant lines)
2. Does GROUPME_BOT_ID show in Railway Variables?
3. Is bot in the GroupMe group member list?
4. Any error messages in logs?

---

## **Most Likely Causes (in order):**

1. **GROUPME_BOT_ID not set in Railway** (80% of cases)
2. **Bot ID is incorrect** (10% of cases)
3. **Bot was removed from group** (5% of cases)
4. **Looking at wrong GroupMe chat** (3% of cases)
5. **Other issues** (2% of cases)

---

## **Next Steps After Fixing:**

Once you see the deployment message:
1. ✅ Bot is working
2. Wait for next LSU game day
3. Should post game alert at 8:00 AM CST
4. Should track home runs during game

**Let me know what you find in the Railway logs!**
