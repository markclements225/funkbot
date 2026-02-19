/**
 * Test all GroupMe message formats
 */

function cleanHomeRunText(rawText) {
  try {
    const parts = rawText.split('\t');
    if (parts.length >= 3) {
      const description = parts[2].trim();
      const playerMatch = description.match(/^(\w+(?:\s+\w+\.?)?)\s+homered/i);
      const playerName = playerMatch ? playerMatch[1] : 'LSU';
      let fieldDirection = 'the outfield';
      if (description.includes('to left field')) fieldDirection = 'left field';
      else if (description.includes('to right field')) fieldDirection = 'right field';
      else if (description.includes('to center field')) fieldDirection = 'center field';
      const rbiMatch = description.match(/(\d+)\s+RBI/i);
      const rbiCount = rbiMatch ? parseInt(rbiMatch[1]) : 1;
      const runsText = rbiCount === 1 ? 'The Tigers score 1 run' : `The Tigers score ${rbiCount} runs`;
      return `${playerName} FUNKBLAST!!! ${runsText} on the home run to ${fieldDirection}!!! LETS GET FUNKY!!!`;
    }
    return rawText.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    return rawText.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

console.log('📱 ALL GROUPME MESSAGE FORMATS\n');
console.log('='.repeat(80));

// 1. DEPLOYMENT SUCCESS MESSAGE
console.log('\n📨 MESSAGE #1: DEPLOYMENT SUCCESS (posted on every Railway deploy)\n');
console.log('┌─────────────────────────────────────────────────────────────────');
console.log('│');
console.log('│ 🚀 FunkBot has been deployed successfully! All systems are');
console.log('│ FUNKY and ready to track LSU home runs! 🐯⚾');
console.log('│');
console.log('└─────────────────────────────────────────────────────────────────');

// 2. DAILY GAME DAY ALERT
console.log('\n📨 MESSAGE #2: DAILY GAME DAY ALERT (posted at 8:00 AM CST)\n');
console.log('┌─────────────────────────────────────────────────────────────────');
console.log('│');
console.log('│ 🐯 ITS GAMEDAY YALL!!! 🐯');
console.log('│');
console.log('│ NICH 1, LSU 9 - Final');
console.log('│');
console.log('│ Time to get FUNKY! 🟣🟡');
console.log('│');
console.log('│ GEAUX TIGERS!!!');
console.log('│');
console.log('└─────────────────────────────────────────────────────────────────');

// 3. HOME RUN ALERTS
console.log('\n📨 MESSAGE #3: HOME RUN ALERT (posted every time LSU hits a HR)\n');

const sampleHRs = [
  'Bot 1\tHR 7 4RBI\tCaraway homered to left field, 4 RBI (0-0); Dardar scored; Yorke scored; Brown scored.\tCaraway\tMabry\t2',
  'Bot 3\tHR 7 1RBI\tSmith homered to right field, RBI.\tSmith\tJones\t1',
  'Bot 5\tHR 7 2RBI\tJones homered to center field, 2 RBI.\tJones\tDoe\t1'
];

sampleHRs.forEach((hr, idx) => {
  console.log(`\nExample ${idx + 1}:\n`);
  console.log('┌─────────────────────────────────────────────────────────────────');
  console.log('│');
  console.log('│ 🎉 LSU HOME RUN! 🟣🟡');
  console.log('│');
  console.log('│ ' + cleanHomeRunText(hr));
  console.log('│');
  console.log('│ 📸 [FunkBlastoise.jpg attached]');
  console.log('│');
  console.log('└─────────────────────────────────────────────────────────────────');
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ SUMMARY:\n');
console.log('1. Deployment Success - Posted ONCE when Railway deploys');
console.log('2. Game Day Alert - Posted DAILY at 8:00 AM CST (if game scheduled)');
console.log('3. Home Run Alerts - Posted EVERY TIME LSU hits a home run');
console.log('');
console.log('All messages use NEW StatBroadcast scraping system! 🎉');
console.log('');
