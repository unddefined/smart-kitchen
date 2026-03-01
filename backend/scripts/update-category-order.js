#!/usr/bin/env node

/**
 * 更新菜品分类的显示顺序，按照上菜流程要求：
 * started → 凉菜 → serving → 前菜 → 中菜、点心、蒸菜 → 后菜 → 尾菜 → done
 */

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// 定义期望的分类顺序（按照上菜流程）
const DESIRED_CATEGORY_ORDER = [
  '凉菜',   // started之后第一个
  '前菜',   // 第二个
  '中菜',   // 第三个
  '点心',   // 第四个
  '蒸菜',   // 第五个
  '后菜',   // 第六个
  '尾菜'    // 最后一个
];

async function updateCategoryOrder() {
  console.log('🚀 开始更新菜品分类排序...\n');
  
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 获取现有分类
    const existingCategories = await prisma.dishCategory.findMany({
      orderBy: { id: 'asc' }
    });

    console.log('📋 当前分类顺序:');
    existingCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    console.log('\n🎯 期望的分类顺序:');
    DESIRED_CATEGORY_ORDER.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    // 检查是否所有期望的分类都存在
    const missingCategories = DESIRED_CATEGORY_ORDER.filter(
      name => !existingCategories.some(cat => cat.name === name)
    );

    if (missingCategories.length > 0) {
      console.log(`\n⚠️  缺少以下分类: ${missingCategories.join(', ')}`);
      console.log('请先创建缺少的分类');
      return;
    }

    // 由于PostgreSQL的ID是自增的，我们不能直接修改ID
    // 而是添加一个display_order字段来控制显示顺序
    console.log('\n🔧 检查是否需要添加display_order字段...');
    
    // 检查display_order字段是否存在
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dish_categories' AND column_name = 'display_order'
    `;

    if (columns.length === 0) {
      console.log('📝 添加display_order字段...');
      await prisma.$executeRaw`
        ALTER TABLE dish_categories 
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
      `;
      console.log('✅ display_order字段添加成功');
    }

    // 更新各分类的显示顺序
    console.log('\n🔄 更新分类显示顺序...');
    
    for (let i = 0; i < DESIRED_CATEGORY_ORDER.length; i++) {
      const categoryName = DESIRED_CATEGORY_ORDER[i];
      const category = existingCategories.find(cat => cat.name === categoryName);
      
      if (category) {
        await prisma.dishCategory.update({
          where: { id: category.id },
          data: { displayOrder: i + 1 }
        });
        console.log(`  ✅ ${categoryName}: display_order = ${i + 1}`);
      }
    }

    // 验证更新结果
    console.log('\n🔍 验证更新结果...');
    const updatedCategories = await prisma.dishCategory.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('📊 更新后的分类顺序:');
    updatedCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (display_order: ${cat.displayOrder})`);
    });

    // 测试按新顺序查询菜品
    console.log('\n🍽️  按新顺序查询菜品示例:');
    for (const category of updatedCategories) {
      const dishes = await prisma.dish.findMany({
        where: { categoryId: category.id },
        take: 2
      });
      
      if (dishes.length > 0) {
        console.log(`  ${category.name}:`);
        dishes.forEach(dish => {
          console.log(`    - ${dish.name}`);
        });
      }
    }

    console.log('\n🎉 分类排序更新完成!');

  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行更新
if (require.main === module) {
  updateCategoryOrder();
}

module.exports = { updateCategoryOrder, DESIRED_CATEGORY_ORDER };