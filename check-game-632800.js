const sb = require('./src/statbroadcast-tracker');

sb.getGameData('632800').then(data => {
  if (!data) {
    console.log('No data for game 632800');
    return;
  }
  console.log('\n=== GAME 632800 ===');
  console.log('Title:', data.title);
  console.log('Plays found:', data.plays.length);
  console.log();
}).catch(e => console.error(e));
