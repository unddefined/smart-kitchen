require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma数据库连接成功！');
    
    // 测试基本查询
    const userCount = await prisma.user.count();
    console.log(`📊 用户数量: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Prisma数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();