// 后端服务验证脚本
// 用于验证CORS和API是否正常工作

const http = require('http');

async function verifyBackend() {
  console.log('🔍 开始验证后端服务...');
  
  // 测试健康检查
  try {
    const healthResponse = await makeRequest('http://8.145.34.30:3000/health');
    console.log('✅ 健康检查:', healthResponse.status === 200 ? '通过' : '失败');
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  
  // 测试菜品API
  try {
    const dishesResponse = await makeRequest('http://8.145.34.30:3000/dishes');
    console.log('✅ 菜品API:', dishesResponse.status === 200 ? '正常' : '异常');
  } catch (error) {
    console.log('❌ 菜品API失败:', error.message);
  }
  
  // 测试CORS（模拟浏览器请求）
  try {
    const corsResponse = await makeRequest('http://8.145.34.30:3000/health', {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS测试:', corsResponse.headers['access-control-allow-origin'] ? '通过' : '未检测到CORS头');
  } catch (error) {
    console.log('❌ CORS测试失败:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// 执行验证
verifyBackend().catch(console.error);