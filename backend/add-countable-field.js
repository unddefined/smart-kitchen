const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function addCountableField() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🚀 开始添加countable字段...');
    
    // 添加countable字段
    await prisma.$executeRaw`
      ALTER TABLE dishes 
      ADD COLUMN IF NOT EXISTS countable BOOLEAN DEFAULT false
    `;
    
    console.log('✅ countable字段添加成功');
    
    // 验证字段已添加
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' AND column_name = 'countable'
    `;
    
    console.log('字段验证结果:', columns);
    
  } catch (error) {
    console.error('❌ 添加字段失败:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addCountableField();