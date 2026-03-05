/**
 * 检查订单菜品数据状态
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderItemsStatus() {
  console.log('🔍 检查订单菜品数据...\n');
  
  try {
    // 查询所有订单及其菜品
    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (orders.length === 0) {
      console.log('❌ 数据库中没有订单数据');
      return;
    }

    console.log(`📊 找到 ${orders.length} 个订单\n`);

    for (const order of orders) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`订单 ID: ${order.id}`);
      console.log(`桌号：${order.hallNumber}`);
      console.log(`状态：${order.status}`);
      console.log(`用餐时间：${order.mealTime}`);
      console.log(`创建时间：${new Date(order.createdAt).toLocaleString('zh-CN')}`);
      console.log(`起菜时间：${order.startTime ? new Date(order.startTime).toLocaleString('zh-CN') : '未起菜'}`);
      console.log(`菜品数量：${order.orderItems.length}`);
      
      if (order.orderItems.length > 0) {
        console.log('\n菜品列表:');
        console.log('-'.repeat(60));
        
        let pendingCount = 0;
        let servedCount = 0;
        let otherCount = 0;
        
        for (const item of order.orderItems) {
          const dishName = item.dish?.name || '未知菜品';
          const categoryName = item.dish?.category?.name || '未知分类';
          const quantity = item.quantity;
          const priority = item.priority;
          const status = item.status;
          const remark = item.remark || '';
          
          // 统计状态
          if (status === 'pending') pendingCount++;
          else if (status === 'served') servedCount++;
          else otherCount++;
          
          const priorityText = priority === 3 ? '🔴红' : 
                              priority === 2 ? '🟡黄' : 
                              priority === 1 ? '🟢绿' : 
                              priority === 0 ? '⚪灰' : '⚫黑';
          
          const statusIcon = status === 'pending' ? '⏳待制作' :
                            status === 'prep' ? '🔥制作中' :
                            status === 'ready' ? '✅已备好' :
                            status === 'served' ? '✔️已上菜' :
                            `❓${status}`;
          
          console.log(`  ${priorityText} [${statusIcon}] ${dishName} (${categoryName}) ×${quantity}${remark ? ' - ' + remark : ''}`);
          console.log(`     ID: ${item.id}, 优先级：${priority}, 状态：${status}`);
        }
        
        console.log('\n状态统计:');
        console.log(`  ⏳ 待制作 (pending): ${pendingCount}`);
        console.log(`  ✔️ 已上菜 (served): ${servedCount}`);
        console.log(`  ❓ 其他状态：${otherCount}`);
      } else {
        console.log('  (无菜品)');
      }
    }

    // 统计所有订单菜品的状态分布
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📈 全局统计:');
    
    const allItems = await prisma.orderItem.findMany({
      include: {
        dish: true,
        order: true,
      },
    });

    const statusMap: Record<string, number> = {};
    const priorityMap: Record<number, number> = {};

    for (const item of allItems) {
      statusMap[item.status] = (statusMap[item.status] || 0) + 1;
      priorityMap[item.priority] = (priorityMap[item.priority] || 0) + 1;
    }

    console.log('\n按状态分组:');
    Object.entries(statusMap).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n按优先级分组:');
    Object.entries(priorityMap)
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([priority, count]) => {
        const icon = priority === '3' ? '🔴' : 
                    priority === '2' ? '🟡' : 
                    priority === '1' ? '🟢' : 
                    priority === '0' ? '⚪' : '⚫';
        console.log(`  ${icon} 优先级${priority}: ${count}`);
      });

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderItemsStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
