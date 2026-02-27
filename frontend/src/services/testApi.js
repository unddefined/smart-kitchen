// API服务测试文件
import { api, OrderService, DishService, ServingService } from "./index";

// 测试API连接
export const testApiConnection = async () => {
  try {
    console.log("🧪 开始测试API连接...");

    // 测试健康检查
    const health = await api.health.check();
    console.log("✅ 健康检查通过:", health);

    return { success: true, message: "API连接正常" };
  } catch (error) {
    console.error("❌ API连接测试失败:", error);
    return { success: false, message: "API连接失败: " + error.message };
  }
};

// 测试订单服务
export const testOrderService = async () => {
  try {
    console.log("🧪 开始测试订单服务...");

    // 测试获取订单列表
    const orders = await OrderService.getOrders();
    console.log("✅ 获取订单列表成功，共", orders.length, "个订单");

    // 测试创建订单（使用测试数据）
    const testOrder = {
      hallNumber: "T01",
      peopleCount: 4,
      tableCount: 1,
      mealTime: "2026-02-22 午餐",
    };

    const createResult = await OrderService.createOrder(testOrder);
    console.log("✅ 创建订单结果:", createResult);

    return { success: true, message: "订单服务测试通过" };
  } catch (error) {
    console.error("❌ 订单服务测试失败:", error);
    return { success: false, message: "订单服务测试失败: " + error.message };
  }
};

// 测试菜品服务
export const testDishService = async () => {
  try {
    console.log("🧪 开始测试菜品服务...");

    // 测试获取菜品列表
    const dishes = await DishService.getAllDishes();
    console.log("✅ 获取菜品列表成功，共", dishes.length, "个菜品");

    // 测试搜索菜品
    const searchResults = await DishService.searchDishes("鱼");
    console.log("✅ 搜索菜品成功，找到", searchResults.length, "个结果");

    return { success: true, message: "菜品服务测试通过" };
  } catch (error) {
    console.error("❌ 菜品服务测试失败:", error);
    return { success: false, message: "菜品服务测试失败: " + error.message };
  }
};

// 测试出餐服务
export const testServingService = async () => {
  try {
    console.log("🧪 开始测试出餐服务...");

    // 测试获取待处理菜品
    const pendingItems = await ServingService.getPendingItems();
    console.log("✅ 获取待处理菜品成功，共", pendingItems.length, "个");

    // 测试获取已出菜品
    const servedItems = await ServingService.getServedItems();
    console.log("✅ 获取已出菜品成功，共", servedItems.length, "个");

    // 测试检测紧急菜品
    const urgentItems = await ServingService.detectUrgentDishes();
    console.log("✅ 检测紧急菜品成功，共", urgentItems.length, "个");

    return { success: true, message: "出餐服务测试通过" };
  } catch (error) {
    console.error("❌ 出餐服务测试失败:", error);
    return { success: false, message: "出餐服务测试失败: " + error.message };
  }
};

// 运行所有测试
export const runAllTests = async () => {
  console.log("🚀 开始运行所有API服务测试...\n");

  const tests = [
    { name: "API连接测试", fn: testApiConnection },
    { name: "订单服务测试", fn: testOrderService },
    { name: "菜品服务测试", fn: testDishService },
    { name: "出餐服务测试", fn: testServingService },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🔍 正在运行: ${test.name}`);
    console.log("─".repeat(50));

    try {
      const result = await test.fn();
      results.push({ ...result, testName: test.name });

      if (result.success) {
        console.log(`✅ ${test.name} 通过`);
      } else {
        console.log(`❌ ${test.name} 失败: ${result.message}`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} 发生异常:`, error);
      results.push({
        success: false,
        message: error.message,
        testName: test.name,
      });
    }
  }

  // 输出测试总结
  console.log("\n📊 测试总结");
  console.log("═".repeat(50));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`总计: ${results.length} 个测试`);
  console.log(`✅ 通过: ${passed} 个`);
  console.log(`❌ 失败: ${failed} 个`);

  if (failed > 0) {
    console.log("\n失败的测试:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.testName}: ${r.message}`);
      });
  }

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
};

// 导出测试函数
export default {
  testApiConnection,
  testOrderService,
  testDishService,
  testServingService,
  runAllTests,
};
