/**
 * Diagnostic script to see what tabs/links exist on a StatBroadcast game page
 */

const puppeteer = require('puppeteer');

async function checkTabs(gameId) {
  let browser;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking tabs for game: ${gameId}`);
    console.log('='.repeat(60) + '\n');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = `https://stats.statbroadcast.com/broadcast/?id=${gameId}`;

    console.log(`📡 Loading: ${url}\n`);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to decode
    console.log('⏳ Waiting 4 seconds for page to decode...\n');
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Extract all links, buttons, and tab elements
    const elements = await page.evaluate(() => {
      const results = [];

      // Get all potential tab/link elements
      const selectors = [
        'a',
        'button',
        '[role="tab"]',
        '[class*="tab"]',
        '[id*="tab"]',
        '[class*="nav"]',
        '[id*="nav"]'
      ];

      const allElements = [];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => allElements.push(el));
      });

      // Deduplicate and extract text
      const seen = new Set();
      allElements.forEach(el => {
        const text = el.textContent?.trim();
        const tag = el.tagName.toLowerCase();
        const classes = el.className || '';
        const id = el.id || '';
        const role = el.getAttribute('role') || '';

        if (text && text.length > 0 && text.length < 100 && !seen.has(text)) {
          seen.add(text);
          results.push({
            text,
            tag,
            classes,
            id,
            role,
            href: el.href || ''
          });
        }
      });

      return results;
    });

    console.log(`Found ${elements.length} potential tab/link elements:\n`);
    console.log('='.repeat(60));

    elements.forEach((el, idx) => {
      console.log(`\n[${idx + 1}] "${el.text}"`);
      console.log(`    Tag: <${el.tag}>`);
      if (el.role) console.log(`    Role: ${el.role}`);
      if (el.classes) console.log(`    Class: ${el.classes}`);
      if (el.id) console.log(`    ID: ${el.id}`);
      if (el.href) console.log(`    Href: ${el.href}`);

      // Check if it matches our search criteria
      const lower = el.text.toLowerCase();
      if (lower.includes('scoring') && !lower.includes('card')) {
        console.log(`    ✅ MATCHES: contains "scoring" but not "card"`);
      } else if (lower.includes('scoring')) {
        console.log(`    ⚠️  Contains "scoring" but also contains "card"`);
      } else if (lower.includes('play')) {
        console.log(`    📋 Contains "play"`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the diagnostic
const gameId = process.argv[2] || '651253';
checkTabs(gameId).then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
