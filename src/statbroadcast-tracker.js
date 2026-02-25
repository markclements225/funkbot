/**
 * StatBroadcast Home Run Tracker using Puppeteer
 *
 * This module uses Puppeteer to fetch and parse live game data from StatBroadcast.
 * It replaces the RapidAPI implementation for more real-time data.
 */

const puppeteer = require('puppeteer');

/**
 * Get all LSU game IDs from LSU's official schedule
 * These IDs are available weeks in advance
 */
async function getAllLSUGameIDs() {
  try {
    console.log('📅 Fetching LSU game schedule...');

    const response = await fetch('https://lsusports.net/sports/baseball/schedule');
    const html = await response.text();

    // Extract all StatBroadcast game IDs from the schedule
    const matches = html.matchAll(/stats\.statbroadcast\.com\/broadcast\/\?id=(\d+)/g);
    const gameIds = [...new Set([...matches].map(m => m[1]))];

    console.log(`✅ Found ${gameIds.length} LSU games in schedule`);
    return gameIds;

  } catch (error) {
    console.error('❌ Error fetching game IDs:', error.message);
    return [];
  }
}

/**
 * Get today's or recent LSU game IDs
 * Uses a config file for manual game IDs, otherwise checks today's date in schedule
 */
async function getTodaysGameIDs() {
  try {
    console.log('📅 Checking for LSU games to monitor...');

    const fs = require('fs');
    const path = require('path');

    // Load the schedule file (ONLY source of truth)
    const schedulePath = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');

    if (!fs.existsSync(schedulePath)) {
      console.log('   ⚠️  Schedule file not found');
      console.log('   💡 TIP: Create config/lsu-schedule-2026.json');
      return [];
    }

    console.log('   🔍 Checking schedule for today\'s games');

    const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find games for today
    const todaysGames = schedule
      .filter(game => game.date === todayStr)
      .map(game => game.gameId);

    if (todaysGames.length > 0) {
      console.log(`   ✅ Found ${todaysGames.length} game(s) scheduled for today (${todayStr})`);
      console.log(`   📊 Will monitor: ${todaysGames.join(', ')}`);
      return todaysGames;
    }

    // No games today
    console.log(`   ⚠️  No games scheduled for ${todayStr}`);
    return [];

  } catch (error) {
    console.error('❌ Error getting games:', error);
    return [];
  }
}

/**
 * Launch browser with optimized settings for Railway/production
 */
async function launchBrowser() {
  const isProduction = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';

  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-software-rasterizer'
    ]
  };

  // On Railway/production, use system Chromium if available
  if (isProduction && process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    console.log('🔧 Using system Chromium:', options.executablePath);
  }

  // On Railway, use single-process mode to reduce memory
  if (isProduction) {
    options.args.push('--single-process');
  }

  return await puppeteer.launch(options);
}

/**
 * Get game data from StatBroadcast using Puppeteer
 */
async function getGameData(gameId) {
  let browser;

  try {
    console.log(`\n🌐 Fetching game ${gameId} from StatBroadcast...`);

    browser = await launchBrowser();
    const page = await browser.newPage();

    // Block unnecessary resources to speed up loading and reduce memory
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'font', 'stylesheet', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set a user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Navigate to the game page
    const url = `https://stats.statbroadcast.com/broadcast/?id=${gameId}`;
    console.log(`   Loading: ${url}`);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for the page to decode and render data
    console.log('   ⏳ Waiting for data to load...');
    await new Promise(resolve => setTimeout(resolve, 4000)); // Give it 4 seconds to decode

    // Try to click on the "Scoring Plays" tab to get detailed play-by-play
    console.log('   📋 Clicking Scoring Plays tab...');
    try {
      // Look for link/button with "Scoring" or "Scoring Plays" text
      const scoringTabClicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
        const scoringTab = links.find(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('scoring') && !text.includes('card');
        });

        if (scoringTab) {
          scoringTab.click();
          return true;
        }
        return false;
      });

      if (scoringTabClicked) {
        console.log('   ✅ Clicked Scoring Plays tab, waiting for content...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for tab content to load
      } else {
        console.log('   ⚠️  Scoring Plays tab not found, using main page');
      }
    } catch (error) {
      console.log('   ⚠️  Could not click Scoring Plays tab:', error.message);
    }

    // Extract game data from the page
    const gameData = await page.evaluate(() => {
      const result = {
        title: document.title || '',
        homeRuns: [],
        plays: [],
        score: '',
        inning: '',
        teams: { home: '', away: '' },
        status: '',
        rawText: document.body.innerText,
        lsuIsHome: null // Will be determined below
      };

      // Try to extract team names from title or page
      const titleMatch = result.title.match(/([^-]+)\s*-\s*([^-]+)/);
      if (titleMatch) {
        result.teams.home = titleMatch[1]?.trim() || '';
        result.teams.away = titleMatch[2]?.trim() || '';
      }

      // DETECT HOME/AWAY: Check which tab is labeled "Home Stats"
      const allText = document.body.innerText;
      const lines = allText.split('\n');

      // Method 1: Check score table order (first team = away, second = home)
      // This is the most reliable method
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Look for score table
        if (line.includes('TEAM') && line.includes('R') && line.includes('H') && line.includes('E')) {
          // Next lines should be team scores
          const nextLine = lines[i + 1]?.trim() || '';
          const secondLine = lines[i + 2]?.trim() || '';

          if (nextLine.toLowerCase().startsWith('lsu')) {
            result.lsuIsHome = false; // LSU listed first = away
            break;
          } else if (secondLine.toLowerCase().startsWith('lsu')) {
            result.lsuIsHome = true; // LSU listed second = home
            break;
          }
        }
      }

      // Method 2: Check Top/Bottom inning plays as fallback
      if (result.lsuIsHome === null) {
        let lsuInTopCount = 0;
        let lsuInBottomCount = 0;

        lines.forEach(line => {
          const lower = line.toLowerCase();
          if ((lower.startsWith('top ') || lower.startsWith('bot ')) && lower.includes('lsu')) {
            if (lower.startsWith('top ')) lsuInTopCount++;
            else lsuInBottomCount++;
          }
        });

        if (lsuInTopCount > lsuInBottomCount) {
          result.lsuIsHome = false; // More Top plays = away
        } else if (lsuInBottomCount > lsuInTopCount) {
          result.lsuIsHome = true; // More Bottom plays = home
        }
      }

      // Search entire page text for home runs (using allText and lines already defined above)
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        // Look for home run mentions - check for "home run", "homers", or "HR" abbreviation
        // The regex \bhr\b matches "HR" as a whole word (not part of other words like "three")
        const hasHomeRun = lower.includes('home run') ||
                          lower.includes('homers') ||
                          /\bhr\b/i.test(trimmed) ||  // Matches "HR" as whole word
                          lower.includes('homered');

        if (hasHomeRun && trimmed.length > 10 && trimmed.length < 300) {
          result.homeRuns.push({
            text: trimmed,
            lineNumber: idx,
            context: {
              before: lines[idx - 1]?.trim() || '',
              after: lines[idx + 1]?.trim() || ''
            }
          });
        }

        // Store all substantial lines as plays
        if (trimmed.length > 15 && trimmed.length < 200) {
          result.plays.push(trimmed);
        }
      });

      // Try to find score
      const scoreElements = document.querySelectorAll('[class*="score"], [data-score]');
      if (scoreElements.length > 0) {
        result.score = scoreElements[0].textContent.trim();
      }

      // Try to find inning
      const inningElements = document.querySelectorAll('[class*="inning"], [data-inning]');
      if (inningElements.length > 0) {
        result.inning = inningElements[0].textContent.trim();
      }

      return result;
    });

    console.log(`   ✅ Extracted ${gameData.homeRuns.length} home run(s)`);
    console.log(`   📝 Found ${gameData.plays.length} plays`);
    console.log(`   🏠 LSU is ${gameData.lsuIsHome === true ? 'HOME' : gameData.lsuIsHome === false ? 'AWAY' : 'UNKNOWN'} team`);

    return gameData;

  } catch (error) {
    console.error(`❌ Error fetching game ${gameId}:`, error.message);
    return null;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Check if a home run text is from LSU
 * Uses multiple detection methods WITHOUT hardcoded roster
 */
function isLSUHomeRun(homeRunText, context = {}, allGameText = '', lsuIsHome = null) {
  const lower = homeRunText.toLowerCase();

  // Method 0: Check if this is from Scoring Plays tab (starts with inning indicator)
  // Use lsuIsHome to determine which inning LSU bats in
  if (lsuIsHome !== null) {
    if (lower.startsWith('bot ') || lower.startsWith('bottom ')) {
      return lsuIsHome === true; // Bottom = home team
    }
    if (lower.startsWith('top ')) {
      return lsuIsHome === false; // Top = away team
    }
  } else {
    // Fallback: assume LSU is home (old behavior)
    if (lower.startsWith('bot ') || lower.startsWith('bottom ')) {
      return true;
    }
    if (lower.startsWith('top ')) {
      return false;
    }
  }

  // Method 1: Direct LSU keywords
  const lsuKeywords = ['lsu', 'tigers', 'tiger', 'bengals', 'baton rouge'];
  const hasLSU = lsuKeywords.some(keyword => lower.includes(keyword));

  // Method 2: Check for opponent keywords (exclude these)
  // Make this more comprehensive to catch any opponent
  const opponentKeywords = ['mke', 'milwaukee', 'nicholls', 'opponent', 'visitor', 'away team', 'away', 'visiting'];
  const isOpponent = opponentKeywords.some(keyword => lower.includes(keyword));

  // Method 3: Check context lines for LSU indicators
  const contextText = ((context.before || '') + ' ' + (context.after || '')).toLowerCase();
  const hasLSUContext = lsuKeywords.some(keyword => contextText.includes(keyword));

  // Method 4: Smart detection - find which team's batting section this HR appears in
  if (allGameText) {
    const gameLines = allGameText.split('\n');

    // Find where this HR text appears in the full game text
    let hrLineIndex = -1;
    for (let i = 0; i < gameLines.length; i++) {
      if (gameLines[i].trim() === homeRunText.trim()) {
        hrLineIndex = i;
        break;
      }
    }

    if (hrLineIndex > -1) {
      // Look backwards to find the nearest "Batting Order" or "Offensive Leaders" header
      for (let i = hrLineIndex; i >= Math.max(0, hrLineIndex - 30); i--) {
        const line = gameLines[i].toLowerCase();

        // If we find LSU batting section, it's LSU
        if (line.includes('lsu batting') || line.includes('lsu offensive')) {
          return true;
        }

        // If we find opponent batting section first, it's NOT LSU
        if ((line.includes('batting') || line.includes('offensive')) &&
            !line.includes('lsu')) {
          return false;
        }
      }
    }
  }

  // Method 5: If it's in a stats table header row (has "IP H R ER BB K HR"), exclude it
  if (lower.includes('\tip\t') || lower.includes('ip\th\tr\ter') || lower.includes('today\tip')) {
    return false;
  }

  // If it's explicitly opponent, exclude it
  if (isOpponent) return false;

  // If it has LSU keywords or context, it's LSU
  return hasLSU || hasLSUContext;
}

/**
 * Get LSU home runs from multiple games
 */
async function checkForLSUHomeRuns(gameIds) {
  try {
    const allHomeRuns = [];

    for (const gameId of gameIds) {
      const gameData = await getGameData(gameId);

      if (!gameData) {
        console.log(`   ⚠️ No data for game ${gameId}`);
        continue;
      }

      // Filter for LSU home runs (pass full game text for better detection)
      const lsuHomeRuns = gameData.homeRuns.filter(hr =>
        isLSUHomeRun(hr.text, hr.context, gameData.rawText, gameData.lsuIsHome)
      );

      if (lsuHomeRuns.length > 0) {
        console.log(`   🔥 Found ${lsuHomeRuns.length} LSU home run(s) in game ${gameId}`);

        lsuHomeRuns.forEach(hr => {
          allHomeRuns.push({
            gameId,
            text: hr.text,
            context: hr.context,
            timestamp: Date.now()
          });
        });
      }

      // Small delay between games to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allHomeRuns;

  } catch (error) {
    console.error('Error checking for home runs:', error);
    return [];
  }
}

module.exports = {
  getAllLSUGameIDs,
  getTodaysGameIDs,
  getGameData,
  checkForLSUHomeRuns,
  isLSUHomeRun
};
