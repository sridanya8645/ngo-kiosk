// Test script to verify security improvements
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSecurityFeatures() {
  console.log('🔒 Testing Security Features...\n');

  try {
    // Test 1: Health check endpoint
    console.log('1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Rate limiting (should fail after 5 attempts)
    console.log('2. Testing rate limiting on login endpoint...');
    for (let i = 1; i <= 6; i++) {
      try {
        await axios.post(`${BASE_URL}/api/login`, {
          username: 'test',
          password: 'test'
        });
        console.log(`   Attempt ${i}: Request went through`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   Attempt ${i}: Rate limited (expected)`);
          break;
        } else {
          console.log(`   Attempt ${i}: ${error.response?.status || error.message}`);
        }
      }
    }
    console.log('');

    // Test 3: Input validation
    console.log('3. Testing input validation...');
    try {
      await axios.post(`${BASE_URL}/api/register`, {
        name: '<script>alert("xss")</script>',
        phone: 'invalid-phone',
        email: 'invalid-email',
        eventId: 'not-a-number'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Input validation working (rejected invalid data)');
      } else {
        console.log('⚠️ Input validation response:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    // Test 4: CORS headers
    console.log('4. Testing CORS configuration...');
    const corsResponse = await axios.options(`${BASE_URL}/api/events`);
    console.log('✅ CORS headers present:', {
      'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': corsResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': corsResponse.headers['access-control-allow-headers']
    });
    console.log('');

    // Test 5: Error handling
    console.log('5. Testing error handling...');
    try {
      await axios.get(`${BASE_URL}/api/nonexistent-endpoint`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 404 error handling working');
      } else {
        console.log('⚠️ Error handling response:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    console.log('🎉 All security tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSecurityFeatures();
}

module.exports = { testSecurityFeatures };
