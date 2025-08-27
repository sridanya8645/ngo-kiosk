// Test script to verify validation middleware is working
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testValidationMiddleware() {
  console.log('🔒 Testing Validation Middleware...\n');

  const tests = [
    {
      name: 'Login Validation - Missing Username',
      endpoint: '/api/login',
      data: { password: 'test123' },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Login Validation - Missing Password',
      endpoint: '/api/login',
      data: { username: 'test@example.com' },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Registration Validation - Invalid Email',
      endpoint: '/api/register',
      data: {
        name: 'Test User',
        phone: '1234567890',
        email: 'invalid-email',
        eventId: 1
      },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Registration Validation - Invalid Phone',
      endpoint: '/api/register',
      data: {
        name: 'Test User',
        phone: '123', // Too short
        email: 'test@example.com',
        eventId: 1
      },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Check-in Validation - Missing Both Phone and RegistrationId',
      endpoint: '/api/checkin',
      data: { eventId: 1 },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Event Validation - Missing Required Fields',
      endpoint: '/api/events',
      data: { name: 'Test Event' }, // Missing start_datetime, end_datetime, location
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Admin User Validation - Weak Password',
      endpoint: '/api/admin/users',
      data: {
        username: 'testadmin',
        password: '123' // Too short
      },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    },
    {
      name: 'Test Email Validation - Invalid Email',
      endpoint: '/api/test-email-send',
      data: { testEmail: 'invalid-email' },
      expectedStatus: 400,
      expectedError: 'Validation failed'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, {
        validateStatus: () => true // Don't throw on non-2xx status
      });

      if (response.status === test.expectedStatus) {
        const responseData = response.data;
        if (responseData.error === test.expectedError || 
            (responseData.details && responseData.details.length > 0)) {
          console.log(`✅ PASS: ${test.name}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${responseData.error}`);
          if (responseData.details) {
            console.log(`   Details: ${JSON.stringify(responseData.details, null, 2)}`);
          }
          passedTests++;
        } else {
          console.log(`❌ FAIL: ${test.name}`);
          console.log(`   Expected error: ${test.expectedError}`);
          console.log(`   Got: ${JSON.stringify(responseData)}`);
        }
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Expected status: ${test.expectedStatus}`);
        console.log(`   Got status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log(`📊 Validation Test Results:`);
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 All validation tests passed! Security middleware is working correctly.');
  } else {
    console.log('⚠️ Some validation tests failed. Please check the implementation.');
  }
}

// Run the tests
testValidationMiddleware().catch(console.error);
