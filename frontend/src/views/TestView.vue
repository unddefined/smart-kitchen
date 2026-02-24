<template>
  <div class="test-container">
    <h1>测试页面</h1>
    <p>如果能看到这个页面，说明Vue应用正常工作！</p>
    <div class="test-content">
      <p>当前时间: {{ currentTime }}</p>
      <p>页面加载状态: {{ pageLoaded ? '已加载' : '加载中...' }}</p>
      <button @click="updateTime">更新时间</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref(new Date().toLocaleString())
const pageLoaded = ref(false)

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

onMounted(() => {
  console.log('TestView component mounted')
  pageLoaded.value = true
})
</script>

<style scoped>
.test-container {
  padding: 20px;
  text-align: center;
}

.test-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
</style>