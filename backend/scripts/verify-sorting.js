#!/usr/bin/env node

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifySorting() {
  console.log('🔍 验证菜品排序功能...\n');
  
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 测试1: 验证分类按display_order排序
    console.log('📋 测试1: 分类按display_order排序');
    const categories = await prisma.dishCategory.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('分类排序结果:');
    categories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (display_order: ${cat.displayOrder})`);
    });

    // 测试2: 验证菜品按分类排序
    console.log('\n🍽️  测试2: 菜品按分类排序');
    const dishes = await prisma.dish.findMany({
      include: {
        category: true
      },
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      },
      take: 15
    });

    console.log('前15个菜品的排序:');
    let currentCategory = null;
    dishes.forEach((dish, index) => {
      if (currentCategory !== dish.category.name) {
        currentCategory = dish.category.name;
        console.log(`\n  ${currentCategory}:`);
      }
      console.log(`    ${dish.name}`);
    });

    // 测试3: 验证分组查询功能
    console.log('\n📊 测试3: 按分类分组的菜品');
    
    // 模拟分组查询逻辑
    const groupedResult = [];
    for (const category of categories) {
      const categoryDishes = await prisma.dish.findMany({
        where: { 
          categoryId: category.id,
          isActive: true
        },
        orderBy: { name: 'asc' },
        take: 3  // 每类只取前3个作为示例
      });

      if (categoryDishes.length > 0) {
        groupedResult.push({
          category: {
            id: category.id,
            name: category.name,
            displayOrder: category.displayOrder
          },
          dishes: categoryDishes.map(d => ({
            id: d.id,
            name: d.name,
            countable: d.countable,
            needPrep: d.needPrep
          }))
        });
      }
    }

    console.log('分组结果:');
    groupedResult.forEach(group => {
      console.log(`\n${group.category.name} (顺序: ${group.category.displayOrder}):`);
      group.dishes.forEach(dish => {
        const attrs = [];
        if (dish.countable) attrs.push('计数');
        if (dish.needPrep) attrs.push('预处理');
        console.log(`  - ${dish.name}${attrs.length > 0 ? ` (${attrs.join(', ')})` : ''}`);
      });
    });

    console.log('\n✅ 排序功能验证完成!');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySorting();