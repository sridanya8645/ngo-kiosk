const fetch = require('node-fetch');

async function testRaffleWinnersAPI() {
  try {
    console.log('Testing /api/raffle-winners endpoint...');
    
    const response = await fetch('http://localhost:5000/api/raffle-winners');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('Number of winners:', data.length);
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testRaffleWinnersAPI(); 