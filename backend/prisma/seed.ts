import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// 按照Prisma 7.4.0+官方文档的方式实例化
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始填充数据库...');

  // 【重要】移除清空现有数据的操作，防止生产环境数据丢失
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.dish.deleteMany();
  // await prisma.recipe.deleteMany();
  // await prisma.dishCategory.deleteMany();
  // await prisma.station.deleteMany();

  // 创建工位映射（仅创建不存在的）
  const stationMap: Record<string, number> = {};
  const stations = [
    { name: '热菜' },
    { name: '打荷' },
    { name: '凉菜' },
    { name: '蒸菜' },
    { name: '点心' },
    { name: '切配' },
  ];

  console.log('📋 检查并创建工位...');
  for (const stationData of stations) {
    const existing = await prisma.station.findFirst({
      where: { name: stationData.name }
    });
    
    if (existing) {
      stationMap[stationData.name] = existing.id;
      console.log(`  ℹ️  工位 "${stationData.name}" 已存在`);
    } else {
      const station = await prisma.station.create({
        data: stationData,
      });
      stationMap[stationData.name] = station.id;
      console.log(`  ✅ 创建工位 "${stationData.name}"`);
    }
  }

  // 创建菜品分类映射（仅创建不存在的）
  const categoryMap: Record<string, number> = {};
  const categories = [
    { name: '凉菜', description: '开胃凉菜类', displayOrder: 1 },
    { name: '前菜', description: '开胃前菜类', displayOrder: 2 },
    { name: '中菜', description: '主菜类', displayOrder: 3 },
    { name: '点心', description: '精致点心类', displayOrder: 4 },
    { name: '蒸菜', description: '蒸制菜品类', displayOrder: 5 },
    { name: '后菜', description: '配菜类', displayOrder: 6 },
    { name: '尾菜', description: '收尾菜品类', displayOrder: 7 },
  ];

  console.log('\n🏷️  检查并创建菜品分类...');
  for (const categoryData of categories) {
    const existing = await prisma.dishCategory.findFirst({
      where: { name: categoryData.name }
    });
    
    if (existing) {
      categoryMap[categoryData.name] = existing.id;
      console.log(`  ℹ️  分类 "${categoryData.name}" 已存在`);
    } else {
      const category = await prisma.dishCategory.create({
        data: categoryData,
      });
      categoryMap[categoryData.name] = category.id;
      console.log(`  ✅ 创建分类 "${categoryData.name}"`);
    }
  }

  // 根据菜品库创建菜品数据（仅创建不存在的）
  console.log('\n🍽️  根据菜品库创建菜品...');
  
  const dishLibrary = [
    // 凉菜类
    { name: '三文鱼拼鹅肝', category: '凉菜', station: '凉菜', countable: false },
    { name: '美味八碟', category: '凉菜', station: '凉菜', countable: false },
    
    // 前菜类
    { name: '藜麦元宝虾', category: '前菜', station: '热菜', countable: false },
    { name: '盐水河虾', category: '前菜', station: '热菜', countable: false },
    { name: '红汤油爆河虾', category: '前菜', station: '热菜', countable: false },
    { name: '椒盐基围虾', category: '前菜', station: '热菜', countable: false },
    { name: '发财银鱼羹', category: '前菜', station: '热菜', countable: false },
    { name: '海皇鲍翅羹', category: '前菜', station: '热菜', countable: false },
    { name: '牛肉羹', category: '前菜', station: '热菜', countable: false },
    { name: '扎腻头', category: '前菜', station: '热菜', countable: false },
    
    // 中菜类
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
    { name: '托炉饼', category: '中菜', station: '点心', countable: true },
    { name: '松鼠桂鱼', category: '中菜', station: '热菜', countable: false },
    { name: '小炒黄牛肉', category: '中菜', station: '热菜', countable: false },
    { name: '干捞粉丝', category: '中菜', station: '热菜', countable: false },
    { name: '铁板豆腐', category: '中菜', station: '热菜', countable: true },
    { name: '沙拉牛排', category: '中菜', station: '热菜', countable: true },
    
    // 点心类
    { name: '小笼馒头', category: '点心', station: '点心', countable: true },
    { name: '手工米糕', category: '点心', station: '点心', countable: true },
    
    // 蒸菜类
    { name: '红蒸湘鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '蒜蓉小鲍鱼', category: '蒸菜', station: '蒸菜', countable: true },
    { name: '清蒸大黄鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '菌菇整鸡煲', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '乌米饭', category: '蒸菜', station: '蒸菜', countable: true },
    { name: '红蒸长寿鱼', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '蒜蓉小青龙', category: '蒸菜', station: '蒸菜', countable: false },
    { name: '清蒸牛肋骨', category: '蒸菜', station: '蒸菜', countable: false },
    
    // 后菜类
    { name: '菠萝炒饭', category: '后菜', station: '热菜', countable: false },
    { name: '雪菜冬笋', category: '后菜', station: '热菜', countable: false },
    { name: '荷塘月色', category: '后菜', station: '热菜', countable: false },
    { name: '金蒜小葱山药', category: '后菜', station: '热菜', countable: false },
    { name: '雪菜马蹄炒鲜蘑', category: '后菜', station: '热菜', countable: false },
    
    // 尾菜类
    { name: '时蔬', category: '尾菜', station: '热菜', countable: false },
    { name: '蛋皮汤', category: '尾菜', station: '热菜', countable: false }
  ];

  let createdDishes = 0;
  let skippedDishes = 0;

  for (const dishData of dishLibrary) {
    const existing = await prisma.dish.findFirst({
      where: { name: dishData.name }
    });
    
    if (existing) {
      console.log(`  ℹ️  菜品 "${dishData.name}" 已存在`);
      skippedDishes++;
      continue;
    }
    
    try {
      await prisma.dish.create({
        data: {
          name: dishData.name,
          categoryId: categoryMap[dishData.category],
          stationId: stationMap[dishData.station],
          countable: dishData.countable,
          isActive: true
        }
      });
      console.log(`  ✅ 创建菜品 "${dishData.name}" (${dishData.category} -> ${dishData.station}) ${dishData.countable ? '[计数]' : ''}`);
      createdDishes++;
    } catch (error) {
      console.log(`  ❌ 创建菜品 "${dishData.name}" 失败:`, (error as Error).message);
      skippedDishes++;
    }
  }

  // 创建一些示例订单数据（仅当不存在时）
  console.log('\n📝 创建示例订单数据...');
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const orders = [
      {
        hallNumber: 'A01',
        peopleCount: 4,
        tableCount: 1,
        status: 'created',
        mealTime: new Date('2024-12-01T12:00:00'),
        mealType: '午餐',
      },
      {
        hallNumber: 'B02',
        peopleCount: 2,
        tableCount: 1,
        status: 'started',
        mealTime: new Date('2024-12-01T18:00:00'),
        mealType: '晚餐',
      }
    ];

    for (const orderData of orders) {
      await prisma.order.create({ data: orderData });
    }
    console.log(`  ✅ 创建了 ${orders.length} 个示例订单`);
  } else {
    console.log(`  ℹ️  已存在 ${existingOrders} 个订单，跳过创建`);
  }

  // 显示最终统计
  const finalStats = {
    stations: await prisma.station.count(),
    categories: await prisma.dishCategory.count(),
    dishes: await prisma.dish.count(),
    orders: await prisma.order.count()
  };

  console.log('\n📊 最终数据统计:');
  console.log(`  工位: ${finalStats.stations} 个`);
  console.log(`  分类: ${finalStats.categories} 个`);
  console.log(`  菜品: ${finalStats.dishes} 个`);
  console.log(`  订单: ${finalStats.orders} 个`);
  console.log(`  本次新增菜品: ${createdDishes} 个`);
  console.log(`  已存在跳过: ${skippedDishes} 个`);

  console.log('\n🎉 数据库填充完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
