/**
 * Analyze home/away indicators in StatBroadcast data
 */

const puppeteer = require('puppeteer');

async function analyzeHomeAway(gameId) {
  let browser;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Analyzing home/away indicators for game: ${gameId}`);
    console.log('='.repeat(60) + '\n');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = `https://stats.statbroadcast.com/broadcast/?id=${gameId}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Click Scoring tab
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
      const scoringTab = links.find(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('scoring') && !text.includes('card');
      });
      if (scoringTab) scoringTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n');

      const result = {
        title: document.title || '',
        scoreTable: [],
        topInningPlays: [],
        bottomInningPlays: [],
        tabLabels: [],
        otherIndicators: []
      };

      // Look for score table (shows team order)
      let foundScoreTable = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Score table header
        if (line.includes('TEAM') && line.includes('R') && line.includes('H') && line.includes('E')) {
          foundScoreTable = true;
          result.scoreTable.push('HEADER: ' + line);
          // Next few lines should be team scores
          for (let j = 1; j <= 3; j++) {
            if (lines[i + j]) {
              result.scoreTable.push(lines[i + j].trim());
            }
          }
          break;
        }
      }

      // Find scoring plays with Top/Bot indicators
      lines.forEach(line => {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        if ((lower.startsWith('top ') || lower.startsWith('bot ')) && trimmed.length > 20) {
          if (lower.startsWith('top ')) {
            result.topInningPlays.push(trimmed);
          } else {
            result.bottomInningPlays.push(trimmed);
          }
        }

        // Look for "Home" or "Visitor" labels
        if (lower.includes('home stats') || lower.includes('visitor stats') ||
            lower.includes('home team') || lower.includes('away team') ||
            lower.includes('visiting')) {
          result.otherIndicators.push(trimmed);
        }
      });

      // Check tab/button labels
      const buttons = document.querySelectorAll('button, [role="tab"]');
      buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Home') || text.includes('Visitor') || text.includes('Away')) {
          result.tabLabels.push(text);
        }
      });

      return result;
    });

    console.log('📊 SCORE TABLE (teams listed in order):');
    console.log('='.repeat(60));
    analysis.scoreTable.forEach(line => console.log(line));
    console.log('\nNOTE: Typically first team = away, second team = home\n');

    console.log('🔼 TOP INNING PLAYS (Away team batting):');
    console.log('='.repeat(60));
    analysis.topInningPlays.slice(0, 5).forEach(play => console.log(play));
    if (analysis.topInningPlays.length > 5) {
      console.log(`... (${analysis.topInningPlays.length - 5} more)`);
    }
    console.log();

    console.log('🔽 BOTTOM INNING PLAYS (Home team batting):');
    console.log('='.repeat(60));
    analysis.bottomInningPlays.slice(0, 5).forEach(play => console.log(play));
    if (analysis.bottomInningPlays.length > 5) {
      console.log(`... (${analysis.bottomInningPlays.length - 5} more)`);
    }
    console.log();

    console.log('🏷️  TAB LABELS:');
    console.log('='.repeat(60));
    if (analysis.tabLabels.length > 0) {
      analysis.tabLabels.forEach(label => console.log(label));
    } else {
      console.log('(none found)');
    }
    console.log();

    console.log('🔍 OTHER INDICATORS:');
    console.log('='.repeat(60));
    if (analysis.otherIndicators.length > 0) {
      analysis.otherIndicators.forEach(ind => console.log(ind));
    } else {
      console.log('(none found)');
    }
    console.log();

    console.log('💡 DETERMINATION:');
    console.log('='.repeat(60));
    console.log('Based on Top/Bottom inning plays:');
    console.log(`- Team batting in TOP innings: ${analysis.topInningPlays.length > 0 ? 'Check plays above' : 'Unknown'}`);
    console.log(`- Team batting in BOTTOM innings: ${analysis.bottomInningPlays.length > 0 ? 'Check plays above' : 'Unknown'}`);
    console.log('\nIn this game:');
    console.log('- LSU appears in Top inning plays = LSU is AWAY');
    console.log('- IND appears in Bottom inning plays = IND is HOME');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const gameId = process.argv[2] || '651253';
analyzeHomeAway(gameId).then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
