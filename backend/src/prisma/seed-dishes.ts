/**
 * 菜品数据种子脚本
 * 使用 Prisma ORM 向数据库填充菜品数据
 *
 * 数据来源：docs/菜品库.md
 *
 * 使用方法:
 * npx ts-node src/prisma/seed-dishes.ts
 *
 * 或者配置 package.json scripts:
 * "seed:dishes": "npx ts-node src/prisma/seed-dishes.ts"
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { pinyin } from 'pinyin-pro';
import 'dotenv/config';

// 创建 Prisma 客户端实例
function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://smart_kitchen_user:password@localhost:5432/smart_kitchen_prod';
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: ['info', 'warn', 'error'],
  });
}

// 菜品数据定义 (来自 docs/菜品库.md)
interface DishData {
  name: string;
  station: string;
  countable?: boolean;
  needPrep?: boolean;
}

const dishData: Record<string, DishData[]> = {
  凉菜: [
    { name: '三文鱼拼鹅肝', station: '凉菜' },
    { name: '美味八碟', station: '凉菜' },
  ],
  前菜: [
    { name: '藜麦元宝虾', station: '热菜' },
    { name: '盐水河虾', station: '热菜' },
    { name: '红汤油爆河虾', station: '热菜' },
    { name: '椒盐基围虾', station: '热菜' },
    { name: '发财银鱼羹', station: '热菜' },
    { name: '海皇鲍翅羹', station: '热菜' },
    { name: '牛肉羹', station: '热菜' },
    { name: '扎腻头', station: '热菜' },
  ],
  中菜: [
    { name: '藤椒双脆', station: '热菜' },
    { name: '红烧肉', station: '热菜', needPrep: true },
    { name: '板栗烧鳝筒', station: '热菜' },
    { name: '黑椒菌香牛肉粒', station: '热菜' },
    { name: '香菜腰花', station: '热菜' },
    { name: '野菜山药虾仁', station: '热菜' },
    { name: '佛跳墙', station: '热菜' },
    { name: '葱烧玛卡菌海参蹄筋', station: '热菜' },
    { name: '红烧河鱼', station: '热菜' },
    { name: '椒盐猪手', station: '热菜', needPrep: true },
    { name: '葱姜炒珍宝蟹', station: '热菜', needPrep: true },
    { name: '清炒虾仁', station: '热菜' },
    { name: '茶树菇炭烧肉', station: '热菜' },
    { name: '黑椒牛仔骨', station: '热菜' },
    { name: '椒盐排骨', station: '热菜', countable: true, needPrep: true },
    { name: '蒜香排骨', station: '热菜', countable: true, needPrep: true },
    { name: '红烧鳗鱼板栗', station: '热菜' },
    { name: '黎山汁虾球', station: '热菜', needPrep: true },
    { name: '托炉饼', station: '热菜', countable: true },
    { name: '松鼠桂鱼', station: '热菜', needPrep: true },
    { name: '小炒黄牛肉', station: '热菜' },
    { name: '干捞粉丝', station: '热菜' },
    { name: '铁板豆腐', station: '热菜', countable: true },
    { name: '沙拉牛排', station: '热菜', countable: true, needPrep: true },
  ],
  点心: [
    { name: '小笼馒头', station: '点心', countable: true },
    { name: '手工米糕', station: '点心', countable: true },
  ],
  蒸菜: [
    { name: '红蒸湘鱼', station: '蒸煮' },
    { name: '蒜蓉小鲍鱼', station: '蒸煮', countable: true },
    { name: '清蒸大黄鱼', station: '蒸煮' },
    { name: '菌菇整鸡煲', station: '蒸煮' },
    { name: '乌米饭', station: '蒸煮', countable: true },
    { name: '红蒸长寿鱼', station: '蒸煮' },
    { name: '蒜蓉小青龙', station: '蒸煮' },
    { name: '清蒸牛肋骨', station: '蒸煮' },
  ],
  后菜: [
    { name: '菠萝炒饭', station: '热菜', needPrep: true },
    { name: '雪菜冬笋', station: '热菜' },
    { name: '荷塘月色', station: '热菜' },
    { name: '金蒜小葱山药', station: '热菜' },
    { name: '雪菜马蹄炒鲜蘑', station: '热菜' },
  ],
  尾菜: [
    { name: '时蔬', station: '热菜' },
    { name: '蛋皮汤', station: '热菜' },
  ],
};

/**
 * 生成快捷码
 * 规则：取菜品名称的拼音首字母（去除空格），转为大写
 * - 对于中文菜名：转换为拼音首字母，如 "托炉饼" -> "TLB"
 * - 对于非中文字符：保留原字符
 */
function generateShortcutCode(dishName: string): string {
  try {
    // 使用 pinyin-pro 将中文转换为拼音首字母
  const result = pinyin(dishName, {
      pattern: 'first',
      type: 'array',
    });
    
    // 将数组连接成字符串并转大写，移除声调符号和非字母字符
    return result.join('').toUpperCase().replace(/[^A-Z]/g, '');
  } catch (error) {
    // 如果转换失败，回退到原始方法（取前 4 个字符）
  console.warn(`⚠️  拼音转换失败 "${dishName}", 使用默认方法`);
    return dishName.replace(/\s/g, '').substring(0, 4).toUpperCase();
  }
}

async function seedDishes() {
  const prisma = createPrismaClient();

  try {
    console.log('🌱 开始初始化菜品数据...\n');

    // 1. 确保工位存在
    console.log('📍 检查并创建工位...');
    const stations = ['热菜', '打荷', '凉菜', '蒸煮', '点心', '切配'];

    for (const stationName of stations) {
      await prisma.station.upsert({
        where: { name: stationName },
        update: {},
        create: { name: stationName },
      });
    }
    console.log(`✅ 已确保 ${stations.length} 个工位存在\n`);

    // 2. 确保菜品分类存在
    console.log('📂 检查并创建菜品分类...');
    const categories = [
      { name: '凉菜', displayOrder: 1 },
      { name: '前菜', displayOrder: 2 },
      { name: '中菜', displayOrder: 3 },
      { name: '点心', displayOrder: 4 },
      { name: '蒸菜', displayOrder: 5 },
      { name: '后菜', displayOrder: 6 },
      { name: '尾菜', displayOrder: 7 },
    ];

    for (const category of categories) {
      await prisma.dishCategory.upsert({
        where: { name: category.name },
        update: {},
        create: {
          name: category.name,
          displayOrder: category.displayOrder,
        },
      });
    }
    console.log(`✅ 已确保 ${categories.length} 个菜品分类存在\n`);

    // 3. 插入菜品数据
    console.log('🍽️  开始插入菜品数据...');
    let totalCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const [categoryName, dishes] of Object.entries(dishData)) {
      console.log(
        `\n   📋 处理分类：${categoryName} (${dishes.length} 个菜品)`,
      );

      const category = await prisma.dishCategory.findUnique({
        where: { name: categoryName },
      });

      if (!category) {
        console.error(`   ❌ 分类不存在：${categoryName}`);
        continue;
      }

      for (const dish of dishes) {
        totalCount++;

        // 获取工位
        const station = await prisma.station.findUnique({
          where: { name: dish.station },
        });

        if (!station) {
          console.error(
            `   ⚠️  工位不存在：${dish.station},跳过菜品:${dish.name}`,
          );
          skippedCount++;
          continue;
        }

        try {
          // 生成快捷码 (拼音首字母)
         const shortcutCode = generateShortcutCode(dish.name);

          // 使用 upsert 确保幂等性
          await prisma.dish.upsert({
            where: { name: dish.name },
            update: {},
            create: {
             name: dish.name,
             stationId: station.id,
              categoryId: category.id,
             shortcutCode,
              countable: dish.countable || false,
              needPrep: dish.needPrep || false,
              isActive: true,
            },
          });

          createdCount++;

          // 显示标记信息
          const markers = [];
          if (dish.countable) markers.push('[计数]');
          if (dish.needPrep) markers.push('[预处理]');
          const markerStr = markers.length > 0 ? ` ${markers.join(' ')}` : '';
          console.log(`      ✅ ${dish.name}${markerStr}`);
        } catch (error: any) {
          if (error.code === 'P2002') {
            // 唯一约束冲突 - 已存在
            console.log(`      ⏭️  已存在：${dish.name}`);
            skippedCount++;
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ 菜品数据插入完成！');
    console.log(
      `📊 统计：总计 ${totalCount} 个，新增 ${createdCount} 个，跳过 ${skippedCount} 个\n`,
    );

    // 4. 验证数据
    console.log('🔍 验证数据...');

    // 获取所有分类及其菜品数量
    const categoriesWithCount = await prisma.dishCategory.findMany({
      include: {
        _count: {
          select: { dishes: true },
        },
        dishes: {
          select: {
            countable: true,
            needPrep: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    console.log('\n📋 分类统计:');
    for (const category of categoriesWithCount) {
      const countableCount = category.dishes.filter((d) => d.countable).length;
      const needPrepCount = category.dishes.filter((d) => d.needPrep).length;
      console.log(
        `   ${category.name}: ${category._count.dishes} 个菜品 (计数：${countableCount}, 预处理：${needPrepCount})`,
      );
    }

    // 5. 特殊菜品统计
    const countableDishes = await prisma.dish.findMany({
      where: { countable: true },
      select: { name: true, category: true },
      orderBy: { category: { displayOrder: 'asc' } },
    });

    console.log('\n📋 需要计数的菜品:');
    countableDishes.forEach((dish) => {
      console.log(`   - ${dish.name} (${dish.category.name})`);
    });

    const needPrepDishes = await prisma.dish.findMany({
      where: { needPrep: true },
      select: { name: true, category: true },
      orderBy: { category: { displayOrder: 'asc' } },
    });

    console.log('\n📋 需要预处理的菜品:');
    needPrepDishes.forEach((dish) => {
      console.log(`   - ${dish.name} (${dish.category.name})`);
    });

    console.log('\n✅ 所有操作完成！\n');
  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子脚本
seedDishes().catch(console.error);
