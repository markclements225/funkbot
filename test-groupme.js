require('dotenv').config();
const fs = require('fs');

const GROUPME_BOT_ID = process.env.GROUPME_BOT_ID;
const GROUPME_ACCESS_TOKEN = process.env.GROUPME_ACCESS_TOKEN;

// Function to upload image to GroupMe's image service
async function uploadImageToGroupMe() {
  try {
    console.log('📤 Reading FunkBlastoise.jpg...');
    
    // Check if file exists
    if (!fs.existsSync('./FunkBlastoise.jpg')) {
      console.error('❌ Error: FunkBlastoise.jpg not found in current directory!');
      console.log('   Make sure the image is in the same folder as this script.');
      return null;
    }
    
    const imageBuffer = fs.readFileSync('./FunkBlastoise.jpg');
    console.log(`✅ Image loaded (${imageBuffer.length} bytes)`);
    
    console.log('📤 Uploading to GroupMe image service...');
    
    // Upload to GroupMe image service with access token
    const response = await fetch('https://image.groupme.com/pictures', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Access-Token': GROUPME_ACCESS_TOKEN
      },
      body: imageBuffer
    });

    if (!response.ok) {
      console.error(`❌ Upload failed with status: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
      return null;
    }

    const data = await response.json();
    console.log('✅ Image uploaded successfully!');
    console.log('📸 Image URL:', data.payload.url);
    
    return data.payload.url;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return null;
  }
}

// Function to post image to GroupMe
async function postToGroupMe(message = '') {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TESTING GROUPME IMAGE POST');
    console.log('='.repeat(50) + '\n');
    
    // First, upload the image to GroupMe's image service
    const imageUrl = await uploadImageToGroupMe();
    
    if (!imageUrl) {
      console.error('❌ Failed to upload image - cannot post to GroupMe');
      return false;
    }

    console.log('\n📤 Posting to GroupMe chat...');
    
    // Post message with image attachment to GroupMe
    const response = await fetch('https://api.groupme.com/v3/bots/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: GROUPME_BOT_ID,
        text: message,
        attachments: [
          {
            type: 'image',
            url: imageUrl
          }
        ]
      })
    });

    console.log('Response status:', response.status);

    if (response.status === 202) {
      console.log('\n✅ SUCCESS! Image posted to GroupMe!');
      console.log('   Check your group chat for FunkBlastoise! 🎉\n');
      return true;
    } else {
      const text = await response.text();
      console.error('❌ Failed to post to GroupMe');
      console.error('Status:', response.status);
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error posting to GroupMe:', error);
    return false;
  }
}

// Test different scenarios
async function runTests() {
  console.log('🧪 GroupMe Integration Test Suite\n');
  
  // Verify environment variables
  console.log('Checking configuration...');
  if (!GROUPME_BOT_ID) {
    console.error('❌ GROUPME_BOT_ID not found in .env file!');
    return;
  }
  console.log('✅ Bot ID found:', GROUPME_BOT_ID.substring(0, 10) + '...');
  
  if (!GROUPME_ACCESS_TOKEN) {
    console.error('❌ GROUPME_ACCESS_TOKEN not found in .env file!');
    console.log('\n📝 To get your access token:');
    console.log('   1. Go to https://dev.groupme.com/');
    console.log('   2. Log in');
    console.log('   3. Click "Access Token" in the top right');
    console.log('   4. Copy the token and add to .env file:\n');
    console.log('   GROUPME_ACCESS_TOKEN=your_token_here\n');
    return;
  }
  console.log('✅ Access token found:', GROUPME_ACCESS_TOKEN.substring(0, 10) + '...\n');
  
  // Test 1: Post with message
  console.log('TEST 1: Posting image with test message...\n');
  await postToGroupMe('🧪 Test Mode: LSU HOME RUN!');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Post without message (just image)
  console.log('\n' + '='.repeat(50));
  console.log('\nTEST 2: Posting image only (no text)...\n');
  await postToGroupMe('');
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests complete!');
  console.log('Check your GroupMe chat to see if both images appeared.');
  console.log('='.repeat(50) + '\n');
}

runTests();