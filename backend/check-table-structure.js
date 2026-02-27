const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function checkTableStructure() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('=== 检查菜品表结构 ===');
    
    // 检查菜品表字段
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' 
      ORDER BY ordinal_position
    `;
    
    console.log('菜品表字段:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 尝试简单的插入操作
    console.log('\n=== 测试简单插入 ===');
    try {
      const testDish = await prisma.dish.create({
        data: {
          name: '测试菜品',
          categoryId: 1,
          stationId: 1,
          countable: false,
          isActive: true
        }
      });
      console.log('✅ 简单插入成功:', testDish.name);
      
      // 清理测试数据
      await prisma.dish.delete({
        where: { id: testDish.id }
      });
      console.log('✅ 测试数据清理完成');
      
    } catch (insertError) {
      console.log('❌ 插入测试失败:', insertError.message);
      console.log('错误详情:', JSON.stringify(insertError, null, 2));
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkTableStructure();