# 📁 Folder Structure - Industry Standards

## ✅ NEW ORGANIZED STRUCTURE

```
funk-bot/
├── src/                           # Application source code
│   ├── server.js                  # Main Express server
│   └── statbroadcast-tracker.js   # StatBroadcast scraping module
│
├── config/                        # Configuration files
│   ├── game-config.json           # Manual game ID configuration
│   ├── lsu-schedule-2026.json     # Full LSU baseball schedule with dates
│   └── posted_home_runs.json      # Tracks posted HRs (auto-generated)
│
├── scripts/                       # Utility/helper scripts
│   └── set-todays-game.js         # Manually configure game IDs
│
├── tests/                         # All test files
│   ├── test-current-games.js      # Test current game detection
│   ├── test-date-detection.js     # Test date-based detection
│   ├── test-full-flow.js          # Test complete system flow
│   ├── test-live-scrape.js        # Test live game scraping
│   ├── test-message-formats.js    # Display all message formats
│   └── test-scheduler-behavior.js # Test scheduler logic
│
├── assets/                        # Static assets (images, etc.)
│   └── FunkBlastoise.jpg          # Home run celebration image
│
├── docs/                          # Documentation
│   ├── AUDIT-UNUSED-CODE.md       # Code audit report
│   ├── CHANGES-FINAL-SETUP.md     # Final setup documentation
│   ├── CLEANUP-COMPLETE.md        # Cleanup summary
│   └── FOLDER-STRUCTURE.md        # This file
│
├── archive/                       # Old/backup files
│   ├── archived-old-files/        # 21 old exploration/test files
│   └── backup-rapidapi/           # RapidAPI backup for rollback
│
├── node_modules/                  # Dependencies (gitignored)
│
├── package.json                   # Node.js project configuration
├── package-lock.json              # Dependency lock file
├── Dockerfile                     # Railway deployment config
├── .env                           # Environment variables (gitignored)
├── .gitignore                     # Git ignore rules
└── README.md                      # Project README
```

---

## 📊 COMPARISON

### Before Organization (30 files in root):
```
funk-bot/
├── server.js
├── statbroadcast-tracker.js
├── index.js (old)
├── scheduler.js (old)
├── funkbot-server.js (old)
├── server2.js (old)
├── game-preview.js (old)
├── test-current-games.js
├── test-live-scrape.js
├── test-full-flow.js
├── test-date-detection.js
├── test-scheduler-behavior.js
├── test-message-formats.js
├── check-available-models.js (old)
├── explore-game-data.js (old)
├── explore-statbroadcast.js (old)
├── ... (15+ more old files)
├── set-todays-game.js
├── game-config.json
├── lsu-schedule-2026.json
├── FunkBlastoise.jpg
├── package.json
├── Dockerfile
└── .env
```

### After Organization (9 organized folders):
```
funk-bot/
├── src/          (2 files)  ← Core application
├── config/       (3 files)  ← Configuration
├── scripts/      (1 file)   ← Utility scripts
├── tests/        (6 files)  ← All tests
├── assets/       (1 file)   ← Static files
├── docs/         (4 files)  ← Documentation
├── archive/      (2 folders) ← Old files
├── package.json
├── Dockerfile
└── README.md
```

---

## 🎯 INDUSTRY STANDARDS FOLLOWED

### 1. `/src` - Source Code
Standard for application code that gets deployed
- Main application logic
- Modules and utilities
- No tests or config mixed in

### 2. `/tests` - Test Files
Standard for all test-related files
- Unit tests
- Integration tests
- End-to-end tests
- Separated from source code

### 3. `/scripts` - Utility Scripts
Standard for operational scripts
- Deployment scripts
- Database migrations
- Helper tools
- Not part of main application

### 4. `/config` - Configuration
Standard for configuration files
- Environment-specific configs
- Static data files
- Keeps configs separate from code

### 5. `/assets` - Static Assets
Standard for images, fonts, etc.
- Images
- Icons
- Fonts
- Other static resources

### 6. `/docs` - Documentation
Standard for project documentation
- Architecture docs
- API documentation
- Setup guides
- Change logs

### 7. `/archive` - Old/Backup Files
Not standard, but practical
- Keeps old code for reference
- Can delete when confident
- Prevents clutter in main folders

---

## 📝 PATH UPDATES MADE

### package.json
```json
"main": "src/server.js",
"scripts": {
  "start": "node src/server.js",
  "test-flow": "node tests/test-full-flow.js",
  "test-live": "node tests/test-live-scrape.js",
  "test-messages": "node tests/test-message-formats.js",
  "set-game": "node scripts/set-todays-game.js"
}
```

### Dockerfile
```dockerfile
CMD ["node", "src/server.js"]
```

### src/server.js
```javascript
const statbroadcast = require('./statbroadcast-tracker');
const POSTED_HRS_FILE = './config/posted_home_runs.json';
const imageUrl = await uploadImageToGroupMe('./assets/FunkBlastoise.jpg');
```

### src/statbroadcast-tracker.js
```javascript
const configPath = path.join(__dirname, '..', 'config', 'game-config.json');
const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
```

### scripts/set-todays-game.js
```javascript
const configPath = path.join(__dirname, '..', 'config', 'game-config.json');
```

### tests/*.js
```javascript
const statbroadcast = require('../src/statbroadcast-tracker');
const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
const configPath = path.join(__dirname, '..', 'config', 'game-config.json');
```

---

## ✅ BENEFITS

### 1. **Clarity**
Easy to find files - source code in /src, tests in /tests, etc.

### 2. **Scalability**
Clean structure supports growth - can add more modules to /src, more tests to /tests

### 3. **Industry Standard**
Familiar to other developers - follows Node.js/JavaScript conventions

### 4. **Maintainability**
Easier to maintain - related files grouped together

### 5. **Deployment**
Cleaner deployments - only /src, /config, /assets needed in production

### 6. **Version Control**
Better git history - changes organized by folder purpose

---

## 🚀 READY FOR DEPLOYMENT

All paths updated and tested:
- ✅ npm start works
- ✅ npm run test-messages works
- ✅ All require() paths updated
- ✅ All file paths updated
- ✅ Dockerfile updated
- ✅ .gitignore updated

**Project is now professionally organized and ready to deploy!** 🎉
