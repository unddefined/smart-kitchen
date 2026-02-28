# 订单数据获取功能集成说明

## 📋 功能概述

本文档说明如何在前端Cooking.vue组件中集成云服务器后端数据库的订单数据获取功能。

## 🚀 主要改动

### 1. Cooking.vue 组件增强
- 添加了真实订单数据获取功能
- 替换了原有的模拟数据
- 集成了加载状态和错误处理
- 实现了订单按台号在左侧菜单中的显示

### 2. OrderView.vue 组件升级
- 支持接收真实的订单详情数据
- 添加了完整的订单信息展示
- 实现了菜品分类显示（已出/待上）
- 集成了优先级颜色标识

### 3. 新增测试页面
- 创建了 `OrderDataTest.vue` 专门用于测试订单数据获取
- 提供了订单创建和数据验证功能

## 🛠️ 技术实现

### 数据获取流程
```javascript
// 1. 组件挂载时自动加载订单数据
onMounted(() => {
  loadOrders();
});

// 2. 从后端API获取订单列表
const loadOrders = async () => {
  try {
    const orderList = await OrderService.getOrders();
    orders.value = orderList.map(order => ({
      id: order.id,
      hallNumber: order.hallNumber,
      // ... 其他字段映射
    }));
  } catch (error) {
    // 错误处理
  }
};
```

### 订单详情获取
```javascript
// 获取指定订单的详细信息
const loadOrderDetail = async () => {
  const detail = await OrderService.getOrderDetail(props.orderId);
  orderDetail.value = detail;
};
```

## 🧪 测试方法

### 1. 开发环境测试
```bash
# 启动前端开发服务器
cd frontend
npm run dev

# 访问测试页面
# http://localhost:5173/order-test
```

### 2. 功能验证点
- [ ] 订单列表正确显示台号
- [ ] 点击台号能正确切换到订单详情
- [ ] 订单详情页面显示完整信息
- [ ] 加载状态和错误处理正常工作
- [ ] 数据刷新功能正常

### 3. API接口验证
```bash
# 测试订单列表接口
curl http://8.145.34.30:3001/api/orders

# 测试单个订单详情
curl http://8.145.34.30:3001/api/orders/1
```

## 📊 数据结构映射

### 订单列表数据结构
```javascript
{
  id: number,           // 订单ID
  hallNumber: string,   // 台号
  peopleCount: number,  // 人数
  tableCount: number,   // 桌数
  status: string,       // 状态
  createdAt: string,    // 创建时间
  hasUrgentItems: boolean, // 是否有催菜项
  isPending: boolean    // 是否待处理
}
```

### 订单详情数据结构
```javascript
{
  id: number,
  hallNumber: string,
  peopleCount: number,
  tableCount: number,
  status: string,
  createdAt: string,
  mealTime: string,
  remark: string,
  startTime: string,
  items: [              // 菜品列表
    {
      id: number,
      dish: {
        name: string    // 菜品名称
      },
      quantity: number, // 数量
      status: string,   // 菜品状态
      priority: number, // 优先级
      remark: string    // 备注
    }
  ]
}
```

## 🔧 配置要求

### 环境变量配置
确保 `.env` 文件中包含正确的API地址：
```env
VITE_API_BASE_URL=http://8.145.34.30:3001
```

### 后端服务要求
- 后端服务需要正常运行在 `http://8.145.34.30:3001`
- 数据库连接正常
- 订单相关API接口可用

## 🐛 常见问题排查

### 1. 数据加载失败
- 检查网络连接
- 验证API地址配置
- 查看浏览器控制台错误信息

### 2. 显示异常
- 确认数据结构映射正确
- 检查组件props传递
- 验证CSS样式应用

### 3. 功能不响应
- 确认事件绑定正确
- 检查方法实现
- 验证异步操作处理

## 📈 性能优化建议

1. **数据缓存**: 考虑添加本地缓存机制
2. **分页加载**: 对于大量订单数据实现分页
3. **WebSocket**: 使用实时推送替代轮询
4. **懒加载**: 订单详情按需加载

## 🔄 后续改进方向

- [ ] 添加订单搜索和筛选功能
- [ ] 实现订单状态实时更新
- [ ] 增加批量操作功能
- [ ] 优化移动端用户体验
- [ ] 添加数据统计图表

## 📞 技术支持

如有问题，请联系开发团队或查看相关文档。