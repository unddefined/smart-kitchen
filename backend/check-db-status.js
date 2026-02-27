const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function checkDatabaseStatus() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('=== 当前数据库状态 ===');
    
    // 检查分类
    const categories = await prisma.dishCategory.findMany();
    console.log('\n📋 菜品分类:');
    categories.forEach(cat => {
      console.log(`  ID: ${cat.id}, 名称: ${cat.name}`);
    });
    
    // 检查工位
    const stations = await prisma.station.findMany();
    console.log('\n🏭 工位:');
    stations.forEach(station => {
      console.log(`  ID: ${station.id}, 名称: ${station.name}`);
    });
    
    // 检查现有菜品
    const dishCount = await prisma.dish.count();
    console.log(`\n🍽️  现有菜品数量: ${dishCount}`);
    
    if (dishCount > 0) {
      const sampleDishes = await prisma.dish.findMany({
        take: 5,
        include: { category: true, station: true }
      });
      console.log('\n📝 示例菜品:');
      sampleDishes.forEach(dish => {
        console.log(`  ${dish.name} (${dish.category?.name}, ${dish.station?.name})`);
      });
    }
    
  } catch (error) {
    console.error('检查数据库状态时出错:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkDatabaseStatus();