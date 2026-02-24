const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSchema() {
  console.log('Testing database schema...');
  try {
    const dishes = await prisma.dish.findMany({ take: 1 });
    console.log('Dish fields:', Object.keys(dishes[0] || {}));
    
    const orderItems = await prisma.orderItem.findMany({ take: 1 });
    console.log('OrderItem fields:', Object.keys(orderItems[0] || {}));
    
    console.log('Schema verification completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();