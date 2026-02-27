import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// 按照Prisma 7.4.0+官方文档的方式实例化
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始填充数据库...');
  
  // 清空现有数据
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.dishCategory.deleteMany();
  await prisma.station.deleteMany();

  // 创建工位映射
  const stationMap: Record<string, number> = {};
  const stations = [
    { name: '热菜' },
    { name: '打荷' },
    { name: '凉菜' },
    { name: '蒸菜' },
    { name: '点心' },
    { name: '切配' },
  ];

  for (const stationData of stations) {
    const station = await prisma.station.create({
      data: stationData,
    });
    stationMap[stationData.name] = station.id;
  }

  // 创建菜品分类映射
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

  for (const categoryData of categories) {
    const category = await prisma.dishCategory.create({
      data: categoryData,
    });
    categoryMap[categoryData.name] = category.id;
  }

  // 创建菜谱数据
  interface CreatedRecipe {
    id: number;
    name: string;
    createdAt: Date;
    description: string | null;
    ingredientList: string | null;
    images: string[];
    steps: string | null;
    tags: string[];
  }

  const createdRecipes: CreatedRecipe[] = [];

  const recipes = [
    {
      name: '红烧肉',
      description: '传统经典红烧肉，肥而不腻',
      ingredientList:
        '五花肉500g,冰糖30g,生抽50ml,老抽20ml,料酒30ml,葱姜适量',
      images: [],
      steps:
        '1.五花肉切块焯水 2.炒糖色 3.煸炒肉块 4.加调料炖煮 5.收汁装盘',
      tags: ['中菜', '经典', '家常'],
    },
    {
      name: '托炉饼',
      description: '传统炉饼，香脆可口',
      ingredientList: '面粉300g,温水150ml,盐3g,食用油适量,芝麻适量',
      images: [],
      steps:
        '1.面粉和面 2.分割擀饼 3.刷油撒芝麻 4.炉火烘烤 5.出炉切块',
      tags: ['中菜', '传统', '面食'],
    },
    {
      name: '小笼馒头',
      description: '皮薄馅嫩，汤汁丰富',
      ingredientList:
        '面粉200g,猪肉馅150g,皮冻100g,葱姜适量,调料适量',
      images: [],
      steps:
        '1.制作皮冻 2.调制肉馅 3.和面擀皮 4.包制成型 5.蒸制15分钟',
      tags: ['点心', '经典', '汤包'],
    },
    {
      name: '清蒸大黄鱼',
      description: '保持原汁原味，鲜美无比',
      ingredientList: '大黄鱼1条,葱丝适量,姜丝适量,蒸鱼豉油30ml,料酒15ml',
      images: [],
      steps:
        '1.黄鱼处理洗净 2.腌制去腥 3.摆盘加料 4.大火蒸制 5.淋热油调味',
      tags: ['蒸菜', '清淡', '海鲜'],
    },
    {
      name: '时蔬',
      description: '时令蔬菜，清淡爽口',
      ingredientList: '时令青菜300g,蒜蓉10g,盐适量,食用油适量',
      images: [],
      steps: '1.蔬菜清洗 2.蒜蓉爆香 3.下菜翻炒 4.调味出锅',
      tags: ['尾菜', '清淡', '时蔬'],
    },
  ];

  for (const recipeData of recipes) {
    const recipe = await prisma.recipe.create({
      data: recipeData,
    });
    createdRecipes.push(recipe as CreatedRecipe);
  }

  // 创建菜品数据
  interface CreatedDish {
    id: number;
    name: string;
    createdAt: Date;
    recipeId: number | null;
    shortcutCode: string | null;
    stationId: number;
    categoryId: number;
  }

  const createdDishes: CreatedDish[] = [];

  const dishes = [
    // 凉菜类
    {
      name: '三文鱼拼鹅肝',
      stationId: stationMap['凉菜'],
      categoryId: categoryMap['凉菜'],
      shortcutCode: 'SWSPGH',
      recipeId: null,
    },
    {
      name: '美味八碟',
      stationId: stationMap['凉菜'],
      categoryId: categoryMap['凉菜'],
      shortcutCode: 'MWBD',
      recipeId: null,
    },

    // 前菜类
    {
      name: '藜麦元宝虾',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['前菜'],
      shortcutCode: 'LMYYX',
      recipeId: null,
    },
    {
      name: '盐水河虾',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['前菜'],
      shortcutCode: 'YSHX',
      recipeId: null,
    },
    {
      name: '红汤油爆河虾',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['前菜'],
      shortcutCode: 'HTYBHX',
      recipeId: null,
    },
    {
      name: '椒盐基围虾',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['前菜'],
      shortcutCode: 'JYJWX',
      recipeId: null,
    },

    // 中菜类
    {
      name: '藤椒双脆',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['中菜'],
      shortcutCode: 'TZSC',
      recipeId: null,
    },
    {
      name: '红烧肉',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['中菜'],
      shortcutCode: 'HSR',
      recipeId: createdRecipes.find((r) => r.name === '红烧肉')?.id,
    },
    {
      name: '托炉饼',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['中菜'],
      shortcutCode: 'TLB',
      recipeId: createdRecipes.find((r) => r.name === '托炉饼')?.id,
      countable: true,
    },
    {
      name: '椒盐排骨',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['中菜'],
      shortcutCode: 'JYGP',
      recipeId: null,
      countable: true,
    },

    // 点心类
    {
      name: '小笼馒头',
      stationId: stationMap['点心'],
      categoryId: categoryMap['点心'],
      shortcutCode: 'XLMT',
      recipeId: createdRecipes.find((r) => r.name === '小笼馒头')?.id,
      countable: true,
    },
    {
      name: '手工米糕',
      stationId: stationMap['点心'],
      categoryId: categoryMap['点心'],
      shortcutCode: 'SGMG',
      recipeId: null,
      countable: true,
    },

    // 蒸菜类
    {
      name: '清蒸大黄鱼',
      stationId: stationMap['蒸菜'],
      categoryId: categoryMap['蒸菜'],
      shortcutCode: 'QZDHY',
      recipeId: createdRecipes.find((r) => r.name === '清蒸大黄鱼')?.id,
    },
    {
      name: '蒜蓉小鲍鱼',
      stationId: stationMap['蒸菜'],
      categoryId: categoryMap['蒸菜'],
      shortcutCode: 'TRXBY',
      recipeId: null,
      countable: true,
    },

    // 后菜类
    {
      name: '菠萝炒饭',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['后菜'],
      shortcutCode: 'PLCF',
      recipeId: null,
    },

    // 尾菜类
    {
      name: '时蔬',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['尾菜'],
      shortcutCode: 'SS',
      recipeId: createdRecipes.find((r) => r.name === '时蔬')?.id,
    },
    {
      name: '蛋皮汤',
      stationId: stationMap['热菜'],
      categoryId: categoryMap['尾菜'],
      shortcutCode: 'DPT',
      recipeId: null,
    },
  ];

  for (const dishData of dishes) {
    const dish = await prisma.dish.create({
      data: dishData,
    });
    createdDishes.push(dish as CreatedDish);
  }

  // 创建订单数据
  interface CreatedOrder {
    id: number;
    createdAt: Date;
    hallNumber: string;
    peopleCount: number;
    tableCount: number;
    status: string;
    mealTime: Date | null;
    mealType: string | null;
    startTime: Date | null;
    remark: string | null;
    updatedAt: Date;
  }

  const createdOrders: CreatedOrder[] = [];

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
    },
    {
      hallNumber: 'C03',
      peopleCount: 6,
      tableCount: 2,
      status: 'serving',
      mealTime: new Date('2024-12-01T12:30:00'),
      mealType: '午餐',
    },
  ];

  for (const orderData of orders) {
    const order = await prisma.order.create({
      data: orderData,
    });
    createdOrders.push(order as CreatedOrder);
  }

  // 创建订单菜品项
  const orderItems = [
    // 订单1
    {
      orderId: createdOrders[0].id,
      dishId: createdDishes.find((d) => d.name === '红烧肉')!.id,
      quantity: 1,
      status: 'pending',
      priority: 0,
      remark: '微辣',
    },
    {
      orderId: createdOrders[0].id,
      dishId: createdDishes.find((d) => d.name === '托炉饼')!.id,
      quantity: 2,
      status: 'prep',
      priority: 2,
      remark: '少盐',
      countable: true,
    },
    {
      orderId: createdOrders[0].id,
      dishId: createdDishes.find((d) => d.name === '时蔬')!.id,
      quantity: 1,
      status: 'ready',
      priority: 1,
    },

    // 订单2
    {
      orderId: createdOrders[1].id,
      dishId: createdDishes.find((d) => d.name === '藤椒双脆')!.id,
      quantity: 1,
      status: 'pending',
      priority: 3,
      remark: '催菜',
    },
    {
      orderId: createdOrders[1].id,
      dishId: createdDishes.find((d) => d.name === '小笼馒头')!.id,
      quantity: 3,
      status: 'prep',
      priority: 2,
      countable: true,
    },
    {
      orderId: createdOrders[1].id,
      dishId: createdDishes.find((d) => d.name === '清蒸大黄鱼')!.id,
      quantity: 1,
      status: 'ready',
      priority: -1,
    },

    // 订单3
    {
      orderId: createdOrders[2].id,
      dishId: createdDishes.find((d) => d.name === '红烧肉')!.id,
      quantity: 1,
      status: 'served',
      priority: -1,
    },
    {
      orderId: createdOrders[2].id,
      dishId: createdDishes.find((d) => d.name === '椒盐排骨')!.id,
      quantity: 1,
      status: 'pending',
      priority: 1,
      countable: true,
    },
    {
      orderId: createdOrders[2].id,
      dishId: createdDishes.find((d) => d.name === '蛋皮汤')!.id,
      quantity: 1,
      status: 'pending',
      priority: 0,
    },
  ];

  for (const itemData of orderItems) {
    await prisma.orderItem.create({
      data: {
        ...itemData,
        countable:
          itemData.countable ??
          (createdDishes.find((d) => d.id === itemData.dishId)?.name.includes(
            '托炉饼',
          ) ||
            createdDishes.find((d) => d.id === itemData.dishId)?.name.includes(
              '小笼馒头',
            ) ||
            createdDishes.find((d) => d.id === itemData.dishId)?.name.includes(
              '蒜蓉小鲍鱼',
            ) ||
            false),
      },
    });
  }

  console.log('✅ 数据库填充完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });