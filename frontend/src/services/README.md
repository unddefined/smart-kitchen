# 前端API服务文档

## 概述

本项目提供了一套完整的前端API服务，用于与后端厨房管理系统进行交互。服务基于RESTful API设计，遵循MVP文档中的接口规范。

## 服务结构

```
src/services/
├── api.js              # 基础API配置和通用请求方法
├── orderService.js     # 订单管理服务
├── dishService.js      # 菜品管理服务
├── servingService.js   # 出餐逻辑服务
├── index.js           # 服务统一导出
├── usageExample.js    # 使用示例
├── testApi.js         # API测试工具
└── README.md          # 本文档
```

## 核心服务介绍

### 1. 基础API服务 (api.js)

提供底层HTTP请求封装和所有API端点的定义。

**主要功能：**
- 统一的请求处理和错误处理
- 基础认证和请求头配置
- 所有业务API端点的封装

**使用示例：**
```javascript
import { api } from '@/services'

// 获取订单列表
const orders = await api.orders.list()

// 创建新订单
const newOrder = await api.orders.create({
  hallNumber: 'T01',
  peopleCount: 4
})
```

### 2. 订单服务 (orderService.js)

处理订单的创建、查询、更新等操作。

**主要功能：**
- 订单创建和验证
- 订单状态管理
- 订单详情查询
- 批量菜品添加
- 订单数据统计

**使用示例：**
```javascript
import { OrderService } from '@/services'

// 创建订单
const result = await OrderService.createOrder({
  hallNumber: 'T01',
  peopleCount: 4,
  tableCount: 1
})

// 获取订单列表
const orders = await OrderService.getOrders({ status: 'created' })

// 添加菜品到订单
const dishResult = await OrderService.addDishToOrder(orderId, {
  dishId: 1,
  quantity: 2,
  remark: '少辣'
})
```

### 3. 菜品服务 (dishService.js)

管理菜品信息的增删改查和搜索功能。

**主要功能：**
- 菜品列表获取
- 菜品搜索（支持名称和助记码）
- 按工位/分类筛选
- 菜品创建和更新
- 菜品使用统计

**使用示例：**
```javascript
import { DishService } from '@/services'

// 获取所有菜品
const dishes = await DishService.getAllDishes()

// 搜索菜品
const searchResults = await DishService.searchDishes('宫保鸡丁')

// 按工位获取菜品
const hotDishes = await DishService.getDishesByStation(stationId)

// 创建新菜品
const newDish = await DishService.createDish({
  name: '新菜品',
  stationId: 1,
  categoryId: 2
})
```

### 4. 出餐服务 (servingService.js)

处理出餐逻辑和优先级管理。

**主要功能：**
- 催菜/缓菜操作
- 优先级自动调整
- 待处理/已出菜品查询
- 出餐提醒和紧急检测
- 状态流转验证

**使用示例：**
```javascript
import { ServingService, PRIORITY_LEVELS } from '@/services'

// 催菜
const urgeResult = await ServingService.urgeDish(itemId, '客户催菜')

// 标记已出菜
const serveResult = await ServingService.markAsServed(itemId)

// 获取待处理菜品（按优先级排序）
const pendingItems = await ServingService.getPendingItems()

// 自动调整订单优先级
const adjustResult = await ServingService.autoAdjustOrderPriorities(orderId)
```

## 常量定义

### 优先级等级
```javascript
import { PRIORITY_LEVELS } from '@/services'

PRIORITY_LEVELS.URGENT   // 3 - 红色 - 催菜
PRIORITY_LEVELS.WAIT     // 2 - 黄色 - 等一下  
PRIORITY_LEVELS.NORMAL   // 1 - 绿色 - 不急
PRIORITY_LEVELS.PENDING  // 0 - 灰色 - 未起菜
PRIORITY_LEVELS.SERVED   // -1 - 灰色 - 已出
```

### 订单状态
```javascript
import { ORDER_STATUS } from '@/services'

ORDER_STATUS.CREATED    // 已创建
ORDER_STATUS.STARTED    // 已起菜
ORDER_STATUS.SERVING    // 制作中
ORDER_STATUS.DONE       // 已完成
ORDER_STATUS.CANCELLED  // 已取消
```

### 工位定义
```javascript
import { STATIONS } from '@/services'

STATIONS.HOT_DISH   // 热菜
STATIONS.GARNISH    // 打荷
STATIONS.COLD_DISH  // 凉菜
STATIONS.STEAM      // 蒸菜
STATIONS.DIM_SUM    // 点心
STATIONS.CUTTING    // 切配
```

## 在Vue组件中使用

### 基本用法
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { OrderService, DishService } from '@/services'

const orders = ref([])
const dishes = ref([])
const loading = ref(false)

const loadOrders = async () => {
  loading.value = true
  try {
    orders.value = await OrderService.getOrders()
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>
```

### 结合Pinia Store使用
```javascript
// stores/kitchen.js
import { defineStore } from 'pinia'
import { OrderService, ServingService } from '@/services'

export const useKitchenStore = defineStore('kitchen', {
  state: () => ({
    orders: [],
    pendingItems: []
  }),
  
  actions: {
    async loadOrders() {
      this.orders = await OrderService.getOrders()
    },
    
    async loadPendingItems() {
      this.pendingItems = await ServingService.getPendingItems()
    }
  }
})
```

## 订单录入组件集成

### OrderInputModal 组件

这是一个完整的订单录入模态框组件，已集成API服务：

**主要特性：**
- 智能菜品搜索（支持名称和助记码）
- 菜品库实时读取
- 重复菜品自动累加数量
- 手动添加菜品功能
- 防抖搜索优化用户体验
- 响应式设计适配移动端

**使用示例：**
```vue
<template>
  <div>
    <button @click="showModal = true">录入订单</button>
    
    <OrderInputModal 
      v-model:visible="showModal"
      @submit="handleOrderSubmit"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OrderInputModal from '@/components/OrderInputModal.vue'
import { OrderService } from '@/services'

const showModal = ref(false)

const handleOrderSubmit = async (orderData) => {
  try {
    // 创建订单
    const orderResult = await OrderService.createOrder({
      hallNumber: orderData.tableNumber,
      peopleCount: orderData.personCount,
      remark: orderData.remark
    })
    
    if (orderResult.success) {
      // 添加菜品
      const dishPromises = orderData.dishes.map(dish =>
        OrderService.addDishToOrder(orderResult.data.id, {
          dishId: dish.dishId,
          quantity: dish.quantity,
          remark: dish.isManual ? dish.name : null
        })
      )
      
      await Promise.all(dishPromises)
      console.log('订单创建成功')
    }
  } catch (error) {
    console.error('订单创建失败:', error)
  }
}

const handleClose = () => {
  console.log('模态框关闭')
}
</script>
```

**组件Props：**
- `visible` (Boolean): 控制模态框显示/隐藏

**组件Events：**
- `submit`: 订单提交时触发，传递订单数据
- `close`: 模态框关闭时触发
- `update:visible`: 双向绑定visible属性

**订单数据结构：**
```javascript
{
  tableNumber: 'T01',      // 桌号
  personCount: 4,          // 用餐人数
  remark: '少辣',          // 备注
  dishes: [                // 菜品列表
    {
      dishId: 1,           // 菜品ID（手动添加时为null）
      name: '宫保鸡丁',     // 菜品名称
      quantity: 2,         // 数量
      isManual: false      // 是否手动添加
    }
  ]
}
```

## 错误处理

所有服务方法都返回统一的结果格式：

```javascript
{
  success: boolean,     // 操作是否成功
  message: string,      // 操作结果消息
  data: any            // 返回的数据（成功时）
}
```

使用示例：
```javascript
const result = await OrderService.createOrder(orderData)
if (result.success) {
  console.log('成功:', result.data)
} else {
  console.error('失败:', result.message)
}
```

## 测试

提供了完整的测试工具来验证API服务：

```javascript
import { runAllTests } from '@/services/testApi'

// 运行所有测试
const testResults = await runAllTests()
console.log('测试结果:', testResults)
```

## 注意事项

1. **环境配置**：确保 `.env` 文件中正确配置了 `VITE_API_BASE_URL`
2. **错误处理**：建议在业务代码中妥善处理API调用的错误情况
3. **数据验证**：服务层已包含基本的数据验证，但业务层仍需进行适当的验证
4. **性能优化**：对于频繁调用的接口，建议在Store层实现缓存机制
5. **组件使用**：OrderInputModal组件已内置防抖搜索和菜品去重逻辑

## API端点对照

| 功能 | 方法 | 端点 |
|------|------|------|
| 创建订单 | POST | `/api/orders` |
| 订单列表 | GET | `/api/orders` |
| 订单详情 | GET | `/api/orders/:id` |
| 更新订单状态 | PUT | `/api/orders/:id` |
| 创建菜品 | POST | `/api/dishes` |
| 菜品列表 | GET | `/api/dishes` |
| 搜索菜品 | GET | `/api/dishes/search` |
| 催菜 | PUT | `/api/order-items/:id/priority` |
| 标记已出菜 | PUT | `/api/order-items/:id/serve` |
| 待处理菜品 | GET | `/api/serving/pending` |
| 已出菜品 | GET | `/api/serving/served` |

更多详细信息请参考MVP文档中的API接口定义。