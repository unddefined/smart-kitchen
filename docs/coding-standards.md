# 代码规范与最佳实践指南

## 目录
1. [通用编码规范](#通用编码规范)
2. [Vue3 + Composition API规范](#vue3--composition-api规范)
3. [TypeScript编码规范](#typescript编码规范)
4. [CSS/Tailwind规范](#csstailwind规范)
5. [Git工作流规范](#git工作流规范)
6. [测试规范](#测试规范)
7. [性能优化最佳实践](#性能优化最佳实践)
8. [安全编码规范](#安全编码规范)

## 通用编码规范

### 命名约定

#### 文件命名
```bash
# 组件文件
UserProfile.vue          # PascalCase
user-profile.vue         # kebab-case (推荐)

# 工具函数
formatDate.js           # camelCase
date-utils.js           # 描述性命名

# 配置文件
vite.config.js          # 点分隔命名
tailwind.config.js
```

#### 变量命名
```javascript
// ✅ 推荐
const userName = 'John'
const isActive = true
const userList = []
const MAX_RETRY_COUNT = 3

// ❌ 避免
const usrNm = 'John'     // 缩写不清晰
const flag = true        // 含义不明
const arr = []           // 类型不明确
const m = 3              // 魔法数字
```

#### 函数命名
```javascript
// 动词开头，描述行为
function getUserInfo() {}
function validateForm() {}
function handleSubmit() {}
function fetchData() {}

// 布尔返回值函数
function isValid() {}
function hasPermission() {}
function isEmpty() {}
```

### 代码结构

#### 文件长度控制
- 单个文件不超过500行
- 组件文件建议200-300行
- 函数长度不超过50行

#### 注释规范
```javascript
/**
 * 获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Promise<User>} 用户信息对象
 * @throws {Error} 当用户不存在时抛出错误
 */
async function getUserInfo(userId) {
  // 参数验证
  if (!userId) {
    throw new Error('用户ID不能为空')
  }
  
  // 业务逻辑
  const user = await fetchUser(userId)
  
  // 返回结果
  return user
}
```

## Vue3 + Composition API规范

### 组件结构规范

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入语句
import { ref, computed, watch } from 'vue'
import UserProfile from './UserProfile.vue'

// 2. Props定义
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// 3. emits定义
const emit = defineEmits(['update:modelValue', 'submit'])

// 4. 响应式数据
const count = ref(0)
const formData = reactive({
  name: '',
  email: ''
})

// 5. 计算属性
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// 6. 监听器
watch(count, (newVal, oldVal) => {
  console.log('count changed:', newVal)
})

// 7. 生命周期钩子
onMounted(() => {
  fetchData()
})

// 8. 方法定义
function increment() {
  count.value++
}

function handleSubmit() {
  // 表单提交逻辑
}
</script>

<style scoped>
/* 样式内容 */
</style>
```

### Composition API最佳实践

#### 逻辑复用 - Composables
```javascript
// composables/useAuth.js
import { ref, computed } from 'vue'

export function useAuth() {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  
  async function login(credentials) {
    try {
      const userData = await api.login(credentials)
      user.value = userData
      return userData
    } catch (error) {
      throw new Error('登录失败')
    }
  }
  
  function logout() {
    user.value = null
  }
  
  return {
    user,
    isAuthenticated,
    login,
    logout
  }
}
```

#### 状态管理规范
```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    permissions: []
  }),
  
  getters: {
    isAdmin: (state) => state.permissions.includes('admin'),
    displayName: (state) => state.profile?.name || '访客'
  },
  
  actions: {
    async fetchProfile() {
      try {
        this.profile = await api.getUserProfile()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },
    
    updateProfile(data) {
      this.profile = { ...this.profile, ...data }
    }
  }
})
```

## TypeScript编码规范

### 类型定义

#### 基础类型
```typescript
// 接口定义
interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

// 类型别名
type Status = 'pending' | 'processing' | 'completed' | 'failed'

// 泛型使用
interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}
```

#### Vue组件类型
```typescript
// Props类型定义
interface Props {
  title: string
  count?: number
  onUpdate?: (value: string) => void
}

const props = defineProps<Props>()

// Emit类型定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: FormData): void
}>()
```

### 类型安全实践

```typescript
// 严格的null检查
function processUser(user: User | null) {
  if (!user) {
    return
  }
  // 现在user类型被缩小为User
  console.log(user.name)
}

// 类型守卫
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string'
}

// 模板字符串类型
type RoutePath = `/api/${string}`
const userApi: RoutePath = '/api/users'
```

## CSS/Tailwind规范

### Tailwind使用规范

#### 基础类组合
```vue
<!-- ✅ 推荐：语义化组合 -->
<div class="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
  <h2 class="text-lg font-semibold text-gray-900 mb-2">标题</h2>
  <p class="text-gray-600">内容描述</p>
</div>

<!-- ❌ 避免：过度定制 -->
<div class="py-4 px-4 bg-[#ffffff] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
  ...
</div>
```

#### 响应式设计
```vue
<!-- 移动优先设计 -->
<div class="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
  <!-- 内容 -->
</div>

<!-- 断点前缀使用 -->
<button class="text-sm md:text-base lg:text-lg">
  按钮
</button>
```

#### 状态变体
```vue
<!-- 悬停和焦点状态 -->
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
  提交
</button>

<!-- 条件渲染类 -->
<div :class="[
  'p-4 rounded-lg',
  isActive ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'
]">
  内容
</div>
```

### 自定义CSS规范

```css
/* 组件作用域样式 */
.card {
  @apply p-6 bg-white rounded-xl shadow-sm;
  transition: all 0.2s ease;
}

.card:hover {
  @apply shadow-md;
}

/* CSS变量定义 */
:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --border-radius: 0.5rem;
}

/* 媒体查询 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

## Git工作流规范

### 分支命名规范
```bash
# 功能开发
feature/user-authentication
feature/order-management

# Bug修复
bug/login-error-fix
hotfix/critical-security-issue

# 版本发布
release/v1.2.0
release/v2.0.0-beta

# 文档更新
docs/api-documentation
docs/user-guide-update
```

### 提交信息规范
```bash
# 格式：type(scope): subject
feat(auth): 添加用户登录功能
fix(order): 修复订单状态更新bug
docs(readme): 更新项目说明文档
style(button): 优化按钮样式
refactor(api): 重构用户API接口
test(login): 添加登录功能测试
chore(deps): 更新依赖包版本

# 详细提交示例
git commit -m "feat(user): 实现用户注册登录功能

- 添加用户注册表单验证
- 集成JWT认证机制
- 实现记住我功能
- 添加密码强度检测"
```

### 代码审查清单
- [ ] 代码符合编码规范
- [ ] 功能实现完整且正确
- [ ] 添加了必要的单元测试
- [ ] 文档已相应更新
- [ ] 没有引入新的警告或错误
- [ ] 性能影响已评估
- [ ] 安全性已考虑

## 测试规范

### 单元测试结构
```javascript
// __tests__/user-service.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { UserService } from '@/services/user'

describe('UserService', () => {
  let userService
  
  beforeEach(() => {
    userService = new UserService()
  })
  
  describe('getUserById', () => {
    it('应该返回正确的用户信息', async () => {
      const user = await userService.getUserById(1)
      expect(user).toHaveProperty('id', 1)
      expect(user).toHaveProperty('name')
    })
    
    it('当用户不存在时应该抛出错误', async () => {
      await expect(userService.getUserById(999))
        .rejects.toThrow('用户不存在')
    })
  })
})
```

### 组件测试
```javascript
// __tests__/UserCard.test.js
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com'
  }
  
  it('应该正确显示用户信息', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    expect(wrapper.text()).toContain(mockUser.name)
    expect(wrapper.text()).toContain(mockUser.email)
  })
  
  it('点击删除按钮应该触发delete事件', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })
    
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
```

## 性能优化最佳实践

### Vue性能优化

#### 计算属性缓存
```javascript
// ✅ 利用计算属性缓存
const expensiveValue = computed(() => {
  return heavyCalculation(props.data)
})

// ❌ 避免在模板中使用方法
// <div>{{ calculateExpensiveValue() }}</div>
```

#### 组件懒加载
```javascript
// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue')
  }
]

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

#### 列表渲染优化
```vue
<!-- 使用key优化列表渲染 -->
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>

<!-- 虚拟滚动处理长列表 -->
<VirtualList :items="largeList" :item-height="50">
  <template #default="{ item }">
    <ListItem :data="item" />
  </template>
</VirtualList>
```

### 网络请求优化

```javascript
// 请求防抖
const debouncedSearch = debounce(async (query) => {
  const results = await searchApi(query)
  searchResults.value = results
}, 300)

// 请求缓存
const cache = new Map()

async function cachedRequest(url, options = {}) {
  const cacheKey = `${url}_${JSON.stringify(options)}`
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  
  const response = await fetch(url, options)
  const data = await response.json()
  
  cache.set(cacheKey, data)
  return data
}
```

## 安全编码规范

### XSS防护
```javascript
// ✅ 使用v-text或Mustache语法自动转义
<span>{{ user.input }}</span>

// ❌ 避免使用v-html处理用户输入
<!-- <div v-html="user.content"></div> -->

// 如果必须使用v-html，请先清理内容
import DOMPurify from 'dompurify'

const sanitizedContent = computed(() => {
  return DOMPurify.sanitize(props.userContent)
})
```

### CSRF防护
```javascript
// Axios拦截器添加CSRF令牌
axios.interceptors.request.use(config => {
  const token = getCsrfToken()
  if (token) {
    config.headers['X-CSRF-Token'] = token
  }
  return config
})
```

### 输入验证
```javascript
// 前端验证
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// 后端验证同样重要
// 不要仅依赖前端验证
```

### 敏感信息处理
```javascript
// 环境变量使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 避免在代码中硬编码敏感信息
// ❌ const apiKey = 'sk-123456789'
// ✅ const apiKey = import.meta.env.VITE_OPENAI_API_KEY
```

## 附录

### 推荐工具链
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^2.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "eslint-plugin-vue": "^9.0.0"
  }
}
```

### ESLint配置示例
```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    '@vue/eslint-config-typescript',
    'plugin:vue/vue3-recommended'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
```

---
*文档版本: v1.0* | *最后更新: 2024年1月*