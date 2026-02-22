#!/usr/bin/env node

/**
 * Scrape LSU Sports schedule page and build accurate schedule JSON
 * Usage: node scripts/build-schedule.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeSchedule() {
  let browser;

  try {
    console.log('🔍 Scraping LSU Baseball schedule from lsusports.net...\n');

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

      // Get all Live Stats links with game IDs
      const statLinks = [];
      document.querySelectorAll('a[href*="statbroadcast.com"]').forEach(a => {
        const match = a.href.match(/id=(\d+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          statLinks.push({
            gameId: match[1],
            link: a
          });
        }
      });

      // For each game ID, try to find associated game information
      statLinks.forEach(({gameId, link}) => {
        try {
          // Walk up DOM tree to find game container
          let container = link;
          for (let i = 0; i < 10; i++) {
            container = container.parentElement;
            if (!container) break;

            // Check if this container has game info
            const containerText = container.innerText || '';

            // Look for date patterns (Feb 22, 2/22, etc.)
            const dateMatch = containerText.match(/(Mon\.|Tue\.|Wed\.|Thu\.|Fri\.|Sat\.|Sun\.)\s*\n?\s*(Jan|Feb|Mar|Apr|May)\s+\d+/i);

            if (dateMatch) {
              const lines = containerText.split('\n').map(l => l.trim()).filter(l => l);

              let date = '';
              let opponent = '';
              let location = '';
              let time = '';

              // Extract info from lines
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Date line (e.g., "Fri. Feb 13")
                if (line.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.\s*(Jan|Feb|Mar|Apr|May)/i)) {
                  date = line;
                }

                // Opponent (usually all caps or title case team name)
                if (line.match(/^[A-Z][A-Z\s]+$/)) {
                  opponent = line;
                }

                // Location (contains parentheses)
                if (line.includes('(') && line.includes(')')) {
                  location = line;
                }

                // Time (ends with "pm CT" or "am CT")
                if (line.match(/\d+:\d+\s*(am|pm)\s*CT/i)) {
                  time = line;
                }
              }

              if (date || opponent) {
                results.push({
                  gameId,
                  date,
                  opponent,
                  location,
                  time
                });
              }

              break; // Found the container, stop walking up
            }
          }
        } catch (err) {
          // Skip on error
        }
      });

      return results;
    });

    console.log(`✅ Found ${games.length} games with StatBroadcast links\n`);

    if (games.length === 0) {
      console.log('⚠️  No games found. The page structure might have changed.');
      console.log('   Check https://lsusports.net/sports/bsb/schedule/ manually\n');
      return;
    }

    // Parse dates and location to standard format
    const parsedGames = games.map(game => {
      let parsedDate = game.date;

      // Try to parse common date formats
      try {
        // Check if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(game.date)) {
          parsedDate = game.date;
        } else {
          // Add year 2026 if not present
          let dateStr = game.date.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.\s*/i, '').trim();
          if (!dateStr.includes('2026')) {
            dateStr += ' 2026';
          }
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            parsedDate = dateObj.toISOString().split('T')[0];
          }
        }
      } catch (err) {
        // Keep original if parsing fails
      }

      // Parse location into city and venue
      let city = '';
      let venue = '';
      if (game.location) {
        const locMatch = game.location.match(/^([^(]+)\s*\(([^)]+)\)/);
        if (locMatch) {
          city = locMatch[1].trim();
          venue = locMatch[2].trim();
        } else {
          city = game.location;
        }
      }

      return {
        gameId: game.gameId,
        date: parsedDate,
        opponent: game.opponent,
        city: city,
        venue: venue,
        time: game.time
      };
    });

    // Sort by date
    parsedGames.sort((a, b) => a.date.localeCompare(b.date));

    // Show preview
    console.log('📋 Schedule Preview (first 5 games):\n');
    parsedGames.slice(0, 5).forEach(game => {
      console.log(`${game.date} | ${game.opponent}`);
      console.log(`   Location: ${game.city}${game.venue ? ' (' + game.venue + ')' : ''}`);
      console.log(`   Time: ${game.time || 'TBD'}`);
      console.log(`   Game ID: ${game.gameId}`);
      console.log(`   URL: https://stats.statbroadcast.com/broadcast/?id=${game.gameId}`);
      console.log();
    });

    // Save to file
    const scheduleFile = path.join(__dirname, '..', 'config', 'lsu-schedule-2026.json');
    fs.writeFileSync(scheduleFile, JSON.stringify(parsedGames, null, 2));

    console.log(`✅ Schedule saved to ${scheduleFile}`);
    console.log(`📊 Total games: ${parsedGames.length}\n`);

  } catch (error) {
    console.error('❌ Error scraping schedule:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

scrapeSchedule();
