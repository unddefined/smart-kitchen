const { PrismaPg } = require('@prisma/adapter-pg');
const connectionString = process.env.DATABASE_URL;

console.log('Testing PrismaPg adapter...');
console.log('Connection string exists:', !!connectionString);

if (!connectionString) {
  console.error('DATABASE_URL not found!');
  process.exit(1);
}

try {
  const adapter = new PrismaPg({ connectionString });
  console.log('Adapter created successfully');
  
  // 尝试连接
  async function test() {
    try {
      await adapter.connect();
      console.log('Database connection successful!');
      const result = await adapter.queryRaw({ sql: 'SELECT 1', args: [] });
      console.log('Query result:', result);
      await adapter.disconnect();
      console.log('Test completed successfully');
    } catch (error) {
      console.error('Connection or query failed:', error.message);
      process.exit(1);
    }
  }
  
  test();
} catch (error) {
  console.error('Failed to create adapter:', error.message);
  process.exit(1);
}