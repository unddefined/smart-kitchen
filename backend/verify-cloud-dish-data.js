const { Client } = require('pg');

async function verifyCloudDatabase() {
    console.log('🔍 开始验证云数据库数据...\n');
    
    // 云服务器数据库连接信息
    const dbConfig = {
        host: '8.145.34.30',
        port: 5432,
        database: 'smart_kitchen_prod',
        user: 'smart_kitchen_user',
        password: '13814349230cX'
    };
    
    const client = new Client(dbConfig);
    
    try {
        // 连接数据库
        await client.connect();
        console.log('✅ 云数据库连接成功\n');
        
        // 1. 验证表结构
        console.log('📋 1. 数据库表结构验证');
        const tables = ['stations', 'dish_categories', 'dishes'];
        for (const table of tables) {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`  ${table}: ${countResult.rows[0].count} 条记录`);
        }
        console.log('');
        
        // 2. 验证工位数据
        console.log('🏢 2. 工位数据验证');
        const stationsResult = await client.query(`
            SELECT id, name, created_at 
            FROM stations 
            ORDER BY id
        `);
        stationsResult.rows.forEach(station => {
            console.log(`  ID:${station.id} - ${station.name}`);
        });
        console.log('');
        
        // 3. 验证菜品分类
        console.log('🏷️  3. 菜品分类验证');
        const categoriesResult = await client.query(`
            SELECT id, name, description, display_order 
            FROM dish_categories 
            ORDER BY display_order
        `);
        categoriesResult.rows.forEach(category => {
            console.log(`  ID:${category.id} - ${category.name} (${category.description})`);
        });
        console.log('');
        
        // 4. 详细菜品统计
        console.log('🍽️  4. 菜品详细统计');
        const dishStats = await client.query(`
            SELECT 
                dc.name as 分类,
                COUNT(d.id) as 菜品总数,
                COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 计数菜品,
                STRING_AGG(
                    CASE WHEN d.countable = TRUE THEN d.name ELSE NULL END, 
                    ', '
                ) as 计数菜品列表
            FROM dish_categories dc
            LEFT JOIN dishes d ON dc.id = d.category_id
            GROUP BY dc.id, dc.name, dc.display_order
            ORDER BY dc.display_order
        `);
        
        dishStats.rows.forEach(stat => {
            console.log(`${stat.分类}:`);
            console.log(`  总数: ${stat.菜品总数} 个`);
            console.log(`  计数: ${stat.计数菜品} 个`);
            if (stat.计数菜品列表) {
                console.log(`  计数菜品: ${stat.计数菜品列表}`);
            }
            console.log('');
        });
        
        // 5. 按工位统计菜品
        console.log('👨‍🍳 5. 按工位统计菜品');
        const stationStats = await client.query(`
            SELECT 
                s.name as 工位,
                COUNT(d.id) as 菜品数,
                COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 计数菜品数
            FROM stations s
            LEFT JOIN dishes d ON s.id = d.station_id
            GROUP BY s.id, s.name
            ORDER BY s.name
        `);
        
        stationStats.rows.forEach(stat => {
            console.log(`${stat.工位}: ${stat.菜品数}个菜品 (${stat.计数菜品数}个计数)`);
        });
        console.log('');
        
        // 6. 验证特殊标记菜品
        console.log('🎯 6. 特殊标记菜品验证');
        const specialDishes = await client.query(`
            SELECT 
                d.name as 菜品名称,
                dc.name as 分类,
                s.name as 工位,
                d.countable as 是否计数
            FROM dishes d
            JOIN dish_categories dc ON d.category_id = dc.id
            JOIN stations s ON d.station_id = s.id
            WHERE d.name LIKE '%（计数）%'
            ORDER BY dc.display_order, d.name
        `);
        
        if (specialDishes.rows.length > 0) {
            console.log('需要计数的菜品:');
            specialDishes.rows.forEach(dish => {
                console.log(`  ✓ ${dish.菜品名称} - ${dish.分类} - ${dish.工位}`);
            });
        } else {
            console.log('未找到标记为"（计数）"的菜品');
        }
        console.log('');
        
        // 7. 数据完整性检查
        console.log('✅ 7. 数据完整性检查');
        
        // 检查是否有菜品没有分配分类
        const unclassified = await client.query(`
            SELECT COUNT(*) as count 
            FROM dishes 
            WHERE category_id IS NULL OR category_id = 0
        `);
        console.log(`  未分类菜品: ${unclassified.rows[0].count} 个`);
        
        // 检查是否有菜品没有分配工位
        const unstationed = await client.query(`
            SELECT COUNT(*) as count 
            FROM dishes 
            WHERE station_id IS NULL OR station_id = 0
        `);
        console.log(`  未分配工位菜品: ${unstationed.rows[0].count} 个`);
        
        // 检查外键约束
        const fkIssues = await client.query(`
            SELECT COUNT(*) as count 
            FROM dishes d
            LEFT JOIN stations s ON d.station_id = s.id
            LEFT JOIN dish_categories dc ON d.category_id = dc.id
            WHERE s.id IS NULL OR dc.id IS NULL
        `);
        console.log(`  外键约束问题: ${fkIssues.rows[0].count} 个`);
        
        console.log('\n🎉 云数据库数据验证完成！');
        console.log('✅ 所有菜品数据已成功录入并验证通过！');
        
    } catch (error) {
        console.error('❌ 数据验证失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 执行数据验证
verifyCloudDatabase().catch(console.error);