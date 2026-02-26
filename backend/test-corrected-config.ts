// 按照Prisma官方文档测试修正后的配置
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function testCorrectedConfiguration() {
  console.log('🧪 测试修正后的Prisma配置...\n');
  
  try {
    // 使用Prisma 7.4.0+官方推荐的方式
    const connectionString = process.env.DATABASE_URL!;
    console.log('数据库连接字符串:', connectionString.split('@')[1]); // 隐藏敏感信息
    
    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });
    
    // 测试连接
    console.log('🔌 测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 测试基本查询
    console.log('📊 测试基本数据查询...');
    
    // 获取表信息
    const tablesResult: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('数据库中的表:');
    tablesResult.forEach((row: any) => {
      console.log(`  • ${row.table_name}`);
    });
    
    // 测试dishes表是否存在
    const dishesExistResult: any[] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dishes'
      ) as exists
    `;
    
    const dishesExist = dishesExistResult[0]?.exists;
    console.log(`\ndishes表存在: ${dishesExist ? '✅ 是' : '❌ 否'}`);
    
    if (dishesExist) {
      // 查询菜品数量
      const dishCountResult: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM dishes
      `;
      console.log(`菜品总数: ${dishCountResult[0]?.count || 0}`);
    }
    
    console.log('\n🎉 配置测试完成！');
    
  } catch (error: any) {
    console.error('❌ 配置测试失败:', error.message);
    console.log('\n可能的原因:');
    console.log('  1. 数据库连接字符串配置错误');
    console.log('  2. Prisma适配器配置不正确');
    console.log('  3. 网络连接问题');
  } finally {
    // 清理连接
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  }
}

// 执行测试
testCorrectedConfiguration();
