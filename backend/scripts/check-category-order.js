#!/usr/bin/env node

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkCategoryOrder() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🔍 查询当前菜品分类排序...\n');
    
    const categories = await prisma.dishCategory.findMany({
      orderBy: { id: 'asc' }
    });

    console.log('当前按ID排序的分类:');
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (ID: ${category.id})`);
    });

    console.log('\n📊 按名称字母排序的分类:');
    const sortedByName = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    sortedByName.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (ID: ${category.id})`);
    });

    // 检查菜品数量分布
    console.log('\n📈 各分类菜品数量:');
    for (const category of categories) {
      const dishCount = await prisma.dish.count({
        where: { categoryId: category.id }
      });
      console.log(`  ${category.name}: ${dishCount} 个菜品`);
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryOrder();