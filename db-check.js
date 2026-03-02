const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  let prisma;
  
  try {
    console.log('🔍 Checking database connection...');
    
    // 使用正确的Prisma 7.4+配置方式
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
    
    await prisma.$connect();
    console.log('✅ Database connection established!');
    
    // 检查所有表
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 检查特定关键表
    const keyTables = ['orders', 'dishes', 'users', 'stations', 'dish_categories', 'order_items', 'recipes'];
    console.log('\n🔑 Key table status:');
    
    for (const tableName of keyTables) {
      const exists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      console.log(`  ${tableName}: ${exists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    // 检查数据量
    console.log('\n📊 Data statistics:');
    try {
      const tableStats = [
        { name: 'orders', query: () => prisma.order.count() },
        { name: 'dishes', query: () => prisma.dish.count() },
        { name: 'users', query: () => prisma.user.count() },
        { name: 'stations', query: () => prisma.station.count() },
        { name: 'dish_categories', query: () => prisma.dishCategory.count() },
        { name: 'order_items', query: () => prisma.orderItem.count() }
      ];
      
      for (const stat of tableStats) {
        try {
          const count = await stat.query();
          console.log(`  ${stat.name}: ${count} records`);
        } catch (err) {
          console.log(`  ${stat.name}: Error - ${err.message}`);
        }
      }
    } catch (err) {
      console.log('  Data counting failed:', err.message);
    }
    
    // 测试基本查询
    console.log('\n🧪 Testing basic queries:');
    try {
      const versionResult = await prisma.$queryRaw`SELECT version() as version`;
      console.log('  PostgreSQL version:', versionResult[0].version);
      
      const dbResult = await prisma.$queryRaw`SELECT current_database() as db_name`;
      console.log('  Current database:', dbResult[0].db_name);
      
      const userResult = await prisma.$queryRaw`SELECT current_user as username`;
      console.log('  Current user:', userResult[0].username);
      
    } catch (err) {
      console.log('  Basic queries failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// 设置环境变量（如果需要的话）
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://smart_admin:13814349230cX@pgm-2ze353m6093d70a7mo.pg.rds.aliyuncs.com:5432/smart_kitchen';
}

checkDatabase();