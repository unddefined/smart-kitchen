# XSS 防护实施指南

## 概述

本项目已实施全面的 XSS（跨站脚本攻击）防护措施，通过输入验证和数据净化来保护应用安全。

## 安装的依赖

```bash
npm install dompurify
```

**DOMPurify** 是一个强大的 XSS 过滤库，可以清理 HTML 内容，防止 XSS 攻击。

## 核心工具函数

### 位置
`frontend/src/utils/sanitizer.js`

### 主要函数

#### 1. `sanitizeString(input)`
清理单个字符串，移除所有 HTML 标签和脚本。

```javascript
import { sanitizeString } from '@/utils/sanitizer';

const userInput = '<script>alert("XSS")</script>Hello';
const clean = sanitizeString(userInput); 
// 输出："Hello"
```

#### 2. `sanitizeObject(obj)`
递归清理对象中的所有字符串属性。

```javascript
import { sanitizeObject } from '@/utils/sanitizer';

const data = {
  name: '<b>Test</b>',
  remark: '<script>alert("xss")</script>少辣',
  quantity: 2
};

const clean = sanitizeObject(data);
// 输出：{ name: 'Test', remark: '少辣', quantity: 2 }
```

#### 3. `sanitizeOrderItemData(itemData)`
专门用于清理订单菜品数据，重点处理 `remark` 字段。

```javascript
import { sanitizeOrderItemData } from '@/utils/sanitizer';

const itemData = {
  dishId: 1,
  quantity: 2,
  remark: '<img src=x onerror=alert(1)>不要香菜'
};

const clean = sanitizeOrderItemData(itemData);
// remark 被清理为："不要香菜"
```

#### 4. `sanitizeOrderData(orderData)`
清理订单数据，包括台号、备注等字段。

#### 5. `sanitizeDishData(dishData)`
清理菜品数据，包括菜名、描述等。

#### 6. `sanitizeUserData(userData)`
清理用户数据，包括用户名、邮箱等。

## API 层自动防护

### 位置
`frontend/src/services/api.js`

所有发送到后端的 POST/PUT/PATCH 请求都会自动进行数据净化：

```javascript
// 自动净化订单数据
api.orders.create({
  hallNumber: 'T01<script>',
  remark: '<img src=x onerror=alert(1)>测试'
});
// 实际发送的数据已被清理

// 自动净化菜品数据
api.dishes.create({
  name: '<b>宫保鸡丁</b>',
  description: '经典川菜<script>'
});
// 实际发送的数据已被清理

// 自动净化订单菜品数据
api.orderItems.create(orderId, {
  dishId: 1,
  quantity: 2,
  remark: '<script>alert("xss")</script>不要香菜'
});
// remark 字段已被清理
```

## 受保护的 API 端点

以下 API 调用会自动进行数据净化：

### 订单相关
- ✅ `api.orders.create()` - 创建订单
- ✅ `api.orders.update()` - 更新订单信息

### 订单菜品相关
- ✅ `api.orderItems.create()` - 添加菜品到订单
- ✅ `api.orderItems.update()` - 更新订单菜品信息

### 菜品相关
- ✅ `api.dishes.create()` - 创建菜品
- ✅ `api.dishes.update()` - 更新菜品

### 用户相关
- ✅ `api.users.create()` - 创建用户
- ✅ `api.users.update()` - 更新用户

## 前端表单验证

虽然 API 层已有防护，但建议在表单提交前也进行验证：

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.remark" placeholder="备注" />
    <button type="submit">提交</button>
  </form>
</template>

<script>
import { sanitizeString } from '@/utils/sanitizer';

export default {
  data() {
    return {
      formData: {
        remark: ''
      }
    };
  },
  methods: {
    handleSubmit() {
      // 在提交前再次清理
      const cleanedData = {
        ...this.formData,
        remark: sanitizeString(this.formData.remark)
      };
      
      // 发送到 API
      this.$api.orderItems.create(orderId, cleanedData);
    }
  }
};
</script>
```

## 防御层次

本项目的 XSS 防护采用多层次策略：

1. **第一层：前端输入验证**
   - 表单提交前的数据清理
   - 用户友好的即时反馈

2. **第二层：API 层自动净化**
   - 所有发出的请求自动清理
   - 统一的安全策略

3. **第三层：后端验证**
   - 后端也应实施输入验证（需在后端代码中实施）
   - 数据库层面的约束

## 常见攻击示例

以下是会被拦截的 XSS 攻击尝试：

```javascript
// 示例 1：脚本注入
const maliciousInput = '<script>alert("XSS")</script>';
sanitizeString(maliciousInput); 
// 输出：""

// 示例 2：图片事件处理器
const maliciousImg = '<img src=x onerror=alert("XSS")>';
sanitizeString(maliciousImg);
// 输出：""

// 示例 3：SVG 攻击
const maliciousSvg = '<svg onload=alert("XSS")>';
sanitizeString(maliciousSvg);
// 输出：""

// 示例 4：JavaScript 协议
const maliciousLink = 'javascript:alert("XSS")';
sanitizeString(maliciousLink);
// 输出："javascript:alert("XSS")" (纯文本，不会执行)

// 示例 5：HTML 实体编码攻击
const encodedAttack = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
sanitizeString(encodedAttack);
// 输出："<script>alert("XSS")</script>" (文本形式，不会执行)
```

## 性能考虑

- DOMPurify 经过高度优化，性能开销极小
- 单次清理操作通常 < 1ms
- 对用户体验无明显影响

## 最佳实践

1. ✅ **始终信任工具的清理结果** - DOMPurify 是业界标准
2. ✅ **多层防御** - 前端 + 后端都要验证
3. ✅ **及时更新依赖** - 保持 DOMPurify 为最新版本
4. ❌ **不要禁用清理** - 即使看起来"安全"的输入也要清理
5. ❌ **不要重复清理** - 清理一次即可，避免性能浪费

## 测试建议

定期测试 XSS 防护是否有效：

```javascript
// 测试用例
const testCases = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  '"><script>alert("XSS")</script>',
  "';alert('XSS');//",
];

testCases.forEach(test => {
  const cleaned = sanitizeString(test);
  console.log(`输入：${test}`);
  console.log(`输出：${cleaned}`);
  console.log(`包含 script: ${cleaned.includes('<script>')}`);
  console.log('---');
});
```

## 相关文件

- `frontend/src/utils/sanitizer.js` - XSS 防护工具函数
- `frontend/src/services/api.js` - API 服务层（自动调用清理）
- `frontend/package.json` - 依赖配置（包含 dompurify）

## 参考资源

- [DOMPurify 官方文档](https://github.com/cure53/DOMPurify)
- [OWASP XSS 防护指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN XSS 介绍](https://developer.mozilla.org/zh-CN/docs/Glossary/Cross-site_scripting)
