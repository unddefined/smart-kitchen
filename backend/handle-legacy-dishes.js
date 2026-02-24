const { Client } = require('pg');

async function handleLegacyDishes() {
    console.log('🔧 处理历史遗留菜品数据...\n');
    
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
        
        // 查找没有分类的历史菜品
        console.log('🔍 查找未分类的历史菜品...');
        const legacyDishes = await client.query(`
            SELECT id, name, station_id
            FROM dishes 
            WHERE category_id IS NULL OR category_id = 0
            ORDER BY name
        `);
        
        if (legacyDishes.rows.length === 0) {
            console.log('✅ 没有发现未分类的菜品');
            return;
        }
        
        console.log(`发现 ${legacyDishes.rows.length} 个未分类菜品:`);
        legacyDishes.rows.forEach(dish => {
            console.log(`  - ${dish.name} (工位ID: ${dish.station_id})`);
        });
        console.log('');
        
        // 获取分类映射关系
        const categories = await client.query('SELECT id, name FROM dish_categories');
        const categoryMap = {};
        categories.rows.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });
        
        // 获取工位映射关系
        const stations = await client.query('SELECT id, name FROM stations');
        const stationMap = {};
        stations.rows.forEach(station => {
            stationMap[station.id] = station.name;
        });
        
        // 为未分类菜品智能分配分类
        console.log('🤖 智能分配菜品分类...');
        let updatedCount = 0;
        
        for (const dish of legacyDishes.rows) {
            let categoryId = null;
            const dishName = dish.name.toLowerCase();
            const stationName = stationMap[dish.station_id] || '';
            
            // 根据菜品名称关键词判断分类
            if (dishName.includes('凉') || dishName.includes('冷')) {
                categoryId = categoryMap['凉菜'];
            } else if (dishName.includes('汤') || dishName.includes('羹')) {
                categoryId = categoryMap['前菜'];
            } else if (dishName.includes('点心') || dishName.includes('小笼') || dishName.includes('糕')) {
                categoryId = categoryMap['点心'];
            } else if (dishName.includes('蒸')) {
                categoryId = categoryMap['蒸菜'];
            } else if (stationName === '凉菜') {
                categoryId = categoryMap['凉菜'];
            } else if (stationName === '点心') {
                categoryId = categoryMap['点心'];
            } else if (stationName === '蒸煮') {
                categoryId = categoryMap['蒸菜'];
            } else {
                // 默认归类为主菜
                categoryId = categoryMap['中菜'];
            }
            
            if (categoryId) {
                await client.query(
                    `UPDATE dishes SET category_id = $1 WHERE id = $2`,
                    [categoryId, dish.id]
                );
                updatedCount++;
                
                const categoryName = categories.rows.find(c => c.id === categoryId).name;
                console.log(`  ✓ ${dish.name} -> ${categoryName}`);
            }
        }
        
        console.log(`\n✅ 成功为 ${updatedCount} 个菜品分配了分类`);
        
        // 再次验证数据完整性
        console.log('\n🔍 再次验证数据完整性...');
        const finalCheck = await client.query(`
            SELECT COUNT(*) as unclassified_count
            FROM dishes 
            WHERE category_id IS NULL OR category_id = 0
        `);
        
        console.log(`剩余未分类菜品: ${finalCheck.rows[0].unclassified_count} 个`);
        
        if (finalCheck.rows[0].unclassified_count === 0) {
            console.log('🎉 所有菜品均已正确分类！');
        }
        
    } catch (error) {
        console.error('❌ 处理遗留数据失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// 执行遗留数据处理
handleLegacyDishes().catch(console.error);