const sb = require('./src/statbroadcast-tracker');

async function verify() {
  console.log('🔍 Verifying today\'s game setup...\n');

  const ids = await sb.getTodaysGameIDs();
  console.log('✅ Configured game IDs:', ids);
  console.log();

  if (ids.length === 0) {
    console.log('❌ No games configured!');
    return;
  }

  const data = await sb.getGameData(ids[0]);

  if (!data) {
    console.log('❌ No data available for game', ids[0]);
    return;
  }

  console.log('📊 Game:', data.title);
  console.log('🏠 LSU is:', data.lsuIsHome === true ? 'HOME' : data.lsuIsHome === false ? 'AWAY' : 'UNKNOWN');
  console.log('⚾ Home runs found:', data.homeRuns.length);

  if (data.homeRuns.length > 0) {
    console.log('\n🎯 Home Run Details:');
    data.homeRuns.forEach((hr, i) => {
      const isLSU = sb.isLSUHomeRun(hr.text, hr.context, data.rawText, data.lsuIsHome);
      console.log(`  ${i+1}. [${isLSU ? '🐯 LSU' : 'OPP'}] ${hr.text.substring(0, 80)}`);
    });
  }

  console.log('\n✅ Setup verified! Bot is ready to monitor game 651258');
}

verify().catch(e => console.error(e));
