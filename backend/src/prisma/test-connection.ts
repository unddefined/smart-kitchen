// 数据库连接测试脚本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');

    // 测试基本查询
    const userCount = await prisma.user.count();
    console.log(`📊 当前用户数量: ${userCount}`);

    const stationCount = await prisma.station.count();
    console.log(`📊 当前工位数量: ${stationCount}`);

    const dishCount = await prisma.dish.count();
    console.log(`📊 当前菜品数量: ${dishCount}`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
