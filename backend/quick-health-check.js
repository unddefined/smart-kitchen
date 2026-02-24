smart_kitchen_user#!/usr/bin/env node

require('dotenv').config({ path: './.env' });

/**
 * 简化版数据库健康检查脚本
 * 用于快速检查云数据库状态
 */

async function quickHealthCheck() {
    const { Client } = require('pg');
    
    // 云数据库配置
    const dbConfig = {
        host: '8.145.34.30',
        port: 5432,
        database: 'smart_kitchen_prod',
        user: 'smart_kitchen_user',
        password: '13814349230cX',
        connectionTimeoutMillis: 5000
    };
    
    const client = new Client(dbConfig);
    const startTime = Date.now();
    
    try {
        console.log('🏥 执行数据库健康检查...\n');
        
        // 连接数据库
        await client.connect();
        const connectTime = Date.now() - startTime;
        console.log(`✅ 连接成功 (耗时: ${connectTime}ms)`);
        
        // 基础信息查询
        const infoResult = await client.query(`
            SELECT 
                current_database() as database_name,
                current_user as username,
                version() as postgres_version
        `);
        
        const info = infoResult.rows[0];
        console.log(`\n📋 数据库信息:`);
        console.log(`   数据库: ${info.database_name}`);
        console.log(`   用户: ${info.username}`);
        console.log(`   版本: ${info.postgres_version.split(' ')[0]} ${info.postgres_version.split(' ')[1]}`);
        
        // 性能测试查询
        const perfStartTime = Date.now();
        const perfResult = await client.query(`
            SELECT 
                COUNT(*) as table_count,
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections
            FROM pg_tables 
            CROSS JOIN pg_stat_activity 
            WHERE schemaname = 'public' 
            AND datname = current_database()
        `);
        const perfTime = Date.now() - perfStartTime;
        
        const stats = perfResult.rows[0];
        console.log(`\n📊 性能统计:`);
        console.log(`   查询耗时: ${perfTime}ms`);
        console.log(`   表数量: ${stats.table_count}`);
        console.log(`   数据库大小: ${stats.db_size}`);
        console.log(`   活跃连接: ${stats.active_connections}`);
        
        // 业务表检查
        console.log(`\n🔍 业务表状态:`);
        const tablesResult = await client.query(`
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size,
                (SELECT COUNT(*) FROM public.dishes LIMIT 1) as dishes_exists,
                (SELECT COUNT(*) FROM public.stations LIMIT 1) as stations_exists
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        tablesResult.rows.forEach(row => {
            const exists = row.tablename === 'dishes' || row.tablename === 'stations' ? 
                (row.dishes_exists > 0 ? '✓' : '✗') : '';
            console.log(`   ${row.tablename} (${row.size}) ${exists}`);
        });
        
        // 整体状态评估
        const totalTime = Date.now() - startTime;
        let status = 'HEALTHY';
        let recommendations = [];
        
        if (connectTime > 1000) {
            status = 'WARNING';
            recommendations.push('连接延迟较高，建议检查网络状况');
        }
        
        if (perfTime > 500) {
            status = 'WARNING';
            recommendations.push('查询性能较慢，建议优化索引');
        }
        
        console.log(`\n📈 整体状态: ${status}`);
        console.log(`   总耗时: ${totalTime}ms`);
        
        if (recommendations.length > 0) {
            console.log(`\n💡 建议:`);
            recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        } else {
            console.log(`\n✅ 数据库运行正常，无改进建议`);
        }
        
        return { status, totalTime, connectTime, perfTime };
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.log(`\n❌ 健康检查失败:`);
        console.log(`   错误: ${error.message}`);
        console.log(`   耗时: ${totalTime}ms`);
        console.log(`\n💡 故障排查建议:`);
        console.log(`   1. 检查网络连接到云服务器 (8.145.34.30:5432)`);
        console.log(`   2. 确认云服务器PostgreSQL服务运行状态`);
        console.log(`   3. 验证数据库用户权限和密码`);
        console.log(`   4. 检查服务器防火墙配置`);
        
        return { status: 'UNHEALTHY', error: error.message, totalTime };
        
    } finally {
        await client.end();
    }
}

// 命令行使用
if (require.main === module) {
    quickHealthCheck()
        .then(result => {
            if (result.status === 'UNHEALTHY') {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('检查执行异常:', error.message);
            process.exit(1);
        });
}

module.exports = quickHealthCheck;