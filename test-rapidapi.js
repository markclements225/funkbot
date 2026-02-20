require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LSU_TEAM_ID = process.env.LSU_TEAM_ID || '10291565';

async function test() {
  const today = new Date().toISOString().split('T')[0];
  console.log('Testing RapidAPI for date:', today);
  console.log('LSU Team ID:', LSU_TEAM_ID);
  console.log('');

  const response = await fetch(
    `https://mlb-college-baseball-api.p.rapidapi.com/matches?date=${today}&league=NCAA`,
    {
      headers: {
        'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    }
  );

  console.log('Response status:', response.status);

  if (!response.ok) {
    console.log('Error response');
    const text = await response.text();
    console.log('Error:', text);
    return;
  }

  const data = await response.json();
  console.log('Total games returned:', data.data?.length || 0);
  console.log('');

  // Find LSU game
  const lsuGames = data.data?.filter(match =>
    match.homeTeam.id === parseInt(LSU_TEAM_ID) ||
    match.awayTeam.id === parseInt(LSU_TEAM_ID)
  ) || [];

  if (lsuGames.length === 0) {
    console.log('❌ No LSU games found');
    console.log('');
    console.log('Available teams in response:');
    data.data?.slice(0, 3).forEach(game => {
      console.log(`  - ${game.homeTeam.displayName} (ID: ${game.homeTeam.id}) vs ${game.awayTeam.displayName} (ID: ${game.awayTeam.id})`);
    });
    return;
  }

  console.log('✅ Found', lsuGames.length, 'LSU game(s)');
  console.log('');
  console.log('=== FULL GAME DATA ===');
  console.log(JSON.stringify(lsuGames[0], null, 2));
  console.log('');
  console.log('=== KEY FIELDS ===');
  const game = lsuGames[0];
  console.log('Home Team:', game.homeTeam.displayName, '(ID:', game.homeTeam.id + ')');
  console.log('Home Record:', game.homeTeam.record);
  console.log('Away Team:', game.awayTeam.displayName, '(ID:', game.awayTeam.id + ')');
  console.log('Away Record:', game.awayTeam.record);
  console.log('Venue:', game.venue);
  console.log('Date:', game.date);
  console.log('Status:', game.status);
}

test().catch(err => console.error('Error:', err));
