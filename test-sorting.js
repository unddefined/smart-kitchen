// 测试优先级排序逻辑
const testDishes = [
  { name: '宫保鸡丁', priority: 1, quantity: 2 },
  { name: '麻婆豆腐', priority: 3, quantity: 1 },
  { name: '红烧肉', priority: 2, quantity: 3 },
  { name: '清蒸鲈鱼', priority: 1, quantity: 1 },
  { name: '糖醋里脊', priority: 3, quantity: 2 }
];

console.log('排序前:', testDishes);

// 模拟排序逻辑
const sortedDishes = [...testDishes].sort((a, b) => {
  // 优先按优先级降序排列
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }
  // 优先级相同时按名称排序
  return a.name.localeCompare(b.name);
});

console.log('排序后:', sortedDishes);

// 验证排序结果
console.log('\n排序验证:');
sortedDishes.forEach((dish, index) => {
  console.log(`${index + 1}. ${dish.name} (优先级: ${dish.priority})`);
});