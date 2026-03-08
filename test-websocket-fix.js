/**
 * WebSocket 连接测试脚本
 * 用于验证生产环境 WebSocket 是否正常连接
 */

// 模拟浏览器环境测试
const testWebSocketUrl = () => {
  console.log('=== WebSocket URL 测试 ===\n');
  
  // 测试生产环境（HTTPS）
  const httpsLocation = {
    protocol: 'https:',
    host: '8.145.34.30'
  };
  
  const protocol1 = httpsLocation.protocol === 'https:' ? 'wss:' : 'ws:';
  const url1 = `${protocol1}//${httpsLocation.host}:3001/ws`;
  console.log('✅ HTTPS 环境:', url1);
  console.log('   期望：wss://8.145.34.30:3001/ws\n');
  
  // 测试生产环境（HTTP）
  const httpLocation = {
    protocol: 'http:',
    host: '8.145.34.30'
  };
  
  const protocol2 = httpLocation.protocol === 'https:' ? 'wss:' : 'ws:';
  const url2 = `${protocol2}//${httpLocation.host}:3001/ws`;
  console.log('✅ HTTP 环境:', url2);
  console.log('   期望：ws://8.145.34.30:3001/ws\n');
  
  // 测试开发环境
  const devEnv = process.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  console.log('✅ 开发环境:', devEnv);
  console.log('   期望：ws://localhost:3001/ws\n');
};

// 运行测试
testWebSocketUrl();

console.log('\n=== 部署后验证步骤 ===');
console.log('1. 在浏览器 Console 执行以下代码测试：');
console.log(`
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = \`\${protocol}//\${window.location.host}:3001/ws\`;
console.log('WebSocket URL:', wsUrl);

const socket = io(wsUrl, {
  transports: ['websocket', 'polling'],
  timeout: 10000
});

socket.on('connect', () => {
  console.log('✅ WebSocket 连接成功！');
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket 连接失败:', error.message);
});
`);

console.log('\n2. 检查后端日志：');
console.log('   pm2 logs kitchen-backend --lines 50');

console.log('\n3. 查看监听端口：');
console.log('   netstat -tlnp | grep 3001');

console.log('\n4. 测试 CORS 配置：');
console.log('   curl -v http://8.145.34.30:3001/socket.io/?EIO=4&transport=polling');
