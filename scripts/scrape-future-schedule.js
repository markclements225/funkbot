#!/usr/bin/env node

/**
 * Scrape LSU Baseball schedule - FUTURE GAMES ONLY
 * Starting from Feb 27, 2026
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeFutureSchedule() {
  let browser;

  try {
    console.log('🔍 Scraping LSU Baseball future schedule (Feb 27+)...\n');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://lsusports.net/sports/bsb/schedule/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const games = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      // Get all StatBroadcast links
      const statLinks = document.querySelectorAll('a[href*="statbroadcast.com"]');

      statLinks.forEach(link => {
        try {
          const href = link.href;
          const match = href.match(/id=(\d+)/);
          if (!match || seen.has(match[1])) return;

          const gameId = match[1];
          seen.add(gameId);

          // Walk up DOM to find game container
          let container = link;
          for (let i = 0; i < 20; i++) {
            container = container.parentElement;
            if (!container) break;

            const containerText = container.innerText || '';

            // Look for date pattern
            const dateMatch = containerText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.\s*(Feb|Mar|Apr|May)\s+(\d+)/i);

            if (dateMatch) {
              const month = dateMatch[2];
              const day = parseInt(dateMatch[3]);

              // Only include Feb 27+ and March onwards
              const isFuture = (month === 'Feb' && day >= 27) ||
                               ['Mar', 'Apr', 'May'].includes(month);

              if (!isFuture) {
                break; // Skip past games
              }

              const lines = containerText.split('\n').map(l => l.trim()).filter(l => l);

              let date = '';
              let opponent = '';
              let location = '';
              let ballpark = '';
              let home = null;

              // Parse each line
              for (let j = 0; j < lines.length; j++) {
                const line = lines[j];

                // Date line
                if (line.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.\s*(Feb|Mar|Apr|May)\s+\d+/i)) {
                  date = line.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.\s*/i, '').trim();
                }

                // Check for VS or @ to find opponent
                if (line.match(/^VS\.?\s+(.+)/i)) {
                  opponent = line.replace(/^VS\.?\s+/i, '').trim();
                  home = true;
                } else if (line.match(/^@\s+(.+)/i) || line.match(/^AT\s+(.+)/i)) {
                  opponent = line.replace(/^(@|AT)\s+/i, '').trim();
                  home = false;
                }

                // If opponent is still empty and we see a team-like name, use it
                if (!opponent && line.match(/^[A-Z][A-Za-z\s\-&]+$/) &&
                    !line.match(/BOX SCORE|RECAP|LIVE STATS|SEC NETWORK|PRESENTED|LISTEN|RADIO|TV|UPCOMING|PAST/i) &&
                    line.length > 2 && line.length < 50) {
                  opponent = line;
                }

                // Location with ballpark
                if (line.includes('(') && line.includes(')')) {
                  const locMatch = line.match(/^([^(]+)\s*\(([^)]+)\)/);
                  if (locMatch) {
                    location = locMatch[1].trim();
                    ballpark = locMatch[2].trim();

                    // Infer home/away from location if not already set
                    if (home === null) {
                      if (location.toLowerCase().includes('baton rouge') ||
                          ballpark.toLowerCase().includes('alex box')) {
                        home = true;
                      } else {
                        home = false;
                      }
                    }
                  }
                }
              }

              // Clean up opponent name
              if (opponent) {
                // Remove common noise words
                opponent = opponent.replace(/\s+(LISTEN LIVE|LIVE STATS|BOX SCORE|RECAP).*$/i, '').trim();

                // If opponent still looks wrong, skip this game
                if (opponent.match(/LIVE|STATS|SCORE|RECAP/i)) {
                  opponent = '';
                }
              }

              if (date && opponent && gameId && location) {
                results.push({
                  date,
                  opponent,
                  location,
                  ballpark,
                  home,
                  gameId
                });
              }

              break; // Found container
            }
          }
        } catch (err) {
          // Skip on error
        }
      });

      return results;
    });

    console.log(`✅ Found ${games.length} future games\n`);

    if (games.length === 0) {
      console.log('⚠️  No future games found.');
      return;
    }

    // Parse dates to YYYY-MM-DD format
    const parsedGames = games.map(game => {
      let parsedDate = game.date;

      try {
        let dateStr = game.date;
        if (!dateStr.includes('2026')) {
          dateStr += ' 2026';
        }
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          parsedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (err) {
        // Keep original
      }

      return {
        date: parsedDate,
        opponent: game.opponent,
        home: game.home !== null ? game.home : true,
        location: game.location || '',
        ballpark: game.ballpark || '',
        gameId: game.gameId
      };
    });

    // Sort by date
    parsedGames.sort((a, b) => a.date.localeCompare(b.date));

    // Show preview
    console.log('📋 Schedule Preview:\n');
    parsedGames.slice(0, 15).forEach(game => {
      console.log(`${game.date} | ${game.home ? 'vs' : '@'} ${game.opponent}`);
      console.log(`   Location: ${game.location}${game.ballpark ? ' (' + game.ballpark + ')' : ''}`);
      console.log(`   Game ID: ${game.gameId}`);
      console.log();
    });

    // Save to file
    const scheduleFile = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
    fs.writeFileSync(scheduleFile, JSON.stringify(parsedGames, null, 2));

    console.log(`✅ Schedule saved to ${scheduleFile}`);
    console.log(`📊 Total future games: ${parsedGames.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

scrapeFutureSchedule();
