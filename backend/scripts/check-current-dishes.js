#!/usr/bin/env node

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkCurrentDishes() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🔍 查询现有菜品数据...\n');
    
    const dishes = await prisma.dish.findMany({
      include: {
        category: true,
        station: true
      }
    });

    console.log(`📊 现有菜品总数: ${dishes.length}\n`);
    console.log('📋 菜品详细列表:');
    console.log('=' .repeat(80));
    
    dishes.forEach((dish, index) => {
      console.log(`${index + 1}. ${dish.name}`);
      console.log(`   分类: ${dish.category?.name || '无分类'}`);
      console.log(`   岗位: ${dish.station?.name || '无岗位'}`);
      console.log(`   计数: ${dish.countable ? '是' : '否'}`);
      console.log(`   预处理: ${dish.needPrep ? '是' : '否'}`);
      console.log('-'.repeat(40));
    });

    // 按分类统计
    console.log('\n📈 按分类统计:');
    const categoryStats = {};
    dishes.forEach(dish => {
      const categoryName = dish.category?.name || '未分类';
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
    });
    
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 个菜品`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentDishes();