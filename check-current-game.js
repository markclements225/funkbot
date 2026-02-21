const sb = require('./src/statbroadcast-tracker');

async function check() {
  const data = await sb.getGameData('633584');

  if (!data) {
    console.log('No data');
    return;
  }

  console.log('=== GAME INFO ===');
  console.log('Title:', data.title);
  console.log('LSU is:', data.lsuIsHome === true ? 'HOME' : data.lsuIsHome === false ? 'AWAY' : 'UNKNOWN');
  console.log('Home runs found:', data.homeRuns.length);
  console.log('Total plays:', data.plays.length);

  console.log('\n=== ALL PLAYS ===');
  data.plays.forEach((p, i) => console.log(`${i+1}. ${p}`));

  console.log('\n=== SEARCHING RAW TEXT FOR "HOME RUN" OR "HR" ===');
  const lines = data.rawText.split('\n');
  const hrLines = lines.filter(line => {
    const lower = line.toLowerCase();
    return lower.includes('homered') ||
           lower.includes('home run') ||
           /\bhr\b/i.test(line);
  });

  console.log(`Found ${hrLines.length} lines with HR mentions:`);
  hrLines.forEach((line, i) => {
    if (i < 30) { // Show first 30
      console.log(`${i+1}. ${line.trim()}`);
    }
  });
}

check().catch(e => console.error(e));
