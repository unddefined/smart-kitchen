const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/dishes/grouped-by-category',
  method: 'GET'
};

console.log('Testing /api/dishes/grouped-by-category endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
