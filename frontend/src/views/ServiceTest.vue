<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">服务测试页面</h2>
    
    <div class="mb-4">
      <button @click="testOrderService" class="bg-blue-500 text-white px-4 py-2 rounded">
        测试 OrderService.getOrders()
      </button>
    </div>
    
    <div v-if="testResult" class="mt-4 p-4 bg-gray-100 rounded">
      <h3 class="font-bold">测试结果:</h3>
      <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="mt-4 p-4 bg-red-100 rounded text-red-700">
      <h3 class="font-bold">错误信息:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { OrderService } from '@/services';

const testResult = ref(null);
const error = ref(null);

const testOrderService = async () => {
  try {
    console.log('开始测试 OrderService...');
    console.log('OrderService 类:', OrderService);
    console.log('getOrders 方法是否存在:', typeof OrderService.getOrders);
    
    const result = await OrderService.getOrders();
    testResult.value = result;
    error.value = null;
    console.log('测试成功:', result);
  } catch (err) {
    error.value = err.message;
    testResult.value = null;
    console.error('测试失败:', err);
  }
};
</script>