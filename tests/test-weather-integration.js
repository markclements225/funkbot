/**
 * Test weather integration with game day alerts
 *
 * This tests:
 * 1. Weather API call with location and date
 * 2. Integration into game day message
 * 3. Graceful fallback if weather unavailable
 */

require('dotenv').config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

async function getWeatherForecast(location, date) {
  if (!WEATHER_API_KEY || !location) {
    return null;
  }

  try {
    console.log(`🌤️  Fetching weather for ${location} on ${date}...`);

    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&dt=${date}&aqi=no`,
      { timeout: 5000 }
    );

    if (!response.ok) {
      console.log(`⚠️  Weather API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.forecast?.forecastday?.[0]) {
      console.log('⚠️  No forecast data available');
      return null;
    }

    const forecast = data.forecast.forecastday[0].day;
    const highF = Math.round(forecast.maxtemp_f);
    const lowF = Math.round(forecast.mintemp_f);
    const rainChance = forecast.daily_chance_of_rain || 0;
    const condition = forecast.condition.text;

    const weatherStr = `☀️ High ${highF}°F, Low ${lowF}°F, ${rainChance}% rain, ${condition}`;
    console.log(`✅ Weather: ${weatherStr}`);

    return weatherStr;
  } catch (error) {
    console.log(`⚠️  Weather fetch error: ${error.message}`);
    return null;
  }
}

async function testWeatherIntegration() {
  console.log('\n🧪 Testing Weather Integration\n');
  console.log('='.repeat(60));

  // Test 1: Valid location
  console.log('\n📍 Test 1: Valid Location (Baton Rouge, LA)');
  const weather1 = await getWeatherForecast('Baton Rouge, LA', '2026-02-27');
  console.log(weather1 ? `✅ Success` : `❌ Failed`);

  // Test 2: Different location
  console.log('\n📍 Test 2: Different Location (Nashville, TN)');
  const weather2 = await getWeatherForecast('Nashville, TN', '2026-03-13');
  console.log(weather2 ? `✅ Success` : `❌ Failed`);

  // Test 3: Invalid location (should return null gracefully)
  console.log('\n📍 Test 3: Invalid Location (should fail gracefully)');
  const weather3 = await getWeatherForecast('Invalid City XYZ', '2026-02-27');
  console.log(!weather3 ? `✅ Gracefully handled` : `⚠️  Unexpected success`);

  // Test 4: No API key (should return null gracefully)
  console.log('\n📍 Test 4: Missing API Key (simulated)');
  const originalKey = process.env.WEATHER_API_KEY;
  delete process.env.WEATHER_API_KEY;
  const weather4 = await getWeatherForecast('Baton Rouge, LA', '2026-02-27');
  process.env.WEATHER_API_KEY = originalKey;
  console.log(!weather4 ? `✅ Gracefully handled` : `⚠️  Unexpected success`);

  // Test 5: Show full game message with weather
  console.log('\n📱 Test 5: Full Game Day Message with Weather\n');
  const weather = await getWeatherForecast('Baton Rouge, LA', '2026-02-27');

  let message = '🐯 ITS GAMEDAY BOYS!!! 🐯\n\n';
  message += 'LSU vs Dartmouth\n';
  message += '📍 Baton Rouge, LA\n';
  message += '🏟️ Alex Box Stadium, Skip Bertman Field\n';
  message += '🕐 6:30 PM CT\n';
  if (weather) {
    message += `${weather}\n`;
  }
  message += '\nTime to get FUNKY! 🟣🟡\n\n';
  message += 'GEAUX TIGERS!!!';

  console.log(message);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Weather integration test complete!\n');
}

testWeatherIntegration().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
