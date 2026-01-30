require('dotenv').config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function checkAvailableModels() {
  try {
    console.log('\n🔍 Checking available Claude models...\n');
    
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Available models:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Model IDs you can use:\n');
      data.data.forEach(model => {
        console.log(`   - ${model.id} (${model.display_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvailableModels();