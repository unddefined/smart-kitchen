// 简化版数据库连接测试
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('🔧 测试数据库连接...\n');

  // 创建Prisma客户端实例
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');

    // 执行原始SQL查询测试
    console.log('🧪 执行基础查询测试...');

    // 测试版本查询
    const versionResult: any[] =
      await prisma.$queryRaw`SELECT version() as version`;
    console.log('PostgreSQL版本:', versionResult[0]?.version);

    // 测试当前数据库
    const dbResult: any[] =
      await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log('当前数据库:', dbResult[0]?.db_name);

    // 测试用户信息
    const userResult: any[] =
      await prisma.$queryRaw`SELECT current_user as username`;
    console.log('当前用户:', userResult[0]?.username);

    console.log('\n✅ 所有测试通过！');
  } catch (error: any) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n请检查:');
    console.log('  1. 数据库服务是否运行');
    console.log('  2. 环境变量DATABASE_URL配置是否正确');
    console.log('  3. 网络连接是否正常');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
