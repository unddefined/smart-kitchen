// 最简版数据库连接测试
const { execSync } = require('child_process');
require('dotenv').config({ path: '../backend/.env' });

function testDatabaseConnection() {
    console.log('🔧 本地开发环境数据库连接测试\n');
    
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_ADAPTER;
    
    if (!databaseUrl) {
        console.error('❌ 未找到数据库连接配置');
        console.log('请检查 backend/.env 文件是否存在 DATABASE_URL 配置');
        process.exit(1);
    }
    
    console.log('数据库连接字符串:');
    console.log(databaseUrl);
    console.log('');
    
    try {
        // 使用node-postgres进行测试
        const { Client } = require('pg');
        const client = new Client({
            connectionString: databaseUrl,
        });
        
        client.connect()
            .then(() => {
                console.log('✅ 数据库连接成功\n');
                
                // 执行基础查询
                return client.query('SELECT version(), current_database(), current_user');
            })
            .then(result => {
                const row = result.rows[0];
                console.log('📋 数据库信息:');
                console.log(`  PostgreSQL版本: ${row.version}`);
                console.log(`  当前数据库: ${row.current_database}`);
                console.log(`  当前用户: ${row.current_user}`);
                console.log('');
                
                // 查询表信息
                return client.query(`
                    SELECT 
                        COUNT(*) as table_count,
                        pg_size_pretty(pg_database_size(current_database())) as database_size
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                `);
            })
            .then(result => {
                const stats = result.rows[0];
                console.log('📊 数据库统计:');
                console.log(`  表数量: ${stats.table_count}`);
                console.log(`  数据库大小: ${stats.database_size}`);
                console.log('');
                console.log('✅ 数据库连接测试完成');
            })
            .catch(error => {
                console.error('❌ 数据库连接失败:', error.message);
                console.log('\n请检查:');
                console.log('  1. 数据库服务是否运行');
                console.log('  2. 连接参数是否正确');
                console.log('  3. 网络连接是否正常');
                process.exit(1);
            })
            .finally(() => {
                client.end();
            });
            
    } catch (error) {
        console.log('⚠️  pg模块未安装，尝试其他方式...');
        
        // 尝试使用系统命令
        try {
            console.log('🧪 尝试使用系统psql命令...');
            const result = execSync(`psql "${databaseUrl}" -c "SELECT version();"`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            console.log('✅ 数据库连接成功');
            console.log(result);
        } catch (sysError) {
            console.error('❌ 系统命令执行失败:', sysError.message);
            console.log('请安装PostgreSQL客户端工具或pg npm包');
        }
    }
}

testDatabaseConnection();