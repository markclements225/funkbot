const puppeteer = require('puppeteer');

async function debugGamePage() {
  const gameId = process.argv[2] || '633584';
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://stats.statbroadcast.com/broadcast/?id=${gameId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...\n');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Click Scoring tab
    const scoringClicked = await page.evaluate(() => {
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

    if (scoringClicked) {
      console.log('✅ Clicked Scoring tab\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('⚠️  Could not click Scoring tab\n');
    }

    const data = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n');

      // Find score table
      const scoreTable = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('TEAM') && line.includes('R') && line.includes('H')) {
          scoreTable.push(lines[i].trim());
          scoreTable.push(lines[i + 1]?.trim() || '');
          scoreTable.push(lines[i + 2]?.trim() || '');
          scoreTable.push(lines[i + 3]?.trim() || '');
          break;
        }
      }

      // Find scoring plays
      const scoringPlays = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if ((trimmed.toLowerCase().startsWith('top ') || trimmed.toLowerCase().startsWith('bot ')) && trimmed.length > 20) {
          scoringPlays.push(trimmed);
        }
      });

      // Search for home run mentions
      const hrLines = [];
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();
        if (lower.includes('homered') || lower.includes('home run') || /\bhr\b/i.test(trimmed)) {
          hrLines.push({
            line: trimmed,
            before: lines[idx - 1]?.trim() || '',
            after: lines[idx + 1]?.trim() || ''
          });
        }
      });

      return {
        title: document.title,
        scoreTable,
        scoringPlays,
        hrLines,
        fullText: allText
      };
    });

    console.log('=== PAGE TITLE ===');
    console.log(data.title);
    console.log();

    console.log('=== SCORE TABLE ===');
    if (data.scoreTable.length > 0) {
      data.scoreTable.forEach(line => console.log(line));
    } else {
      console.log('(not found)');
    }
    console.log();

    console.log('=== SCORING PLAYS (Top/Bot) ===');
    if (data.scoringPlays.length > 0) {
      data.scoringPlays.forEach((play, i) => console.log(`${i + 1}. ${play}`));
    } else {
      console.log('(none found)');
    }
    console.log();

    console.log('=== HOME RUN MENTIONS ===');
    if (data.hrLines.length > 0) {
      data.hrLines.forEach((hr, i) => {
        console.log(`\n${i + 1}. ${hr.line}`);
        console.log(`   Before: ${hr.before}`);
        console.log(`   After: ${hr.after}`);
      });
    } else {
      console.log('(none found)');
    }
    console.log();

    // Save full text to file for inspection
    const fs = require('fs');
    const filename = `/tmp/game-${gameId}-full-text.txt`;
    fs.writeFileSync(filename, data.fullText);
    console.log(`✅ Full page text saved to ${filename}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

debugGamePage();
