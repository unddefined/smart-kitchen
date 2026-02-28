<template>
  <div class="test-nav">
    <nav class="nav-container">
      <router-link to="/" class="nav-item" :class="{ active: $route.name === 'Cooking' }">
        烹饪主页
      </router-link>
      <router-link to="/order-test" class="nav-item" :class="{ active: $route.name === 'OrderDataTest' }">
        订单测试
      </router-link>
    </nav>
  </div>
</template>

<script setup>
// 测试导航组件
</script>

<style scoped>
.test-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #3b82f6;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-item {
  flex: 1;
  padding: 16px;
  text-align: center;
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-bottom-color: white;
}

@media (max-width: 480px) {
  .nav-item {
    padding: 12px;
    font-size: 14px;
  }
}
</style>