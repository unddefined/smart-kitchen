const { Client } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

async function testDatabaseConnection() {
    console.log('🔧 本地开发环境数据库连接测试\n');
    
    // 从环境变量获取数据库配置
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_ADAPTER;
    
    if (!databaseUrl) {
        console.error('❌ 未找到数据库连接配置');
        console.log('检查环境变量:');
        console.log('DATABASE_URL:', process.env.DATABASE_URL);
        console.log('DATABASE_ADAPTER:', process.env.DATABASE_ADAPTER);
        process.exit(1);
    }
    
    console.log('数据库配置:');
    console.log(`  连接字符串: ${databaseUrl}`);
    console.log('');
    
    // 解析连接信息（用于显示）
    try {
        const url = new URL(databaseUrl);
        console.log('解析的连接信息:');
        console.log(`  主机: ${url.hostname}`);
        console.log(`  端口: ${url.port || 5432}`);
        console.log(`  数据库: ${url.pathname.substring(1)}`);
        console.log(`  用户: ${url.username}`);
        console.log('');
    } catch (e) {
        console.log('无法解析连接字符串格式\n');
    }
    
    // 创建数据库客户端
    const client = new Client({
        connectionString: databaseUrl,
    });
    
    try {
        console.log('🧪 测试数据库连接...');
        await client.connect();
        console.log('✅ 数据库连接成功\n');
        
        // 获取数据库信息
        console.log('📋 数据库信息:');
        const dbInfo = await client.query(`
            SELECT 
                current_database() as database_name,
                current_user as username,
                inet_client_addr() as client_ip,
                version() as postgres_version
        `);
        console.table(dbInfo.rows[0]);
        console.log('');
        
        // 获取表统计
        console.log('📊 表统计:');
        const tableStats = await client.query(`
            SELECT 
                COUNT(*) as table_count,
                pg_size_pretty(pg_database_size(current_database())) as database_size
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.table(tableStats.rows[0]);
        console.log('');
        
        // 显示所有表
        console.log('📂 数据库表列表:');
        const tables = await client.query(`
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        console.table(tables.rows);
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.log('\n请检查:');
        console.log('  1. 数据库服务是否运行');
        console.log('  2. 连接参数是否正确'); 
        console.log('  3. 网络连接是否正常');
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 执行测试
testDatabaseConnection().catch(console.error);