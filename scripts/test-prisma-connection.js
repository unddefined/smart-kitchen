const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
    console.log('🔧 本地开发环境数据库连接测试（使用Prisma）\n');
    
    // 创建Prisma客户端实例
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    
    try {
        console.log('🧪 测试数据库连接...');
        
        // 测试连接
        await prisma.$connect();
        console.log('✅ 数据库连接成功\n');
        
        // 获取数据库信息
        console.log('📋 数据库信息:');
        const versionResult = await prisma.$queryRaw`SELECT version() as version`;
        console.log(`PostgreSQL版本: ${versionResult[0].version}`);
        console.log('');
        
        // 获取表信息
        console.log('📊 数据模型统计:');
        try {
            // 尝试获取一些常见的模型计数
            const modelCounts = {};
            
            // 检查是否存在常见模型
            const modelsToCheck = ['user', 'order', 'dish', 'station'];
            
            for (const modelName of modelsToCheck) {
                try {
                    const count = await prisma[modelName].count();
                    modelCounts[modelName] = count;
                } catch (e) {
                    // 模型不存在，跳过
                    modelCounts[modelName] = '未找到';
                }
            }
            
            console.table(modelCounts);
            
        } catch (e) {
            console.log('无法获取模型统计信息:', e.message);
        }
        
        console.log('\n✅ 数据库连接测试完成');
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.log('\n请检查:');
        console.log('  1. 数据库服务是否运行');
        console.log('  2. Prisma schema是否正确配置');
        console.log('  3. 环境变量DATABASE_URL是否正确');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// 执行测试
testDatabaseConnection().catch(console.error);