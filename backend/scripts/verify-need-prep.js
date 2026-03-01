#!/usr/bin/env node

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifyNeedPrep() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🔍 验证 need_prep 字段...');
    
    // 查询一些菜品的预处理状态
    const dishes = await prisma.dish.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        needPrep: true
      }
    });

    console.log('📋 菜品预处理状态:');
    dishes.forEach(dish => {
      console.log(`  ${dish.name}: ${dish.needPrep ? '需要预处理' : '不需要预处理'}`);
    });

    // 统计信息
    const totalDishes = await prisma.dish.count();
    const prepRequiredCount = await prisma.dish.count({
      where: { needPrep: true }
    });
    const prepNotRequiredCount = await prisma.dish.count({
      where: { needPrep: false }
    });

    console.log(`\n📊 统计信息:`);
    console.log(`  总菜品数: ${totalDishes}`);
    console.log(`  需要预处理: ${prepRequiredCount}`);
    console.log(`  不需要预处理: ${prepNotRequiredCount}`);

  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeedPrep();