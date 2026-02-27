const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://smart_kitchen:13814349230cX@localhost:5432/smart_kitchen_prod?schema=public';

// 菜品库数据
const menuData = {
  categories: [
    { name: '凉菜', displayOrder: 1 },
    { name: '前菜', displayOrder: 2 },
    { name: '中菜', displayOrder: 3 },
    { name: '点心', displayOrder: 4 },
    { name: '蒸菜', displayOrder: 5 },
    { name: '后菜', displayOrder: 6 },
    { name: '尾菜', displayOrder: 7 }
  ],
  stations: [
    { name: '热菜' },
    { name: '凉菜' },
    { name: '蒸菜' },
    { name: '点心' }
  ],
  dishes: [
    // 凉菜
    { name: '三文鱼拼鹅肝', category: '凉菜', station: '凉菜', countable: false },
    { name: '美味八碟', category: '凉菜', station: '凉菜', countable: false },
    
    // 前菜
    { name: '藜麦元宝虾', category: '前菜', station: '热菜', countable: false },
    { name: '盐水河虾', category: '前菜', station: '热菜', countable: false },
    { name: '红汤油爆河虾', category: '前菜', station: '热菜', countable: false },
    { name: '椒盐基围虾', category: '前菜', station: '热菜', countable: false },
    { name: '发财银鱼羹', category: '前菜', station: '热菜', countable: false },
    { name: '海皇鲍翅羹', category: '前菜', station: '热菜', countable: false },
    { name: '牛肉羹', category: '前菜', station: '热菜', countable: false },
    { name: '扎腻头', category: '前菜', station: '热菜', countable: false },
    
    // 中菜
    { name: '藤椒双脆', category: '中菜', station: '热菜', countable: false },
    { name: '红烧肉', category: '中菜', station: '热菜', countable: false },
    { name: '板栗烧鳝筒', category: '中菜', station: '热菜', countable: false },
    { name: '黑椒菌香牛肉粒', category: '中菜', station: '热菜', countable: false },
    { name: '香菜腰花', category: '中菜', station: '热菜', countable: false },
    { name: '野菜山药虾仁', category: '中菜', station: '热菜', countable: false },
    { name: '佛跳墙', category: '中菜', station: '热菜', countable: false },
    { name: '葱烧玛卡菌海参蹄筋', category: '中菜', station: '热菜', countable: false },
    { name: '红烧河鱼', category: '中菜', station: '热菜', countable: false },
    { name: '椒盐猪手', category: '中菜', station: '热菜', countable: false },
    { name: '葱姜炒珍宝蟹', category: '中菜', station: '热菜', countable: false },
    { name: '清炒虾仁', category: '中菜', station: '热菜', countable: false },
    { name: '茶树菇炭烧肉', category: '中菜', station: '热菜', countable: false },
    { name: '黑椒牛仔骨', category: '中菜', station: '热菜', countable: false },
    { name: '椒盐排骨', category: '中菜', station: '热菜', countable: true },
    { name: '红烧鳗鱼板栗', category: '中菜', station: '热菜', countable: false },
    { name: '黎山汁虾球', category: '中菜', station: '热菜', countable: false },
    { name: '托炉饼', category: '中菜', station: '热菜', countable: true },
    { name: '松鼠桂鱼', category: '中菜', station: '热菜', countable: false },
    { name: '小炒黄牛肉', category: '中菜', station: '热菜', countable: false },
    { name: '干捞粉丝', category: '中菜', station: '热菜', countable: false },
    { name: '铁板豆腐', category: '中菜', station: '热菜', countable: true },
    { name: '沙拉牛排', category: '中菜', station: '热菜', countable: true },
    
    // 点心
    { name: '小笼馒头', category: '点心', station: '点心', countable: true },
    { name: '手工米糕', category: '点心', station: '点心', countable: true },
    
    // 蒸菜
    { name: '红蒸湘鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '蒜蓉小鲍鱼', category: '蒸菜', station: '蒸菜', countable: true },
    { name: '清蒸大黄鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '菌菇整鸡煲', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '乌米饭', category: '蒸菜', station: '蒸菜', countable: true },
    { name: '红蒸长寿鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '蒜蓉小青龙', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '清蒸牛肋骨', category: '蒸菜', station: '蒸菜', countable: false },
    
    // 后菜
    { name: '菠萝炒饭', category: '后菜', station: '热菜', countable: false },
    { name: '雪菜冬笋', category: '后菜', station: '热菜', countable: false },
    { name: '荷塘月色', category: '后菜', station: '热菜', countable: false },
    { name: '金蒜小葱山药', category: '后菜', station: '热菜', countable: false },
    { name: '雪菜马蹄炒鲜蘑', category: '后菜', station: '热菜', countable: false },
    
    // 尾菜
    { name: '时蔬', category: '尾菜', station: '热菜', countable: false },
    { name: '蛋皮汤', category: '尾菜', station: '热菜', countable: false }
  ]
};

async function initializeMenuData() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🚀 开始初始化菜品库数据...');
    
    // 1. 创建分类
    console.log('\n1. 创建菜品分类...');
    const categoryMap = {};
    for (const cat of menuData.categories) {
      const existing = await prisma.dishCategory.findFirst({
        where: { name: cat.name }
      });
      
      if (existing) {
        categoryMap[cat.name] = existing.id;
        console.log(`  ℹ️  分类 "${cat.name}" 已存在 (ID: ${existing.id})`);
      } else {
        const newCat = await prisma.dishCategory.create({
          data: {
            name: cat.name,
            displayOrder: cat.displayOrder
          }
        });
        categoryMap[cat.name] = newCat.id;
        console.log(`  ✅ 创建分类 "${cat.name}" (ID: ${newCat.id})`);
      }
    }
    
    // 2. 创建工位
    console.log('\n2. 创建工位...');
    const stationMap = {};
    for (const station of menuData.stations) {
      const existing = await prisma.station.findFirst({
        where: { name: station.name }
      });
      
      if (existing) {
        stationMap[station.name] = existing.id;
        console.log(`  ℹ️  工位 "${station.name}" 已存在 (ID: ${existing.id})`);
      } else {
        const newStation = await prisma.station.create({
          data: {
            name: station.name
          }
        });
        stationMap[station.name] = newStation.id;
        console.log(`  ✅ 创建工位 "${station.name}" (ID: ${newStation.id})`);
      }
    }
    
    // 3. 创建菜品
    console.log('\n3. 创建菜品...');
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const dish of menuData.dishes) {
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
            categoryId: categoryMap[dish.category],
            stationId: stationMap[dish.station],
            countable: dish.countable,
            isActive: true
          }
        });
        console.log(`  ✅ 创建菜品 "${dish.name}" (${dish.category}, ${dish.station})`);
        createdCount++;
      } catch (error) {
        console.log(`  ❌ 创建菜品 "${dish.name}" 失败:`, error.message);
        skippedCount++;
      }
    }
    
    // 4. 显示统计信息
    console.log('\n📊 初始化完成统计:');
    const finalDishCount = await prisma.dish.count();
    const finalCategoryCount = await prisma.dishCategory.count();
    const finalStationCount = await prisma.station.count();
    
    console.log(`  菜品分类: ${finalCategoryCount} 个`);
    console.log(`  工位: ${finalStationCount} 个`);
    console.log(`  菜品: ${finalDishCount} 个`);
    console.log(`  本次新增: ${createdCount} 个`);
    console.log(`  跳过已存在: ${skippedCount} 个`);
    
    // 5. 显示各类别菜品数量
    console.log('\n📋 各分类菜品统计:');
    for (const [categoryName, categoryId] of Object.entries(categoryMap)) {
      const count = await prisma.dish.count({
        where: { categoryId: categoryId }
      });
      console.log(`  ${categoryName}: ${count} 个`);
    }
    
    console.log('\n🎉 菜品库数据初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化过程中出错:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

initializeMenuData();