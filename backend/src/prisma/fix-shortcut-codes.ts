/**
 * 修复菜品 shortcutCode 字段
 * 为所有 shortcutCode 为 NULL 的菜品生成并更新快捷码
 * 规则：取中文名称的拼音首字母（大写），如：托炉饼 -> TLB
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { pinyin } from 'pinyin-pro';
import 'dotenv/config';

// 创建 Prisma 客户端实例
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

/**
 * 生成快捷码
 * 规则：取菜品名称的拼音首字母（去除空格），转为大写
 * - 对于中文菜名：转换为拼音首字母，如 "托炉饼" -> "TLB"
 * - 对于非中文字符：保留原字符
 */
function generateShortcutCode(dishName: string): string {
  try {
    // 使用 pinyin-pro 将中文转换为拼音首字母
  const result = pinyin(dishName, {
      pattern: 'first',
      type: 'array',
    });
    
    // 将数组连接成字符串并转大写，移除声调符号和非字母字符
    return result.join('').toUpperCase().replace(/[^A-Z]/g, '');
  } catch (error) {
    // 如果转换失败，回退到原始方法（取前 4 个字符）
  console.warn(`⚠️  拼音转换失败 "${dishName}", 使用默认方法`);
    return dishName.replace(/\s/g, '').substring(0, 4).toUpperCase();
  }
}

async function fixShortcutCodes() {
  const prisma = createPrismaClient();

  try {
  console.log('🔧 开始修复 shortcutCode 字段...\n');

    // 1. 查询所有 shortcutCode 为 NULL 的菜品
  const dishesWithoutCode = await prisma.dish.findMany({
      where: {
       shortcutCode: null,
      },
      select: {
        id: true,
       name: true,
        category: {
          select: { name: true },
        },
      },
    });

  console.log(`📋 找到 ${dishesWithoutCode.length} 个缺少 shortcutCode 的菜品\n`);

    if (dishesWithoutCode.length === 0) {
   console.log('✅ 所有菜品已有 shortcutCode，无需修复\n');
    return;
    }

    // 2. 显示将要生成的快捷码
  console.log('📝 即将生成的 shortcutCode:');
  console.log('-'.repeat(80));
  console.log(
      `${'ID'.padStart(5)} | ${'名称'.padEnd(20)} | ${'分类'.padEnd(10)} | ${'新 shortcutCode'.padEnd(15)}`,
    );
  console.log('-'.repeat(80));

    for (const dish of dishesWithoutCode) {
   const newCode = generateShortcutCode(dish.name);
   console.log(
        `${String(dish.id).padStart(5)} | ${dish.name.padEnd(20)} | ${dish.category.name.padEnd(10)} | ${newCode.padEnd(15)}`,
      );
    }
  console.log();

    // 3. 批量更新
  console.log('⚙️  正在更新数据库...');
  let updateCount = 0;
  let errorCount = 0;

    for (const dish of dishesWithoutCode) {
    try {
     const newCode = generateShortcutCode(dish.name);
      
      await prisma.dish.update({
        where: { id:dish.id },
        data: { shortcutCode: newCode },
      });
      
      updateCount++;
     console.log(`   ✅ 更新：${dish.name} -> ${newCode}`);
    } catch (error: any) {
      errorCount++;
     console.error(`   ❌ 失败：${dish.name} - ${error.message}`);
    }
    }

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ 修复完成！`);
  console.log(`📊 统计：总计 ${dishesWithoutCode.length} 个，成功 ${updateCount} 个，失败 ${errorCount} 个\n`);

    // 4. 验证结果
  console.log('🔍 验证修复结果...');
  const remainingNullCodes = await prisma.dish.count({
      where: { shortcutCode: null },
    });

  console.log(
      remainingNullCodes === 0
      ? '✅ 所有菜品 shortcutCode 已修复！'
      : `⚠️  仍有 ${remainingNullCodes} 个菜品缺少 shortcutCode`,
    );

    // 5. 显示所有菜品的 shortcutCode（按分类）
  console.log('\n📋 完整菜品列表（含 shortcutCode）:');
  const allDishes = await prisma.dish.findMany({
      include: {
        category: true,
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
    });

  console.log('='.repeat(100));
  console.log(
      `${'ID'.padStart(5)} | ${'名称'.padEnd(20)} | ${'分类'.padEnd(10)} | ${'shortcutCode'.padEnd(15)} | ${'状态'.padEnd(8)}`,
    );
  console.log('-'.repeat(100));

    let currentCategory = '';
    for (const dish of allDishes) {
      if (dish.category.name !== currentCategory) {
        currentCategory = dish.category.name;
     console.log(`\n【${currentCategory}】`);
     console.log(
          `${'ID'.padStart(5)} | ${'名称'.padEnd(20)} | ${'分类'.padEnd(10)} | ${'shortcutCode'.padEnd(15)} | ${'状态'.padEnd(8)}`,
        );
     console.log('-'.repeat(100));
      }

   const status = dish.shortcutCode? '✅' : '❌';
   console.log(
        `${String(dish.id).padStart(5)} | ${dish.name.padEnd(20)} | ${dish.category.name.padEnd(10)} | ${(dish.shortcutCode || 'NULL').padEnd(15)} | ${status.padEnd(8)}`,
      );
    }

  console.log('\n' + '='.repeat(100));
  console.log(`\n总计：${allDishes.length} 个菜品\n`);

  } catch (error) {
  console.error('❌ 发生错误:', error);
  process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixShortcutCodes().catch(console.error);
