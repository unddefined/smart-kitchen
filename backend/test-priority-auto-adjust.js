/**
 * 菜品优先级自动调整功能测试
 * 
 * 测试场景:
 * 1. 起菜时初始化优先级
 * 2. 上菜后后续菜品优先级自动 +1
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPriorityLogic() {
  console.log('🧪 开始测试菜品优先级自动调整逻辑...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. 创建测试订单
    console.log('📝 创建测试订单...');
    const testOrder = await prisma.order.create({
      data: {
        hallNumber: '测试台 1',
        peopleCount: 4,
        tableCount: 1,
        mealTime: new Date(),
        mealType: 'lunch',
        status: 'started',
      },
    });
    console.log(`✅ 订单创建成功，ID: ${testOrder.id}\n`);
    
    // 2. 获取测试菜品
    console.log('🍽️  获取测试菜品...');
    const dishes = await prisma.dish.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      take: 6, // 取 6 个菜品
    });
    
    if (dishes.length < 6) {
      console.log('❌ 数据库中菜品数量不足，无法测试');
      return;
    }
    
    console.log(`找到 ${dishes.length} 个菜品\n`);
    
    // 3. 创建订单项 (模拟不同分类的菜品)
    console.log('📋 创建订单项...');
    const orderItems = [];
    for (let i = 0; i < Math.min(6, dishes.length); i++) {
      const dish = dishes[i];
      const item = await prisma.orderItem.create({
        data: {
          orderId: testOrder.id,
          dishId: dish.id,
          quantity: 1.0,
          status: 'pending',
          priority: 0, // 初始优先级为 0
          remark: `测试菜品 ${i + 1}`,
        },
        include: {
          dish: {
            include: {
              category: true,
            },
          },
        },
      });
      orderItems.push(item);
      console.log(`  - ${dish.name} (${dish.category?.name || '未知'}): 优先级 ${item.priority}`);
    }
    console.log('');
    
    // 4. 测试起菜并初始化优先级
    console.log('🚀 测试起菜并初始化优先级...');
    const startedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: { status: 'serving', startTime: new Date() },
    });
    console.log(`✅ 订单状态已更新为: ${startedOrder.status}\n`);
    
    // 5. 手动初始化优先级 (模拟 OrdersService.startServing 的逻辑)
    console.log('⚙️  初始化菜品优先级...');
    const priorityMap = {
      '前菜': 3,
      '中菜': 2,
      '点心': 2,
      '蒸菜': 2,
      '后菜': 1,
      '尾菜': 1,
      '凉菜': 3,
    };
    
    for (const item of orderItems) {
      const categoryName = item.dish.category?.name;
      const priority = priorityMap[categoryName] || 0;
      
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { priority },
      });
      
      console.log(`  - ${item.dish.name} (${categoryName}): 优先级 → ${priority}`);
    }
    console.log('');
    
    // 6. 测试上菜并触发优先级调整
    console.log('🎯 测试第一道菜上菜并触发后续优先级调整...');
    const firstItem = orderItems[0];
    await prisma.orderItem.update({
      where: { id: firstItem.id },
      data: {
        status: 'served',
        servedAt: new Date(),
      },
    });
    console.log(`✅ ${firstItem.dish.name} 已上菜\n`);
    
    // 7. 检查剩余菜品的优先级是否自动 +1
    console.log('📊 检查后续菜品优先级调整结果...');
    const remainingItems = await prisma.orderItem.findMany({
      where: {
        orderId: testOrder.id,
        status: { not: 'served' },
      },
      include: {
        dish: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    let adjustedCount = 0;
    for (const item of remainingItems) {
      const oldPriority = priorityMap[item.dish.category?.name] || 0;
      const expectedNewPriority = Math.min(oldPriority + 1, 3);
      const actualPriority = item.priority;
      
      const isAdjusted = actualPriority === expectedNewPriority;
      adjustedCount += isAdjusted ? 1 : 0;
      
      const status = isAdjusted ? '✅' : '❌';
      console.log(`${status} ${item.dish.name} (${item.dish.category?.name}): ${oldPriority} → ${actualPriority} (期望：${expectedNewPriority})`);
    }
    
    console.log(`\n📈 调整成功率：${adjustedCount}/${remainingItems.length}\n`);
    
    // 8. 测试第二道菜上菜
    if (remainingItems.length > 0) {
      console.log('🎯 测试第二道菜上菜...');
      const secondItem = remainingItems[0];
      await prisma.orderItem.update({
        where: { id: secondItem.id },
        data: {
          status: 'served',
          servedAt: new Date(),
        },
      });
      console.log(`✅ ${secondItem.dish.name} 已上菜\n`);
      
      // 9. 再次检查优先级
      const stillRemainingItems = await prisma.orderItem.findMany({
        where: {
          orderId: testOrder.id,
          status: { not: 'served' },
        },
        include: {
          dish: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      
      console.log('📊 第二次优先级检查结果:');
      for (const item of stillRemainingItems) {
        console.log(`  - ${item.dish.name} (${item.dish.category?.name}): 优先级 ${item.priority}`);
      }
      console.log('');
    }
    
    // 10. 清理测试数据
    console.log('🗑️  清理测试数据...');
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrder.id },
    });
    await prisma.order.delete({
      where: { id: testOrder.id },
    });
    console.log('✅ 测试数据已清理\n');
    
    console.log('✨ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    // 清理可能残留的数据
    try {
      const testOrders = await prisma.order.findMany({
        where: { hallNumber: '测试台 1' },
      });
      
      for (const order of testOrders) {
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
      }
      console.log('🗑️  已清理残留测试数据');
    } catch (cleanupError) {
      console.error('清理失败:', cleanupError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testPriorityLogic()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
