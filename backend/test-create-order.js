const http = require('http');

const testData = {
  hallNumber: '8',
  peopleCount: 4,
  tableCount: 1,
  mealTime: '2024-01-15 12:00', // 字符串格式，测试是否能正确转换
};

console.log('Testing POST /api/orders endpoint...');
console.log('Test data:', testData);

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ Order created successfully!');
      console.log('Response:', JSON.parse(data));
    } else {
      console.log('❌ Failed to create order');
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
