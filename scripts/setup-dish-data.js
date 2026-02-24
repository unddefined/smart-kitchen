const { PrismaClient } = require('@prisma/client');

async function setupDishData() {
    console.log('🍽️  开始录入菜品数据...\n');
    
    const prisma = new PrismaClient();
    
    try {
        // 测试数据库连接
        await prisma.$connect();
        console.log('✅ 数据库连接成功\n');
        
        // 1. 创建菜品分类
        console.log('1️⃣ 创建菜品分类...');
        const categories = [
            { name: '凉菜', description: '开胃凉菜类', display_order: 1 },
            { name: '前菜', description: '餐前小食类', display_order: 2 },
            { name: '中菜', description: '主菜热菜类', display_order: 3 },
            { name: '点心', description: '精致小点类', display_order: 4 },
            { name: '蒸菜', description: '蒸制菜品类', display_order: 5 },
            { name: '后菜', description: '餐后蔬菜类', display_order: 6 },
            { name: '尾菜', description: '汤品素菜类', display_order: 7 }
        ];
        
        for (const category of categories) {
            await prisma.dishCategory.upsert({
                where: { name: category.name },
                update: {},
                create: category
            });
        }
        console.log('✅ 菜品分类创建完成\n');
        
        // 2. 确保工位存在
        console.log('2️⃣ 检查工位数据...');
        const stations = [
            { name: '热菜' },
            { name: '打荷' },
            { name: '凉菜' },
            { name: '蒸煮' },
            { name: '点心' },
            { name: '切配' }
        ];
        
        for (const station of stations) {
            await prisma.station.upsert({
                where: { name: station.name },
                update: {},
                create: station
            });
        }
        console.log('✅ 工位数据准备完成\n');
        
        // 3. 获取工位和分类ID
        const stationMap = {};
        const stationsData = await prisma.station.findMany();
        stationsData.forEach(station => {
            stationMap[station.name] = station.id;
        });
        
        const categoryMap = {};
        const categoriesData = await prisma.dishCategory.findMany();
        categoriesData.forEach(category => {
            categoryMap[category.name] = category.id;
        });
        
        // 4. 录入菜品数据
        console.log('3️⃣ 录入菜品数据...');
        
        // 凉菜类
        const coldDishes = [
            { name: '三文鱼拼鹅肝', category: '凉菜', station: '凉菜' },
            { name: '美味八碟', category: '凉菜', station: '凉菜' }
        ];
        
        // 前菜类
        const appetizerDishes = [
            { name: '藜麦元宝虾', category: '前菜', station: '热菜' },
            { name: '盐水河虾', category: '前菜', station: '热菜' },
            { name: '红汤油爆河虾', category: '前菜', station: '热菜' },
            { name: '椒盐基围虾', category: '前菜', station: '热菜' },
            { name: '发财银鱼羹', category: '前菜', station: '热菜' },
            { name: '海皇鲍翅羹', category: '前菜', station: '热菜' },
            { name: '牛肉羹', category: '前菜', station: '热菜' },
            { name: '扎腻头', category: '前菜', station: '热菜' }
        ];
        
        // 中菜类（包含需要计数的菜品）
        const mainDishes = [
            { name: '藤椒双脆', category: '中菜', station: '热菜' },
            { name: '红烧肉', category: '中菜', station: '热菜' },
            { name: '板栗烧鳝筒', category: '中菜', station: '热菜' },
            { name: '黑椒菌香牛肉粒', category: '中菜', station: '热菜' },
            { name: '香菜腰花', category: '中菜', station: '热菜' },
            { name: '野菜山药虾仁', category: '中菜', station: '热菜' },
            { name: '佛跳墙', category: '中菜', station: '热菜' },
            { name: '葱烧玛卡菌海参蹄筋', category: '中菜', station: '热菜' },
            { name: '红烧河鱼', category: '中菜', station: '热菜' },
            { name: '椒盐猪手', category: '中菜', station: '热菜' },
            { name: '葱姜炒珍宝蟹', category: '中菜', station: '热菜' },
            { name: '清炒虾仁', category: '中菜', station: '热菜' },
            { name: '茶树菇炭烧肉', category: '中菜', station: '热菜' },
            { name: '黑椒牛仔骨', category: '中菜', station: '热菜' },
            { name: '椒盐排骨（计数）', category: '中菜', station: '热菜', countable: true },
            { name: '红烧鳗鱼板栗', category: '中菜', station: '热菜' },
            { name: '黎山汁虾球', category: '中菜', station: '热菜' },
            { name: '托炉饼（计数）', category: '中菜', station: '热菜', countable: true },
            { name: '松鼠桂鱼', category: '中菜', station: '热菜' },
            { name: '小炒黄牛肉', category: '中菜', station: '热菜' },
            { name: '干捞粉丝', category: '中菜', station: '热菜' },
            { name: '铁板豆腐（计数）', category: '中菜', station: '热菜', countable: true },
            { name: '沙拉牛排（计数）', category: '中菜', station: '热菜', countable: true }
        ];
        
        // 点心类（需要计数）
        const dimsumDishes = [
            { name: '小笼馒头（计数）', category: '点心', station: '点心', countable: true },
            { name: '手工米糕（计数）', category: '点心', station: '点心', countable: true }
        ];
        
        // 蒸菜类
        const steamedDishes = [
            { name: '红蒸湘鱼', category: '蒸菜', station: '蒸煮' },
            { name: '蒜蓉小鲍鱼（计数）', category: '蒸菜', station: '蒸煮', countable: true },
            { name: '清蒸大黄鱼', category: '蒸菜', station: '蒸煮' },
            { name: '菌菇整鸡煲', category: '蒸菜', station: '蒸煮' },
            { name: '乌米饭（计数）', category: '蒸菜', station: '蒸煮', countable: true },
            { name: '红蒸长寿鱼', category: '蒸菜', station: '蒸煮' },
            { name: '蒜蓉小青龙', category: '蒸菜', station: '蒸煮' },
            { name: '清蒸牛肋骨', category: '蒸菜', station: '蒸煮' }
        ];
        
        // 后菜类
        const vegetableDishes = [
            { name: '菠萝炒饭', category: '后菜', station: '热菜' },
            { name: '雪菜冬笋', category: '后菜', station: '热菜' },
            { name: '荷塘月色', category: '后菜', station: '热菜' },
            { name: '金蒜小葱山药', category: '后菜', station: '热菜' }
        ];
        
        // 尾菜类
        const soupDishes = [
            { name: '时蔬', category: '尾菜', station: '热菜' },
            { name: '蛋皮汤', category: '尾菜', station: '热菜' }
        ];
        
        // 合并所有菜品
        const allDishes = [
            ...coldDishes,
            ...appetizerDishes,
            ...mainDishes,
            ...dimsumDishes,
            ...steamedDishes,
            ...vegetableDishes,
            ...soupDishes
        ];
        
        // 录入菜品
        let insertedCount = 0;
        let countableCount = 0;
        
        for (const dish of allDishes) {
            const isCountable = dish.countable || false;
            if (isCountable) countableCount++;
            
            await prisma.dish.upsert({
                where: { name: dish.name },
                update: {
                    stationId: stationMap[dish.station],
                    categoryId: categoryMap[dish.category],
                    countable: isCountable
                },
                create: {
                    name: dish.name,
                    stationId: stationMap[dish.station],
                    categoryId: categoryMap[dish.category],
                    shortcutCode: dish.name.substring(0, 4).toUpperCase(),
                    countable: isCountable
                }
            });
            insertedCount++;
        }
        
        console.log(`✅ 成功录入 ${insertedCount} 个菜品，其中 ${countableCount} 个需要计数\n`);
        
        // 5. 显示统计结果
        console.log('📊 录入结果统计:');
        const categoryStats = await prisma.dishCategory.findMany({
            include: {
                dishes: {
                    select: {
                        id: true,
                        countable: true
                    }
                }
            },
            orderBy: {
                display_order: 'asc'
            }
        });
        
        categoryStats.forEach(category => {
            const totalCount = category.dishes.length;
            const countableCount = category.dishes.filter(d => d.countable).length;
            console.log(`${category.name}: ${totalCount}个菜品 (${countableCount}个计数)`);
        });
        
        console.log('\n✅ 菜品数据录入完成！');
        
    } catch (error) {
        console.error('❌ 数据录入失败:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// 执行数据录入
setupDishData().catch(console.error);