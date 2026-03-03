import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function testDishes() {
  try {
    console.log('开始测试分组菜品查询...');
    
    const connectionString = process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString });
    
    const prisma = new PrismaClient({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
    
    await prisma.$connect();
    console.log('数据库连接成功');
    
    // 测试获取分类
    console.log('\n获取分类...');
    const categories = await prisma.dishCategory.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    });
    console.log(`获取到 ${categories.length} 个分类`);
    
    // 测试获取第一个分类的菜品
    if (categories.length > 0) {
      const firstCategory = categories[0];
      console.log(`\n获取分类 "${firstCategory.name}" 的菜品...`);
      
      const dishes = await prisma.dish.findMany({
        where: { 
          categoryId: firstCategory.id,
          isActive: true
        },
        include: {
          station: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });
      
      console.log(`获取到 ${dishes.length} 个菜品`);
      if (dishes.length > 0) {
        console.log('前 3 个菜品:', JSON.stringify(dishes.slice(0, 3), null, 2));
      }
    }
    
    await prisma.$disconnect();
    console.log('\n测试成功完成！');
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testDishes();
