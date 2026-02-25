"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 开始初始化数据库...');
    console.log('📋 创建工位数据...');
    const stationsData = [
        { name: '凉菜' },
        { name: '点心' },
        { name: '蒸菜' },
        { name: '打荷' },
        { name: '切配' },
    ];
    const stations = await prisma.station.createMany({
        data: stationsData,
        skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${stations.count} 个工位`);
    console.log('🏷️  创建菜品分类...');
    const categoriesData = [
        { name: '凉菜', description: '开胃凉菜类', displayOrder: 1 },
        { name: '前菜', description: '开胃前菜类', displayOrder: 2 },
        { name: '中菜', description: '主菜类', displayOrder: 3 },
        { name: '点心', description: '精致点心类', displayOrder: 4 },
        { name: '蒸菜', description: '蒸制菜品类', displayOrder: 5 },
        { name: '后菜', description: '配菜类', displayOrder: 6 },
        { name: '尾菜', description: '收尾菜品类', displayOrder: 7 },
        { name: '主食', description: '米饭面条等主食', displayOrder: 9 },
    ];
    const categories = await prisma.dishCategory.createMany({
        data: categoriesData,
        skipDuplicates: true,
    });
    console.log(`✅ 创建了 ${categories.count} 个菜品分类`);
    const stationMap = {};
    const categoryMap = {};
    for (const stationData of stationsData) {
        const station = await prisma.station.findUnique({
            where: { name: stationData.name }
        });
        if (station) {
            stationMap[stationData.name] = station.id;
        }
    }
    for (const categoryData of categoriesData) {
        const category = await prisma.dishCategory.findUnique({
            where: { name: categoryData.name }
        });
        if (category) {
            categoryMap[categoryData.name] = category.id;
        }
    }
    console.log('📖 创建菜谱数据...');
    const recipesData = [
        {
            name: '三文鱼拼鹅肝',
            description: '精选三文鱼搭配法国鹅肝，口感丰富',
            ingredientList: '三文鱼200g,鹅肝100g,柠檬汁10ml,橄榄油15ml,黑胡椒适量,盐适量',
            steps: '1.三文鱼切片摆盘 2.鹅肝煎制切片 3.淋上调料汁 4.撒上黑胡椒装饰',
            tags: ['凉菜', '高档', '海鲜'],
        },
        {
            name: '美味八碟',
            description: '八种经典凉菜组合，开胃佳品',
            ingredientList: '黄瓜,胡萝卜,豆腐皮,木耳,海带丝,豆芽,花生米,芝麻',
            steps: '1.各种蔬菜分别处理 2.调制统一调料汁 3.按美观方式摆盘 4.浇上调料拌匀',
            tags: ['凉菜', '组合', '开胃'],
        },
        {
            name: '藜麦元宝虾',
            description: '营养丰富的藜麦包裹鲜虾，造型精美',
            ingredientList: '鲜虾300g,藜麦100g,鸡蛋1个,面包糠50g,盐适量,胡椒粉适量',
            steps: '1.虾仁去壳留尾 2.藜麦煮熟拌调料 3.虾仁裹藜麦蛋液面包糠 4.油炸至金黄',
            tags: ['前菜', '创意', '营养'],
        },
        {
            name: '椒盐基围虾',
            description: '经典椒盐风味，外酥里嫩',
            ingredientList: '基围虾500g,椒盐粉20g,淀粉30g,鸡蛋1个,食用油适量',
            steps: '1.虾洗净去须 2.腌制入味 3.裹粉蛋液 4.高温油炸 5.撒椒盐调味',
            tags: ['前菜', '经典', '酥脆'],
        },
        {
            name: '红烧肉',
            description: '传统经典红烧肉，肥而不腻',
            ingredientList: '五花肉500g,冰糖30g,生抽50ml,老抽20ml,料酒30ml,葱姜适量',
            steps: '1.五花肉切块焯水 2.炒糖色 3.煸炒肉块 4.加调料炖煮 5.收汁装盘',
            tags: ['中菜', '经典', '家常'],
        },
        {
            name: '藤椒双脆',
            description: '藤椒麻香，口感爽脆',
            ingredientList: '鸡胗200g,毛豆米150g,藤椒油30ml,蒜泥10g,生抽20ml',
            steps: '1.鸡胗处理切片 2.毛豆米焯水 3.爆炒调味 4.淋藤椒油',
            tags: ['中菜', '川菜', '麻香'],
        },
        {
            name: '托炉饼',
            description: '传统炉饼，香脆可口',
            ingredientList: '面粉300g,温水150ml,盐3g,食用油适量,芝麻适量',
            steps: '1.面粉和面 2.分割擀饼 3.刷油撒芝麻 4.炉火烘烤 5.出炉切块',
            tags: ['中菜', '传统', '面食'],
        },
        {
            name: '小笼馒头',
            description: '皮薄馅嫩，汤汁丰富',
            ingredientList: '面粉200g,猪肉馅150g,皮冻100g,葱姜适量,调料适量',
            steps: '1.制作皮冻 2.调制肉馅 3.和面擀皮 4.包制成型 5.蒸制15分钟',
            tags: ['点心', '经典', '汤包'],
        },
        {
            name: '清蒸大黄鱼',
            description: '保持原汁原味，鲜美无比',
            ingredientList: '大黄鱼1条,葱丝适量,姜丝适量,蒸鱼豉油30ml,料酒15ml',
            steps: '1.黄鱼处理洗净 2.腌制去腥 3.摆盘加料 4.大火蒸制 5.淋热油调味',
            tags: ['蒸菜', '清淡', '海鲜'],
        },
        {
            name: '菠萝炒饭',
            description: '酸甜开胃，色彩丰富',
            ingredientList: '米饭300g,菠萝100g,虾仁50g,鸡蛋2个,青豆30g,胡萝卜丁30g',
            steps: '1.食材准备切丁 2.鸡蛋炒散 3.虾仁炒熟 4.蔬菜炒制 5.加入米饭菠萝炒匀',
            tags: ['后菜', '炒饭', '酸甜'],
        },
        {
            name: '时蔬',
            description: '时令蔬菜，清淡爽口',
            ingredientList: '时令青菜300g,蒜蓉10g,盐适量,食用油适量',
            steps: '1.蔬菜清洗 2.蒜蓉爆香 3.下菜翻炒 4.调味出锅',
            tags: ['尾菜', '清淡', '时蔬'],
        },
        {
            name: '蛋皮汤',
            description: '清淡鲜美，营养丰富',
            ingredientList: '鸡蛋2个,清水500ml,紫菜适量,虾皮适量,盐适量,香油几滴',
            steps: '1.鸡蛋摊成蛋皮切丝 2.水烧开 3.加入配料 4.调味 5.淋香油',
            tags: ['尾菜', '汤类', '清淡'],
        },
    ];
    const createdRecipes = [];
    for (const recipeData of recipesData) {
        const recipe = await prisma.recipe.create({
            data: recipeData
        });
        createdRecipes.push(recipe);
    }
    console.log(`✅ 创建了 ${createdRecipes.length} 个菜谱`);
    console.log('🍽️  创建菜品数据...');
    const dishesData = [
        { name: '三文鱼拼鹅肝', stationId: stationMap['凉菜'], categoryId: categoryMap['凉菜'], shortcutCode: 'SWSPGH', recipeId: createdRecipes.find(r => r.name === '三文鱼拼鹅肝')?.id },
        { name: '美味八碟', stationId: stationMap['凉菜'], categoryId: categoryMap['凉菜'], shortcutCode: 'MWBD', recipeId: createdRecipes.find(r => r.name === '美味八碟')?.id },
        { name: '藜麦元宝虾', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'LMYYX', recipeId: createdRecipes.find(r => r.name === '藜麦元宝虾')?.id },
        { name: '盐水河虾', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'YSHX' },
        { name: '红汤油爆河虾', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'HTYBHX' },
        { name: '椒盐基围虾', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'JYJWX', recipeId: createdRecipes.find(r => r.name === '椒盐基围虾')?.id },
        { name: '发财银鱼羹', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'FCYYG' },
        { name: '海皇鲍翅羹', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'HHBCG' },
        { name: '牛肉羹', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'NRG' },
        { name: '扎腻头', stationId: stationMap['前菜'], categoryId: categoryMap['前菜'], shortcutCode: 'ZNT' },
        { name: '藤椒双脆', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'TZSC', recipeId: createdRecipes.find(r => r.name === '藤椒双脆')?.id },
        { name: '红烧肉', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'HSR', recipeId: createdRecipes.find(r => r.name === '红烧肉')?.id },
        { name: '板栗烧鳝筒', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'BLSST' },
        { name: '黑椒菌香牛肉粒', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'HJJXNRL' },
        { name: '香菜腰花', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'XCYH' },
        { name: '野菜山药虾仁', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'YCSYXR' },
        { name: '佛跳墙', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'FTQ' },
        { name: '葱烧玛卡菌海参蹄筋', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'CSMKJHCTJ' },
        { name: '红烧河鱼', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'HSHY' },
        { name: '椒盐猪手', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'JYZS' },
        { name: '葱姜炒珍宝蟹', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'CJCZBX' },
        { name: '清炒虾仁', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'QCXR' },
        { name: '茶树菇炭烧肉', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'CSGTSR' },
        { name: '黑椒牛仔骨', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'HJNZG' },
        { name: '椒盐排骨', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'JYGP', countable: true },
        { name: '红烧鳗鱼板栗', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'HSEYBL' },
        { name: '黎山汁虾球', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'LSZXQ' },
        { name: '托炉饼', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'TLB', recipeId: createdRecipes.find(r => r.name === '托炉饼')?.id, countable: true },
        { name: '松鼠桂鱼', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'SSGY' },
        { name: '小炒黄牛肉', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'XCHNR' },
        { name: '干捞粉丝', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'GLFS' },
        { name: '铁板豆腐', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'TBDF', countable: true },
        { name: '沙拉牛排', stationId: stationMap['中菜'], categoryId: categoryMap['中菜'], shortcutCode: 'SLNP', countable: true },
        { name: '小笼馒头', stationId: stationMap['点心'], categoryId: categoryMap['点心'], shortcutCode: 'XLMT', recipeId: createdRecipes.find(r => r.name === '小笼馒头')?.id, countable: true },
        { name: '手工米糕', stationId: stationMap['点心'], categoryId: categoryMap['点心'], shortcutCode: 'SGMG', countable: true },
        { name: '红蒸湘鱼', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'HZXY' },
        { name: '蒜蓉小鲍鱼', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'TRXBY', countable: true },
        { name: '清蒸大黄鱼', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'QZDHY', recipeId: createdRecipes.find(r => r.name === '清蒸大黄鱼')?.id },
        { name: '菌菇整鸡煲', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'JGZJB' },
        { name: '乌米饭', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'WMF', countable: true },
        { name: '红蒸长寿鱼', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'HZCSY' },
        { name: '蒜蓉小青龙', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'TRXQL' },
        { name: '清蒸牛肋骨', stationId: stationMap['蒸菜'], categoryId: categoryMap['蒸菜'], shortcutCode: 'QZNLG' },
        { name: '菠萝炒饭', stationId: stationMap['后菜'], categoryId: categoryMap['后菜'], shortcutCode: 'PLCF', recipeId: createdRecipes.find(r => r.name === '菠萝炒饭')?.id },
        { name: '雪菜冬笋', stationId: stationMap['后菜'], categoryId: categoryMap['后菜'], shortcutCode: 'XCD' },
        { name: '荷塘月色', stationId: stationMap['后菜'], categoryId: categoryMap['后菜'], shortcutCode: 'HTYS' },
        { name: '金蒜小葱山药', stationId: stationMap['后菜'], categoryId: categoryMap['后菜'], shortcutCode: 'JSCCSY' },
        { name: '雪菜马蹄炒鲜蘑', stationId: stationMap['后菜'], categoryId: categoryMap['后菜'], shortcutCode: 'XCMT' },
        { name: '时蔬', stationId: stationMap['尾菜'], categoryId: categoryMap['尾菜'], shortcutCode: 'SS', recipeId: createdRecipes.find(r => r.name === '时蔬')?.id },
        { name: '蛋皮汤', stationId: stationMap['尾菜'], categoryId: categoryMap['尾菜'], shortcutCode: 'DPT', recipeId: createdRecipes.find(r => r.name === '蛋皮汤')?.id },
    ];
    const createdDishes = [];
    for (const dishData of dishesData) {
        const dish = await prisma.dish.create({
            data: dishData
        });
        createdDishes.push(dish);
    }
    console.log(`✅ 创建了 ${createdDishes.length} 个菜品`);
    console.log('📝 创建测试订单数据...');
    const testOrders = [
        {
            hallNumber: 'A01',
            peopleCount: 4,
            tableCount: 1,
            status: 'created',
            mealTime: '2024-12-01 午餐',
        },
        {
            hallNumber: 'B02',
            peopleCount: 2,
            tableCount: 1,
            status: 'started',
            mealTime: '2024-12-01 晚餐',
        },
        {
            hallNumber: 'C03',
            peopleCount: 6,
            tableCount: 2,
            status: 'serving',
            mealTime: '2024-12-01 午餐',
        },
    ];
    const createdOrders = [];
    for (const orderData of testOrders) {
        const order = await prisma.order.create({
            data: orderData
        });
        createdOrders.push(order);
    }
    console.log('🛒 创建订单菜品项...');
    const sampleDishes = createdDishes.slice(0, 8);
    for (let i = 0; i < createdOrders.length; i++) {
        const order = createdOrders[i];
        const orderDishes = sampleDishes.slice(i, i + 3);
        for (let j = 0; j < orderDishes.length; j++) {
            const dish = orderDishes[j];
            const statuses = ['pending', 'prep', 'ready', 'served'];
            const priorities = [0, 1, 2, 3];
            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    dishId: dish.id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    priority: priorities[Math.floor(Math.random() * priorities.length)],
                    remark: j === 0 ? '微辣' : j === 1 ? '少盐' : undefined,
                    countable: dish.name.includes('托炉饼') || dish.name.includes('小笼馒头'),
                }
            });
        }
    }
    console.log('🎉 数据库初始化完成！');
    console.log('\n📊 初始化数据统计:');
    console.log(`   • 工位: ${Object.keys(stationMap).length}个`);
    console.log(`   • 菜品分类: ${Object.keys(categoryMap).length}个`);
    console.log(`   • 菜谱: ${createdRecipes.length}个`);
    console.log(`   • 菜品: ${createdDishes.length}个`);
    console.log(`   • 订单: ${createdOrders.length}个`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map