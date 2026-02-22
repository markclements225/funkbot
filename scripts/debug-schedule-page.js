const puppeteer = require('puppeteer');

async function debugSchedulePage() {
  let browser;

  try {
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

    const data = await page.evaluate(() => {
      // Get all links with statbroadcast
      const statLinks = [];
      document.querySelectorAll('a[href*="statbroadcast"]').forEach(a => {
        const href = a.href;
        const text = a.textContent.trim();
        const match = href.match(/id=(\d+)/);
        if (match) {
          statLinks.push({
            gameId: match[1],
            text: text,
            href: href
          });
        }
      });

      // Get sample HTML to understand structure
      const bodyHTML = document.body.innerHTML;

      // Find elements that might contain schedule data
      const possibleSelectors = [
        'table',
        '[class*="schedule"]',
        '[class*="game"]',
        'tr',
        'li[class*="game"]',
        '.event',
        '[data-game]'
      ];

      const foundElements = {};
      possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        foundElements[selector] = elements.length;
      });

      return { statLinks, foundElements, bodyText: document.body.innerText.substring(0, 2000) };
    });

    console.log('=== STATBROADCAST LINKS FOUND ===');
    if (data.statLinks.length > 0) {
      data.statLinks.forEach((link, i) => {
        console.log(`${i + 1}. Game ID: ${link.gameId}`);
        console.log(`   Text: ${link.text}`);
        console.log(`   URL: ${link.href}`);
        console.log();
      });
    } else {
      console.log('(none found)\n');
    }

    console.log('=== ELEMENT COUNTS ===');
    Object.entries(data.foundElements).forEach(([selector, count]) => {
      console.log(`${selector}: ${count}`);
    });
    console.log();

    console.log('=== PAGE TEXT (first 2000 chars) ===');
    console.log(data.bodyText);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

debugSchedulePage();
