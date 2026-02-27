const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

async function applyMVPChanges() {
  console.log('🚀 开始应用MVP数据库变更...');
  
  // 创建PostgreSQL连接池
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  
  // 使用适配器创建Prisma客户端
  const prisma = new PrismaClient({ adapter });
  
  try {
    // 1. 添加菜品表的isActive字段
    console.log('1. 检查并添加菜品表isActive字段...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE dishes 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `;
      console.log('✅ dishes.is_active 字段添加成功');
    } catch (error) {
      console.log('ℹ️  dishes.is_active 字段可能已存在:', error.message);
    }

    // 2. 添加订单表的缺失字段
    console.log('2. 检查并添加订单表缺失字段...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS meal_type VARCHAR(10),
        ADD COLUMN IF NOT EXISTS start_time TIMESTAMP,
        ADD COLUMN IF NOT EXISTS remark TEXT
      `;
      console.log('✅ orders 表字段添加成功');
    } catch (error) {
      console.log('ℹ️  orders 表字段可能已存在:', error.message);
    }

    // 3. 验证当前表结构
    console.log('3. 验证更新后的表结构...');
    
    // 检查dishes表结构
    const dishColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' 
      AND column_name IN ('is_active')
      ORDER BY ordinal_position
    `;
    console.log('📄 dishes 表关键字段:', dishColumns);

    // 检查orders表结构
    const orderColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('meal_type', 'start_time', 'remark')
      ORDER BY ordinal_position
    `;
    console.log('📄 orders 表关键字段:', orderColumns);

    // 4. 显示统计数据
    console.log('4. 当前数据库统计信息...');
    const dishCount = await prisma.dish.count();
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();
    
    console.log(`📊 菜品数量: ${dishCount}`);
    console.log(`📊 订单数量: ${orderCount}`);
    console.log(`📊 订单菜品项数量: ${orderItemCount}`);

    console.log('🎉 MVP数据库变更应用完成！');

  } catch (error) {
    console.error('❌ 应用MVP变更时出错:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// 执行变更
applyMVPChanges();