# 智能厨房出餐逻辑系统MVP文档

## 📋 系统概述

根据MVP文档要求实现的智能厨房出餐逻辑系统，实现了完整的菜品优先级管理、状态跟踪和可视化展示功能。

## 🎯 核心功能实现

### 1. 智能优先级管理

**优先级规则**：
- 🔴 **红色卡片（优先级3）**：催菜处理，最紧急
- 🟡 **黄色卡片（优先级2）**：等待处理，中等紧急  
- 🟢 **绿色卡片（优先级1）**：正常处理，一般紧急
- ⚪ **灰色卡片（优先级0）**：未起菜，待处理
- 🖤 **黑色卡片（优先级-1）**：已出菜品

**分类优先级设置**：
- **前菜**：优先级3（红色）
- **中菜**：优先级2（黄色）
- **后菜**：优先级1（绿色）
- **尾菜**：优先级1（绿色）
- **后来加菜**：统一优先级3（红色）

### 2. 出餐顺序逻辑

严格按照MVP文档要求的顺序：
```
前菜(3) → 中菜(2) → 后菜(1) → 尾菜(1)
```

**自动调整机制**：
- 前面菜品完成后，后面菜品自动+1优先级
- 后来加菜（订单创建10分钟后添加）自动获得优先级3
- 系统定期检查并纠正不符合规则的优先级

### 3. 状态管理流程

```
pending(待制作) 
    ↓ 开始制作
prep(制作中)
    ↓ 制作完成
ready(准备完成)
    ↓ 上菜完成
served(已上菜，优先级-1)
```

## 🏗️ 系统架构

### 数据库层
- **核心函数**：`calculate_dish_priority_mvp()` - 优先级计算
- **视图**：
  - `dish_serving_order_mvp` - 出餐顺序配置
  - `order_item_serving_status_mvp` - 订单菜品状态
  - `serving_alerts_mvp` - 出餐提醒
- **存储过程**：
  - `auto_adjust_priorities_for_order()` - 自动优先级调整
  - `complete_dish_prep_mvp()` - 制作完成处理
  - `serve_dish_mvp()` - 上菜处理
  - `detect_urgent_dishes()` - 紧急菜品检测

### 后端API层 (NestJS)
- **服务**：`ServingService` - 核心业务逻辑
- **控制器**：`ServingController` - RESTful API接口
- **模块**：`ServingModule` - 模块整合

### 前端展示层 (Vue3)
- **总览视图**：`ServingOverview.vue` - 卡片化展示
- **状态管理**：`serving.js` - Pinia store
- **订单录入**：`OrderEntryForm.vue` - 表单组件

## 📊 API接口文档

### 核心接口

#### 获取订单出餐状态
```
GET /api/serving/orders/:orderId/status
```

#### 更新菜品优先级（催菜）
```
PUT /api/serving/items/:itemId/priority
Body: { priority: 3, reason: "客户催菜" }
```

#### 标记制作完成
```
POST /api/serving/items/:itemId/complete-prep
```

#### 标记已上菜
```
POST /api/serving/items/:itemId/serve
```

#### 自动调整优先级
```
POST /api/serving/orders/:orderId/auto-adjust
```

#### 获取出餐提醒
```
GET /api/serving/alerts
```

#### 检测紧急菜品
```
GET /api/serving/urgent-dishes
```

## 🎨 前端界面特性

### 总览视图
- **双列卡片展示**：菜品名称自动截断显示
- **颜色编码**：红黄绿灰四种状态颜色
- **自动合并**：同名同优先级菜品自动合并数量
- **详细信息**：显示份量、备注等详细信息

### 交互功能
- **点击操作**：出菜、完成切配处理
- **双击操作**：打开菜谱详情
- **右键菜单**：增减数量、调整优先级
- **拖拽排序**：按优先级自动排序

### 订单详情视图
- **已出菜品**：瀑布流展示，5秒自动折叠
- **待上菜品**：按优先级分组展示
- **实时更新**：状态变更即时反映

## 🚀 部署说明

### 一键部署脚本

**Linux/Mac**：
```bash
chmod +x scripts/deploy-serving-mvp.sh
./scripts/deploy-serving-mvp.sh
```

**Windows**：
```batch
scripts\deploy-serving-mvp.bat
```

### 手动部署步骤

1. **部署数据库逻辑**：
```bash
psql -h localhost -U postgres -d smart_kitchen_prod -f database/serving-logic-mvp.sql
```

2. **启动后端服务**：
```bash
cd backend
npm install
npm run build
npm run start:prod
```

3. **构建前端应用**：
```bash
cd frontend
npm install
npm run build
```

## 🔧 系统验证

### 数据库验证查询

```sql
-- 查看出餐顺序配置
SELECT * FROM dish_serving_order_mvp ORDER BY serving_sequence;

-- 查看订单出餐状态
SELECT * FROM order_item_serving_status_mvp WHERE order_id = 1;

-- 查看出餐提醒
SELECT * FROM serving_alerts_mvp;

-- 检测紧急菜品
SELECT * FROM detect_urgent_dishes();
```

### 功能测试用例

1. **优先级计算测试**：
   - 前菜应为优先级3
   - 中菜应为优先级2
   - 后来加菜应为优先级3

2. **状态流转测试**：
   - pending → prep → ready → served
   - 每个状态转换都应正确更新

3. **自动调整测试**：
   - 完成前菜后中菜优先级应+1
   - 后来加菜应自动获得优先级3

## 📈 性能优化

### 数据库优化
- 关键字段建立索引
- 使用视图减少重复计算
- 合理设计存储过程

### 前端优化
- 虚拟滚动处理大量数据
- 防抖节流优化频繁操作
- 组件懒加载提升性能

## 🔒 安全考虑

- API接口认证授权
- 数据库连接加密
- 输入验证和SQL注入防护
- XSS攻击防护

## 🐛 故障排除

### 常见问题

1. **优先级不更新**
   - 检查存储过程执行权限
   - 验证触发器是否正常工作

2. **状态流转异常**
   - 检查外键约束和状态限制
   - 验证业务逻辑是否正确

3. **界面显示异常**
   - 检查前端API调用是否成功
   - 验证数据格式是否正确

### 调试命令

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看数据库连接
psql -h localhost -U postgres -d smart_kitchen_prod -c "SELECT * FROM pg_stat_activity;"

# 前端调试
npm run serve -- --mode development
```

## 📅 版本历史

### v1.0.0 (MVP版本)
- ✅ 实现出餐优先级管理
- ✅ 实现状态跟踪和提醒
- ✅ 实现前端可视化界面
- ✅ 实现完整的API接口
- ✅ 实现一键部署脚本

## 📞 技术支持

如有问题请联系技术支持团队或查看相关文档。

---
**文档版本**: v1.0.0  
**最后更新**: 2026年  
**适用版本**: MVP v1.0