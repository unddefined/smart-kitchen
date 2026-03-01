#!/usr/bin/env node

/**
 * 验证 order_items.quantity 字段小数支持功能
 * 测试数据库字段类型、API 功能和数据处理正确性
 */

const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 按照Prisma 7.4.0+官方文档的方式实例化
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function verifyDatabaseStructure() {
  console.log('🔍 验证数据库结构...');
  
  try {
    // 检查字段类型
    const result = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      AND column_name = 'quantity'
    `;
    
    if (result.length === 0) {
      console.error('❌ 未找到 order_items.quantity 字段');
      return false;
    }
    
    const fieldInfo = result[0];
    console.log('📋 字段信息:');
    console.log(`   名称: ${fieldInfo.column_name}`);
    console.log(`   类型: ${fieldInfo.data_type}`);
    console.log(`   精度: ${fieldInfo.numeric_precision}`);
    console.log(`   小数位: ${fieldInfo.numeric_scale}`);
    console.log(`   默认值: ${fieldInfo.column_default}`);
    
    // 验证是否为正确的decimal类型
    if (fieldInfo.data_type === 'numeric' && 
        fieldInfo.numeric_precision === 3 && 
        fieldInfo.numeric_scale === 1) {
      console.log('✅ 数据库字段类型正确');
      return true;
    } else {
      console.error('❌ 数据库字段类型不符合要求');
      return false;
    }
  } catch (error) {
    console.error('❌ 数据库验证失败:', error.message);
    return false;
  }
}

async function testDecimalOperations() {
  console.log('\n🧪 测试小数操作功能...');
  
  try {
    // 创建测试订单
    const testOrder = await prisma.order.create({
      data: {
        hallNumber: 'TEST999',
        peopleCount: 2,
        tableCount: 1,
        status: 'created',
        mealTime: new Date(),
        mealType: '午餐'
      }
    });
    
    console.log(`✅ 创建测试订单: ${testOrder.id}`);
    
    // 测试不同精度的小数插入
    const testQuantities = [0.1, 1.5, 2.7, 10.0, 99.9];
    const testItems = [];
    
    for (const qty of testQuantities) {
      try {
        const item = await prisma.orderItem.create({
          data: {
            orderId: testOrder.id,
            dishId: 1, // 假设存在ID为1的菜品
            quantity: qty,
            status: 'pending',
            priority: 0
          }
        });
        testItems.push(item);
        console.log(`✅ 插入 quantity=${qty}: 成功`);
      } catch (error) {
        console.log(`❌ 插入 quantity=${qty}: 失败 - ${error.message}`);
      }
    }
    
    // 查询验证数据
    const retrievedItems = await prisma.orderItem.findMany({
      where: { orderId: testOrder.id },
      select: { id: true, quantity: true, status: true }
    });
    
    console.log('\n📋 查询结果验证:');
    retrievedItems.forEach(item => {
      console.log(`   ID: ${item.id}, Quantity: ${item.quantity}, Status: ${item.status}`);
    });
    
    // 清理测试数据
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrder.id }
    });
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    
    console.log('✅ 测试数据清理完成');
    return true;
  } catch (error) {
    console.error('❌ 小数操作测试失败:', error.message);
    return false;
  }
}

async function testBoundaryConditions() {
  console.log('\n🚧 测试边界条件...');
  
  try {
    const testOrder = await prisma.order.create({
      data: {
        hallNumber: 'BOUNDARY',
        peopleCount: 1,
        tableCount: 1,
        status: 'created',
        mealTime: new Date(),
        mealType: '午餐'
      }
    });
    
    // 测试边界值
    const boundaryTests = [
      { value: 0.0, expected: 'fail' },    // 小于最小值
      { value: 0.1, expected: 'success' }, // 最小值
      { value: 99.9, expected: 'success' }, // 最大值
      { value: 100.0, expected: 'fail' },   // 超过最大值
      { value: -1.5, expected: 'fail' }     // 负数
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const test of boundaryTests) {
      try {
        await prisma.orderItem.create({
          data: {
            orderId: testOrder.id,
            dishId: 1,
            quantity: test.value,
            status: 'pending'
          }
        });
        
        if (test.expected === 'success') {
          console.log(`✅ 边界测试 ${test.value}: 符合预期`);
          successCount++;
        } else {
          console.log(`❌ 边界测试 ${test.value}: 应该失败但成功了`);
          failCount++;
        }
      } catch (error) {
        if (test.expected === 'fail') {
          console.log(`✅ 边界测试 ${test.value}: 符合预期失败`);
          successCount++;
        } else {
          console.log(`❌ 边界测试 ${test.value}: 应该成功但失败了 - ${error.message}`);
          failCount++;
        }
      }
    }
    
    // 清理
    await prisma.orderItem.deleteMany({
      where: { orderId: testOrder.id }
    });
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    
    console.log(`\n📊 边界测试结果: ${successCount} 成功, ${failCount} 失败`);
    return failCount === 0;
  } catch (error) {
    console.error('❌ 边界条件测试失败:', error.message);
    return false;
  }
}

async function verifyExistingData() {
  console.log('\n📂 验证现有数据兼容性...');
  
  try {
    // 检查现有数据的分布
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_count,
        MIN(quantity) as min_quantity,
        MAX(quantity) as max_quantity,
        AVG(quantity) as avg_quantity
      FROM order_items
    `;
    
    console.log('📊 现有数据统计:');
    console.log(`   总记录数: ${stats[0].total_count}`);
    console.log(`   最小值: ${stats[0].min_quantity}`);
    console.log(`   最大值: ${stats[0].max_quantity}`);
    console.log(`   平均值: ${Number(stats[0].avg_quantity).toFixed(2)}`);
    
    // 检查是否有超出新范围的数据
    const outOfRange = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM order_items 
      WHERE quantity < 0.1 OR quantity > 99.9
    `;
    
    if (outOfRange[0].count > 0) {
      console.warn(`⚠️  发现 ${outOfRange[0].count} 条记录超出新范围 (0.1-99.9)`);
    } else {
      console.log('✅ 所有现有数据都在新范围内');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 现有数据验证失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始验证 quantity 小数支持功能...\n');
  
  let allTestsPassed = true;
  
  // 执行各项验证
  const dbCheck = await verifyDatabaseStructure();
  allTestsPassed = allTestsPassed && dbCheck;
  
  const decimalTest = await testDecimalOperations();
  allTestsPassed = allTestsPassed && decimalTest;
  
  const boundaryTest = await testBoundaryConditions();
  allTestsPassed = allTestsPassed && boundaryTest;
  
  const dataCheck = await verifyExistingData();
  allTestsPassed = allTestsPassed && dataCheck;
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 所有验证测试通过！');
    console.log('✅ quantity 字段小数支持功能正常工作');
  } else {
    console.log('❌ 部分验证测试失败');
    console.log('⚠️  请检查上述错误信息');
  }
  console.log('='.repeat(50));
  
  await prisma.$disconnect();
  process.exit(allTestsPassed ? 0 : 1);
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('验证脚本执行出错:', error);
  process.exit(1);
});