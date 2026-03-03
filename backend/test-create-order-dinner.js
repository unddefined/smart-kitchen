const http = require('http');

// 测试晚餐场景
const testData = {
  hallNumber: '301',
  peopleCount: 6,
  tableCount: 2,
  mealTime: '2026-03-03 晚餐', // 晚餐场景
};

console.log('Testing POST /api/orders with dinner...');
console.log('Test data:', testData);

const postData = JSON.stringify(testData);

const options = {
  hostname: '8.145.34.30',
  port: 3001,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('\n✅ Dinner order created successfully!');
      const response = JSON.parse(data);
      console.log('\n📅 Extracted values:');
      console.log(`   - mealTime: ${response.mealTime}`);
      console.log(`   - mealType: ${response.mealType}`);
    } else {
      console.log('\n❌ Failed to create order');
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
