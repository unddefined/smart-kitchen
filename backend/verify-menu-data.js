const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function verifyMenuData() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('=== 验证菜品数据 ===');
    
    // 检查总计数
    const totalCount = await prisma.dish.count();
    console.log(`总菜品数: ${totalCount}`);
    
    // 检查需要计数的菜品
    const countableDishes = await prisma.dish.findMany({
      where: { countable: true },
      include: { category: true, station: true }
    });
    console.log(`需要计数的菜品数: ${countableDishes.length}`);
    
    if (countableDishes.length > 0) {
      console.log('需要计数的菜品列表:');
      countableDishes.forEach(dish => {
        console.log(`  ${dish.name} (${dish.category.name}, ${dish.station.name})`);
      });
    }
    
    // 按分类统计
    console.log('\n=== 各分类统计 ===');
    const categories = await prisma.dishCategory.findMany({
      include: {
        dishes: true
      }
    });
    
    categories.forEach(category => {
      console.log(`${category.name}: ${category.dishes.length} 个`);
    });
    
    console.log('\n✅ 数据验证完成！');
    
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyMenuData();