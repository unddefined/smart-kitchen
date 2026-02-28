#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function accurateDataRecovery() {
    console.log('🎯 基于菜品库的精确数据恢复程序\n');
    
    const prisma = new PrismaClient();
    
    try {
        await prisma.$connect();
        console.log('✅ 数据库连接成功\n');
        
        // 检查当前状态
        const currentDishCount = await prisma.dish.count();
        console.log(`📊 当前菜品数量: ${currentDishCount}`);
        
        // 从菜品库定义准确的菜品数据
        const dishLibrary = {
            '凉菜': [
                { name: '三文鱼拼鹅肝', countable: false },
                { name: '美味八碟', countable: false }
            ],
            '前菜': [
                { name: '藜麦元宝虾', countable: false },
                { name: '盐水河虾', countable: false },
                { name: '红汤油爆河虾', countable: false },
                { name: '椒盐基围虾', countable: false },
                { name: '发财银鱼羹', countable: false },
                { name: '海皇鲍翅羹', countable: false },
                { name: '牛肉羹', countable: false },
                { name: '扎腻头', countable: false }
            ],
            '中菜': [
                { name: '藤椒双脆', countable: false },
                { name: '红烧肉', countable: false },
                { name: '板栗烧鳝筒', countable: false },
                { name: '黑椒菌香牛肉粒', countable: false },
                { name: '香菜腰花', countable: false },
                { name: '野菜山药虾仁', countable: false },
                { name: '佛跳墙', countable: false },
                { name: '葱烧玛卡菌海参蹄筋', countable: false },
                { name: '红烧河鱼', countable: false },
                { name: '椒盐猪手', countable: false },
                { name: '葱姜炒珍宝蟹', countable: false },
                { name: '清炒虾仁', countable: false },
                { name: '茶树菇炭烧肉', countable: false },
                { name: '黑椒牛仔骨', countable: false },
                { name: '椒盐排骨', countable: true }, // 计数
                { name: '红烧鳗鱼板栗', countable: false },
                { name: '黎山汁虾球', countable: false },
                { name: '托炉饼', countable: true }, // 计数
                { name: '松鼠桂鱼', countable: false },
                { name: '小炒黄牛肉', countable: false },
                { name: '干捞粉丝', countable: false },
                { name: '铁板豆腐', countable: true }, // 计数
                { name: '沙拉牛排', countable: true } // 计数
            ],
            '点心': [
                { name: '小笼馒头', countable: true }, // 计数
                { name: '手工米糕', countable: true } // 计数
            ],
            '蒸菜': [
                { name: '红蒸湘鱼', countable: false },
                { name: '蒜蓉小鲍鱼', countable: true }, // 计数
                { name: '清蒸大黄鱼', countable: false },
                { name: '菌菇整鸡煲', countable: false },
                { name: '乌米饭', countable: true }, // 计数
                { name: '红蒸长寿鱼', countable: false },
                { name: '蒜蓉小青龙', countable: false },
                { name: '清蒸牛肋骨', countable: false }
            ],
            '后菜': [
                { name: '菠萝炒饭', countable: false },
                { name: '雪菜冬笋', countable: false },
                { name: '荷塘月色', countable: false },
                { name: '金蒜小葱山药', countable: false },
                { name: '雪菜马蹄炒鲜蘑', countable: false }
            ],
            '尾菜': [
                { name: '时蔬', countable: false },
                { name: '蛋皮汤', countable: false }
            ]
        };
        
        // 确保基础数据结构
        console.log('🔧 确保基础分类和工位...');
        
        // 创建或验证分类
        const categories = [
            { name: '凉菜', description: '开胃凉菜类', displayOrder: 1 },
            { name: '前菜', description: '开胃前菜类', displayOrder: 2 },
            { name: '中菜', description: '主菜类', displayOrder: 3 },
            { name: '点心', description: '精致点心类', displayOrder: 4 },
            { name: '蒸菜', description: '蒸制菜品类', displayOrder: 5 },
            { name: '后菜', description: '配菜类', displayOrder: 6 },
            { name: '尾菜', description: '汤品类', displayOrder: 7 }
        ];
        
        const categoryMap = {};
        for (const cat of categories) {
            const existing = await prisma.dishCategory.findFirst({
                where: { name: cat.name }
            });
            if (existing) {
                categoryMap[cat.name] = existing.id;
            } else {
                const newCat = await prisma.dishCategory.create({ data: cat });
                categoryMap[cat.name] = newCat.id;
                console.log(`  ✅ 创建分类: ${cat.name}`);
            }
        }
        
        // 创建或验证工位
        const stations = [
            { name: '热菜' },
            { name: '打荷' },
            { name: '凉菜' },
            { name: '蒸菜' },
            { name: '点心' },
            { name: '切配' }
        ];
        
        const stationMap = {};
        for (const station of stations) {
            const existing = await prisma.station.findFirst({
                where: { name: station.name }
            });
            if (existing) {
                stationMap[station.name] = existing.id;
            } else {
                const newStation = await prisma.station.create({ data: station });
                stationMap[station.name] = newStation.id;
                console.log(`  ✅ 创建工位: ${station.name}`);
            }
        }
        
        // 映射菜品到工位的逻辑
        function getStationForDish(dishName, categoryName) {
            // 根据菜品名称和分类确定工位
            if (categoryName === '凉菜') return '凉菜';
            if (categoryName === '点心') return '点心';
            if (categoryName === '蒸菜') return '蒸菜';
            
            // 中菜和前菜通常在热菜工位制作
            if (categoryName === '中菜' || categoryName === '前菜') {
                // 特殊处理需要特定工位的菜品
                if (dishName.includes('蒸') || dishName.includes('炖')) return '蒸菜';
                if (dishName.includes('点心') || dishName.includes('馒头') || dishName.includes('糕')) return '点心';
                return '热菜';
            }
            
            // 后菜和尾菜通常在热菜工位
            if (categoryName === '后菜' || categoryName === '尾菜') return '热菜';
            
            return '热菜'; // 默认工位
        }
        
        // 恢复菜品数据
        console.log('\n🍽️  根据菜品库恢复菜品数据...');
        let createdCount = 0;
        let skippedCount = 0;
        let totalCount = 0;
        
        for (const [categoryName, dishes] of Object.entries(dishLibrary)) {
            console.log(`\n📁 处理分类: ${categoryName} (${dishes.length}个菜品)`);
            
            for (const dish of dishes) {
                totalCount++;
                const stationName = getStationForDish(dish.name, categoryName);
                
                const existing = await prisma.dish.findFirst({
                    where: { name: dish.name }
                });
                
                if (existing) {
                    console.log(`  ℹ️  菜品 "${dish.name}" 已存在`);
                    skippedCount++;
                    continue;
                }
                
                try {
                    await prisma.dish.create({
                        data: {
                            name: dish.name,
                            categoryId: categoryMap[categoryName],
                            stationId: stationMap[stationName],
                            countable: dish.countable,
                            isActive: true
                        }
                    });
                    console.log(`  ✅ 创建: ${dish.name} (${categoryName} -> ${stationName}) ${dish.countable ? '[计数]' : ''}`);
                    createdCount++;
                } catch (error) {
                    console.log(`  ❌ 创建失败 "${dish.name}":`, error.message);
                    skippedCount++;
                }
            }
        }
        
        // 显示最终统计
        const finalDishCount = await prisma.dish.count();
        const finalCategoryCount = await prisma.dishCategory.count();
        const finalStationCount = await prisma.station.count();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 恢复完成统计:');
        console.log(`  总菜品数(菜品库): ${totalCount}`);
        console.log(`  菜品分类: ${finalCategoryCount} 个`);
        console.log(`  工位: ${finalStationCount} 个`);
        console.log(`  数据库菜品总数: ${finalDishCount} 个`);
        console.log(`  本次新增: ${createdCount} 个`);
        console.log(`  已存在跳过: ${skippedCount} 个`);
        console.log('='.repeat(50));
        
        // 显示各分类的菜品数量
        console.log('\n📋 各分类菜品统计:');
        for (const categoryName of Object.keys(dishLibrary)) {
            const count = await prisma.dish.count({
                where: {
                    category: {
                        name: categoryName
                    }
                }
            });
            console.log(`  ${categoryName}: ${count} 个`);
        }
        
        console.log('\n🎉 精确数据恢复完成！');
        
    } catch (error) {
        console.error('❌ 恢复过程中发生错误:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// 执行恢复
accurateDataRecovery();