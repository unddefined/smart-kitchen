/**
 * WebSocket 广播接收诊断脚本
 * 
 * 使用方法：
 * 1. 在电脑浏览器打开应用
 * 2. 打开开发者工具 Console
 * 3. 粘贴并执行此脚本
 * 4. 然后在手机端触发订单更新
 * 5. 观察电脑端 Console 输出
 */

(function() {
  console.clear();
  console.log('🔍 === WebSocket 广播接收诊断开始 ===\n');
  
  // 1. 检查全局 WebSocket 实例
  if (!window.ws) {
    console.error('❌ window.ws 不存在，WebSocket 未初始化');
    console.log('💡 提示：请确保页面已完全加载');
    return;
  }
  
  const ws = window.ws;
  console.log('✅ window.ws 存在');
  
  // 2. 检查连接状态
  console.log('\n📡 连接状态检查:');
  console.log('   - isConnected:', ws.isConnected?.value || ws.isConnected);
  console.log('   - socket 实例:', ws.socket?.value || ws.socket ? '存在' : '不存在');
  
  const socket = ws.socket?.value || ws.socket;
  if (socket) {
    console.log('   - socket.id:', socket.id || '未知');
    console.log('   - socket.connected:', socket.connected);
  }
  
  // 3. 检查已订阅的房间
  console.log('\n📋 房间订阅状态:');
  const subscribedRooms = window.subscribedRooms || new Set();
  console.log('   - 已订阅房间:', [...subscribedRooms]);
  
  const requiredRooms = ['orders', 'all', 'order-items'];
  const missingRooms = requiredRooms.filter(room => !subscribedRooms.has(room));
  
  if (missingRooms.length > 0) {
    console.warn('⚠️ 缺少必要的房间订阅:', missingRooms);
    console.log('💡 正在自动订阅...');
    missingRooms.forEach(room => {
      ws.subscribe(room);
      console.log(`   ✅ 已订阅房间：${room}`);
    });
  } else {
    console.log('   ✅ 所有必要房间已订阅');
  }
  
  // 4. 检查事件监听器
  console.log('\n🎯 事件监听器状态:');
  const eventListeners = window.eventListeners || new Map();
  console.log('   - 监听的事件:', [...eventListeners.keys()]);
  
  const requiredEvents = ['order-created', 'order-updated', 'order-deleted', 'item-created', 'item-updated', 'item-deleted'];
  const missingEvents = requiredEvents.filter(event => !eventListeners.has(event));
  
  if (missingEvents.length > 0) {
    console.warn('⚠️ 缺少必要的事件监听:', missingEvents);
    console.log('💡 正在添加监听器...');
    
    missingEvents.forEach(event => {
      const unsubscribe = ws.listen(event, (data) => {
        console.log(`\n✅ [${new Date().toLocaleTimeString()}] 收到 ${event}:`, data);
        console.log('   完整数据:', JSON.stringify(data, null, 2));
      });
      console.log(`   ✅ 已添加监听器：${event}`);
    });
  } else {
    console.log('   ✅ 所有必要事件已监听');
  }
  
  // 5. 主动测试广播
  console.log('\n🧪 主动广播测试:');
  console.log('   准备发送测试广播到 "orders" 房间...');
  
  setTimeout(() => {
    try {
      ws.broadcast('orders', 'test-broadcast', {
        message: '这是来自诊断脚本的测试广播',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      });
      console.log('   ✅ 测试广播已发送');
      console.log('   💡 如果其他设备也运行了此脚本，应该能收到此消息');
    } catch (error) {
      console.error('   ❌ 发送测试广播失败:', error.message);
    }
  }, 1000);
  
  // 6. 监听所有 Socket.IO 原始事件
  console.log('\n👂 设置 Socket.IO 原始事件监听:');
  if (socket) {
    const originalOn = socket.on;
    socket.on('any', (...args) => {
      console.log('📢 [Socket.IO 原始事件]', args[0], args[1]);
    });
    console.log('   ✅ 已添加 Socket.IO 原始事件监听');
  }
  
  // 7. 输出诊断摘要
  console.log('\n📊 诊断摘要:');
  console.log('   当前时间:', new Date().toLocaleString('zh-CN'));
  console.log('   URL:', window.location.href);
  console.log('   User Agent:', navigator.userAgent);
  
  console.log('\n🎯 下一步操作:');
  console.log('   1. 请在手机端修改一个订单的状态');
  console.log('   2. 观察此 Console 是否输出 "收到 order-updated" 消息');
  console.log('   3. 如果没有收到，请检查后端日志（pm2 logs kitchen-backend）');
  
  console.log('\n📝 调试命令参考:');
  console.log('   - 查看后端日志：ssh ... && pm2 logs kitchen-backend --lines 50');
  console.log('   - 手动重新连接：window.ws.connect()');
  console.log('   - 手动订阅房间：window.ws.subscribe("orders")');
  console.log('   - 查看订阅状态：console.log(window.subscribedRooms)');
  
  console.log('\n=== 诊断脚本执行完毕 === 🔍');
})();
