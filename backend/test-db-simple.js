const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function testSimpleQuery() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('=== 简单数据库测试 ===');
    
    // 测试基本查询
    console.log('\n1. 测试分类查询...');
    const categories = await prisma.dishCategory.findMany();
    console.log('分类数量:', categories.length);
    
    console.log('\n2. 测试工位查询...');
    const stations = await prisma.station.findMany();
    console.log('工位数量:', stations.length);
    
    console.log('\n3. 测试菜品计数...');
    const dishCount = await prisma.dish.count();
    console.log('菜品数量:', dishCount);
    
    console.log('\n✅ 基本查询测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testSimpleQuery();