require('dotenv').config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function testClaude(question) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Testing Claude API');
    console.log('='.repeat(60));
    console.log(`\n❓ Question: "${question}"\n`);
    console.log('🤖 Sending to Claude...\n');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        system: 'You are FunkBot, a helpful assistant in a GroupMe chat. Keep responses concise, friendly, and informative. Use emojis occasionally but not excessively. If asked about LSU sports, be enthusiastic and use purple and gold emojis 🟣🟡. IMPORTANT: Do NOT ask conversational follow-up questions like "Have you been there?" or "What do you think?". Only ask clarifying questions if you genuinely need more information to answer (e.g., "Which sport?" or "Which year?"). Just provide direct, helpful answers. Keep all responses under 400 characters when possible - be concise and to the point.'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Claude API error:', error);
      return;
    }

    const data = await response.json();
    const aiMessage = data.content[0].text;
    
    console.log('✅ Got response from Claude!\n');
    console.log('='.repeat(60));
    console.log('💬 FunkBot Response:');
    console.log('='.repeat(60));
    console.log(aiMessage);
    console.log('='.repeat(60) + '\n');
    
    // Show usage stats
    console.log('📊 Usage Stats:');
    console.log(`   Input tokens: ${data.usage.input_tokens}`);
    console.log(`   Output tokens: ${data.usage.output_tokens}`);
    console.log(`   Estimated cost: $${((data.usage.input_tokens * 1 + data.usage.output_tokens * 5) / 1000000).toFixed(6)}`);
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test with different questions
async function runTests() {
  console.log('\n🧪 FunkBot Claude API Test Suite\n');
  
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file!');
    console.log('\nAdd it to your .env file:');
    console.log('ANTHROPIC_API_KEY=your_key_here\n');
    return;
  }
  
  console.log('✅ API key found:', ANTHROPIC_API_KEY.substring(0, 15) + '...\n');
  
  // Test 1: Simple question
  await testClaude("What's the capital of Louisiana?");
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: LSU sports question
  await testClaude("Tell me about LSU baseball!");
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: General question
  await testClaude("What's the weather like in Baton Rouge?");
  
  console.log('✅ All tests complete!\n');
}

runTests();