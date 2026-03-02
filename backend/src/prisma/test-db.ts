/**
 * 测试数据库连接脚本
 * 使用 .env 中的 DATABASE_URL 验证数据库连接
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('❌ DATABASE_URL 未配置，请检查 .env 文件');
  }

  console.log('📊 数据库连接信息:');
  console.log(
    `   连接字符串：${connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`,
  );

  const adapter = new PrismaPg({
    connectionString,
    maxUses: 7500,
    connectionTimeoutMillis: 30000,
  });

  return new PrismaClient({
    adapter,
    log: ['info', 'warn', 'error'],
  });
}

async function testDatabase() {
  const prisma = createPrismaClient();

  try {
    console.log('\n🔌 正在连接数据库...\n');

    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功!\n');

    // 查询数据库版本
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('📋 PostgreSQL 版本:');
    console.log(`   ${version[0].version}\n`);

    // 查询所有工位
    console.log('📍 查询工位数据...');
    const stations = await prisma.station.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });
    console.log(`   找到 ${stations.length} 个工位:`);
    stations.forEach((station) => {
      console.log(`   - ${station.name}: ${station._count.dishes} 个菜品`);
    });

    // 查询所有分类
    console.log('\n📂 查询分类数据...');
    const categories = await prisma.dishCategory.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    console.log(`   找到 ${categories.length} 个分类:`);
    categories.forEach((category) => {
      console.log(`   - ${category.name}: ${category._count.dishes} 个菜品`);
    });

    // 查询菜品总数
    console.log('\n🍽️  查询菜品数据...');
    const totalDishes = await prisma.dish.count();
    console.log(`   总菜品数：${totalDishes}`);

    // 统计特殊菜品
    const countableDishes = await prisma.dish.count({
      where: { countable: true },
    });
    const needPrepDishes = await prisma.dish.count({
      where: { needPrep: true },
    });

    console.log(`   需要计数：${countableDishes} 个`);
    console.log(`   需要预处理：${needPrepDishes} 个`);

    // 示例菜品
    console.log('\n📋 部分菜品示例:');
    const sampleDishes = await prisma.dish.findMany({
      take: 10,
      include: {
        station: true,
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    sampleDishes.forEach((dish) => {
      const markers = [];
      if (dish.countable) markers.push('[计数]');
      if (dish.needPrep) markers.push('[预处理]');
      const markerStr = markers.length > 0 ? ` ${markers.join(' ')}` : '';
      console.log(
        `   - ${dish.name}${markerStr} (${dish.category.name} / ${dish.station.name})`,
      );
    });

    console.log('\n✅ 数据库检查完成!\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    console.error('\n💡 可能的原因:');
    console.error('   1. 网络连接问题');
    console.error('   2. 数据库凭据错误');
    console.error('   3. 数据库服务未运行');
    console.error('   4. 防火墙阻止连接');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase().catch(console.error);
