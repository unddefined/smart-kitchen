const http = require('http');

// 测试包含中文餐型的日期格式
const testData = {
  hallNumber: '201',
  peopleCount: 4,
  tableCount: 1,
  mealTime: '2026-03-03 午餐', // 前端实际传递的格式
};

console.log('Testing POST /api/orders with Chinese meal type...');
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
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('\n✅ Order created successfully!');
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
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
