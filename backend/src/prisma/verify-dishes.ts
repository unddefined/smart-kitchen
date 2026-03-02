/**
 * 验证菜品数据脚本
 * 用于检查种子脚本执行后的数据状态
 *
 * 使用方法:
 * npx ts-node src/prisma/verify-dishes.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://smart_kitchen_user:password@localhost:5432/smart_kitchen_prod';
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: ['info', 'warn', 'error'],
  });
}

async function verifyDishes() {
  const prisma = createPrismaClient();

  try {
    console.log('🔍 开始验证菜品数据...\n');

    // 1. 统计总数
    const totalDishes = await prisma.dish.count();
    console.log(`📊 菜品总数：${totalDishes}`);

    // 2. 按分类统计
    const categories = await prisma.dishCategory.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
        dishes: {
          select: {
            countable: true,
            needPrep: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    console.log('\n📂 分类统计:');
    for (const category of categories) {
      const countableCount = category.dishes.filter((d) => d.countable).length;
      const needPrepCount = category.dishes.filter((d) => d.needPrep).length;
      console.log(
        `   ${category.name}: ${category._count.dishes}个 (计数:${countableCount}, 预处理:${needPrepCount})`,
      );
    }

    // 3. 特殊菜品列表
    const countableDishes = await prisma.dish.findMany({
      where: { countable: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    console.log('\n📋 需要计数的菜品:');
    if (countableDishes.length === 0) {
      console.log('   (无)');
    } else {
      countableDishes.forEach((dish) => {
        console.log(`   - ${dish.name} (${dish.category.name})`);
      });
    }

    const needPrepDishes = await prisma.dish.findMany({
      where: { needPrep: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    console.log('\n📋 需要预处理的菜品:');
    if (needPrepDishes.length === 0) {
      console.log('   (无)');
    } else {
      needPrepDishes.forEach((dish) => {
        console.log(`   - ${dish.name} (${dish.category.name})`);
      });
    }

    // 4. 工位分布
    const stations = await prisma.station.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    console.log('\n📍 工位分布:');
    for (const station of stations) {
      console.log(`   ${station.name}: ${station._count.dishes}个菜品`);
    }

    // 5. 快捷码检查
    const sampleDishes = await prisma.dish.findMany({
      take: 5,
      select: {
        name: true,
        shortcutCode: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log('\n🔤 快捷码示例:');
    sampleDishes.forEach((dish) => {
      console.log(`   ${dish.name} → ${dish.shortcutCode}`);
    });

    // 6. 最终验证
    console.log('\n✅ 验证完成!');

    const expectedTotal = 51;
    const expectedCountable = 9;
    const expectedNeedPrep = 10;

    if (totalDishes !== expectedTotal) {
      console.warn(
        `⚠️  警告：期望 ${expectedTotal} 个菜品，实际 ${totalDishes} 个`,
      );
    } else {
      console.log(`✅ 菜品总数正确 (${totalDishes}个)`);
    }

    if (countableDishes.length !== expectedCountable) {
      console.warn(
        `⚠️  警告：期望 ${expectedCountable} 个计数菜品，实际 ${countableDishes.length} 个`,
      );
    } else {
      console.log(`✅ 计数菜品数量正确 (${countableDishes.length}个)`);
    }

    if (needPrepDishes.length !== expectedNeedPrep) {
      console.warn(
        `⚠️  警告：期望 ${expectedNeedPrep} 个预处理菜品，实际 ${needPrepDishes.length} 个`,
      );
    } else {
      console.log(`✅ 预处理菜品数量正确 (${needPrepDishes.length}个)`);
    }
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDishes().catch(console.error);
