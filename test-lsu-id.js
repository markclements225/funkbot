require('dotenv').config();

async function findLSUTeamId() {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  try {
    console.log('Searching for LSU in NCAA teams...\n');
    
    const response = await fetch(
      'https://mlb-college-baseball-api.p.rapidapi.com/teams?league=NCAA&name=Tigers',
      {
        headers: {
          'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      // Look for LSU specifically
      const lsuTeam = data.data.find(team => 
        team.displayName.includes('LSU') || 
        team.name.includes('LSU') ||
        team.displayName === 'Louisiana State'
      );
      
      if (lsuTeam) {
        console.log('\n✅ Found LSU!');
        console.log('Team Details:', lsuTeam);
        console.log(`\n🎯 LSU Team ID: ${lsuTeam.id}`);
        console.log(`\nUpdate your .env file with:\nLSU_TEAM_ID=${lsuTeam.id}`);
      } else {
        console.log('\nAll teams found:');
        data.data.forEach(team => {
          console.log(`- ${team.displayName} (${team.name}) - ID: ${team.id}`);
        });
      }
    } else {
      console.log('No teams found. Response:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

findLSUTeamId();