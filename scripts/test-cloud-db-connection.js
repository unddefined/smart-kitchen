const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

// 云服务器配置信息
const CLOUD_CONFIG = {
    serverIp: '8.145.34.30',
    sshUser: 'root',
    sshKey: process.platform === 'win32' 
        ? 'C:\\Users\\66948\\.ssh\\PWA应用密钥.pem'
        : '~/PWA应用密钥.pem',
    dbName: 'smart_kitchen_prod',
    dbUser: 'smart_kitchen_user',
    dbPassword: '13814349230cX',
    dbHost: 'localhost',
    dbPort: '5432'
};

async function testCloudDatabaseConnection() {
    console.log('☁️  智能厨房云服务器数据库连接测试\n');
    
    // 显示连接配置
    console.log('📋 连接配置信息:');
    console.log(`   服务器IP: ${CLOUD_CONFIG.serverIp}`);
    console.log(`   SSH用户: ${CLOUD_CONFIG.sshUser}`);
    console.log(`   数据库名: ${CLOUD_CONFIG.dbName}`);
    console.log(`   数据库用户: ${CLOUD_CONFIG.dbUser}`);
    console.log(`   数据库主机: ${CLOUD_CONFIG.dbHost}:${CLOUD_CONFIG.dbPort}`);
    console.log('');

    try {
        // 1. 测试SSH连接
        console.log('🔌 步骤1: 测试SSH连接...');
        await testSSHConnection();
        
        // 2. 测试Docker容器状态
        console.log('🐳 步骤2: 检查Docker容器状态...');
        await checkDockerContainers();
        
        // 3. 测试数据库连接
        console.log('📊 步骤3: 测试数据库连接...');
        await testDatabaseConnectivity();
        
        // 4. 获取数据库详细信息
        console.log('📋 步骤4: 获取数据库详细信息...');
        await getDatabaseDetails();
        
        console.log('\n✅ 云服务器数据库连接测试全部通过！');
        
    } catch (error) {
        console.error('\n❌ 连接测试失败:', error.message);
        process.exit(1);
    }
}

async function testSSHConnection() {
    return new Promise((resolve, reject) => {
        try {
            const sshCommand = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "${CLOUD_CONFIG.sshKey}" ${CLOUD_CONFIG.sshUser}@${CLOUD_CONFIG.serverIp} "echo 'SSH连接成功' && uptime"`;
            
            console.log(`   执行命令: ${sshCommand.substring(0, 80)}...`);
            
            const result = execSync(sshCommand, { 
                encoding: 'utf8',
                timeout: 15000
            });
            
            console.log('   ✅ SSH连接成功');
            console.log(`   服务器信息: ${result.trim()}`);
            resolve();
            
        } catch (error) {
            console.log('   ❌ SSH连接失败');
            console.log(`   错误详情: ${error.message}`);
            reject(new Error('SSH连接失败，请检查网络连接和SSH密钥'));
        }
    });
}

async function checkDockerContainers() {
    return new Promise((resolve, reject) => {
        try {
            const dockerCommand = `ssh -o ConnectTimeout=10 -i "${CLOUD_CONFIG.sshKey}" ${CLOUD_CONFIG.sshUser}@${CLOUD_CONFIG.serverIp} "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep postgres"`;
            
            const result = execSync(dockerCommand, { 
                encoding: 'utf8',
                timeout: 10000
            });
            
            if (result.trim()) {
                console.log('   ✅ PostgreSQL容器运行中');
                console.log(`   容器信息:\n${result}`);
                resolve();
            } else {
                throw new Error('PostgreSQL容器未找到或未运行');
            }
            
        } catch (error) {
            console.log('   ❌ Docker容器检查失败');
            reject(new Error('PostgreSQL容器异常，请检查服务器Docker状态'));
        }
    });
}

async function testDatabaseConnectivity() {
    // 构造远程数据库连接字符串
    const remoteDbUrl = `postgresql://${CLOUD_CONFIG.dbUser}:${CLOUD_CONFIG.dbPassword}@${CLOUD_CONFIG.serverIp}:5432/${CLOUD_CONFIG.dbName}?schema=public`;
    
    const client = new Client({
        connectionString: remoteDbUrl,
    });
    
    try {
        await client.connect();
        console.log('   ✅ 数据库连接成功');
        
        // 测试基本查询
        const result = await client.query('SELECT version(), current_database(), current_user');
        console.log(`   PostgreSQL版本: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
        console.log(`   当前数据库: ${result.rows[0].current_database}`);
        console.log(`   当前用户: ${result.rows[0].current_user}`);
        
    } catch (error) {
        console.log('   ❌ 数据库连接失败');
        console.log(`   错误详情: ${error.message}`);
        throw new Error('数据库连接测试失败');
    } finally {
        await client.end();
    }
}

async function getDatabaseDetails() {
    const remoteDbUrl = `postgresql://${CLOUD_CONFIG.dbUser}:${CLOUD_CONFIG.dbPassword}@${CLOUD_CONFIG.serverIp}:5432/${CLOUD_CONFIG.dbName}?schema=public`;
    const client = new Client({ connectionString: remoteDbUrl });
    
    try {
        await client.connect();
        
        // 获取表统计信息
        const tableStats = await client.query(`
            SELECT 
                COUNT(*) as table_count,
                pg_size_pretty(pg_database_size(current_database())) as database_size
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log(`   数据库大小: ${tableStats.rows[0].database_size}`);
        console.log(`   数据表数量: ${tableStats.rows[0].table_count}`);
        
        // 获取所有表信息
        console.log('\n   📂 数据库表列表:');
        const tables = await client.query(`
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size,
                obj_description(('public.' || tablename)::regclass) as description
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        tables.rows.forEach(row => {
            console.log(`   - ${row.tablename} (${row.size})${row.description ? ` - ${row.description}` : ''}`);
        });
        
        // 获取业务数据统计
        console.log('\n   📊 业务数据统计:');
        try {
            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM orders) as total_orders,
                    (SELECT COUNT(*) FROM dishes) as total_dishes,
                    (SELECT COUNT(*) FROM stations) as total_stations,
                    (SELECT COUNT(*) FROM users) as total_users
            `;
            const businessStats = await client.query(statsQuery);
            const stats = businessStats.rows[0];
            
            console.log(`   - 总订单数: ${stats.total_orders || 0}`);
            console.log(`   - 菜品总数: ${stats.total_dishes || 0}`);
            console.log(`   - 工位数量: ${stats.total_stations || 0}`);
            console.log(`   - 用户数量: ${stats.total_users || 0}`);
        } catch (error) {
            console.log('   ⚠️  业务统计查询失败（可能表结构不完整）');
        }
        
    } catch (error) {
        throw new Error(`获取数据库详情失败: ${error.message}`);
    } finally {
        await client.end();
    }
}

// 添加优雅退出处理
process.on('SIGINT', () => {
    console.log('\n\n👋 测试被用户中断');
    process.exit(0);
});

// 执行测试
testCloudDatabaseConnection().catch(error => {
    console.error('\n💥 测试过程中发生严重错误:', error.message);
    process.exit(1);
});