#!/usr/bin/env node

/**
 * 根据菜品库.md更新数据库菜品信息
 * 包括新增菜品、更新现有菜品属性（计数、预处理状态）
 */

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// 菜品库数据结构
const DISH_LIBRARY = {
  '凉菜': [
    '三文鱼拼鹅肝',
    '美味八碟'
  ],
  '前菜': [
    '藜麦元宝虾',
    '盐水河虾',
    '红汤油爆河虾',
    '椒盐基围虾',
    '发财银鱼羹',
    '海皇鲍翅羹',
    '牛肉羹',
    '扎腻头'
  ],
  '中菜': [
    '藤椒双脆',
    '红烧肉（需要预处理）',
    '板栗烧鳝筒',
    '黑椒菌香牛肉粒',
    '香菜腰花',
    '野菜山药虾仁',
    '佛跳墙',
    '葱烧玛卡菌海参蹄筋',
    '红烧河鱼',
    '椒盐猪手（需要预处理）',
    '葱姜炒珍宝蟹（需要预处理）',
    '清炒虾仁',
    '茶树菇炭烧肉',
    '黑椒牛仔骨',
    '椒盐排骨（计数）（需要预处理）',
    '蒜香排骨（计数）（需要预处理）',
    '红烧鳗鱼板栗',
    '黎山汁虾球（需要预处理）',
    '托炉饼（计数）',
    '松鼠桂鱼（需要预处理）',
    '小炒黄牛肉',
    '干捞粉丝',
    '铁板豆腐（计数）',
    '沙拉牛排（计数）（需要预处理）'
  ],
  '点心': [
    '小笼馒头（计数）',
    '手工米糕（计数）'
  ],
  '蒸菜': [
    '红蒸湘鱼',
    '蒜蓉小鲍鱼（计数）',
    '清蒸大黄鱼',
    '菌菇整鸡煲',
    '乌米饭（计数）',
    '红蒸长寿鱼',
    '蒜蓉小青龙',
    '清蒸牛肋骨'
  ],
  '后菜': [
    '菠萝炒饭（需要预处理）',
    '雪菜冬笋',
    '荷塘月色',
    '金蒜小葱山药',
    '雪菜马蹄炒鲜蘑'
  ],
  '尾菜': [
    '时蔬',
    '蛋皮汤'
  ]
};

async function updateDishesFromLibrary() {
  console.log('🚀 开始根据菜品库更新数据库...\n');
  
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 获取现有的分类和岗位映射
    const categories = await prisma.dishCategory.findMany();
    const stations = await prisma.station.findMany();
    
    console.log(`📋 现有分类: ${categories.map(c => c.name).join(', ')}`);
    console.log(`📋 现有岗位: ${stations.map(s => s.name).join(', ')}\n`);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // 处理每个分类的菜品
    for (const [categoryName, dishNames] of Object.entries(DISH_LIBRARY)) {
      console.log(`🍽️  处理 ${categoryName} 类别...`);
      
      // 查找对应的分类ID
      const category = categories.find(c => c.name === categoryName);
      if (!category) {
        console.log(`  ⚠️  分类 "${categoryName}" 不存在，跳过`);
        continue;
      }

      for (const dishEntry of dishNames) {
        // 解析菜品名称和属性
        const { name, isCountable, needsPrep } = parseDishEntry(dishEntry);
        
        // 确定岗位（根据分类）
        const stationName = getStationByCategory(categoryName);
        const station = stations.find(s => s.name === stationName);
        
        if (!station) {
          console.log(`  ⚠️  岗位 "${stationName}" 不存在，跳过 "${name}"`);
          skippedCount++;
          continue;
        }

        // 检查菜品是否已存在
        const existingDish = await prisma.dish.findFirst({
          where: { name: name }
        });

        if (existingDish) {
          // 更新现有菜品属性
          const updateData = {
            categoryId: category.id,
            stationId: station.id
          };

          // 只有当属性不同才更新
          let needsUpdate = false;
          if (existingDish.categoryId !== category.id) {
            updateData.categoryId = category.id;
            needsUpdate = true;
          }
          if (existingDish.stationId !== station.id) {
            updateData.stationId = station.id;
            needsUpdate = true;
          }
          if (existingDish.countable !== isCountable) {
            updateData.countable = isCountable;
            needsUpdate = true;
          }
          if (existingDish.needPrep !== needsPrep) {
            updateData.needPrep = needsPrep;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await prisma.dish.update({
              where: { id: existingDish.id },
              data: updateData
            });
            console.log(`  ✅ 更新 "${name}" - 计数:${isCountable} 预处理:${needsPrep}`);
            updatedCount++;
          } else {
            console.log(`  ℹ️  "${name}" 已存在且属性一致，跳过`);
            skippedCount++;
          }
        } else {
          // 创建新菜品
          await prisma.dish.create({
            data: {
              name: name,
              categoryId: category.id,
              stationId: station.id,
              countable: isCountable,
              needPrep: needsPrep,
              isActive: true
            }
          });
          console.log(`  ➕ 新增 "${name}" - 计数:${isCountable} 预处理:${needsPrep}`);
          addedCount++;
        }
      }
      console.log('');
    }

    console.log('🎉 更新完成!');
    console.log(`📊 统计结果:`);
    console.log(`  新增菜品: ${addedCount} 个`);
    console.log(`  更新菜品: ${updatedCount} 个`);
    console.log(`  跳过菜品: ${skippedCount} 个`);

    // 验证最终结果
    await verifyUpdateResults(prisma);

  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 解析菜品条目，提取名称和属性
function parseDishEntry(entry) {
  const name = entry.replace(/（[^）]*）/g, '').trim();
  const isCountable = entry.includes('（计数）');
  const needsPrep = entry.includes('（需要预处理）');
  
  return { name, isCountable, needsPrep };
}

// 根据分类确定岗位
function getStationByCategory(categoryName) {
  const stationMapping = {
    '凉菜': '凉菜',
    '前菜': '热菜',
    '中菜': '热菜',
    '点心': '点心',
    '蒸菜': '蒸菜',
    '后菜': '热菜',
    '尾菜': '热菜'
  };
  return stationMapping[categoryName] || '热菜';
}

// 验证更新结果
async function verifyUpdateResults(prisma) {
  console.log('\n🔍 验证更新结果...');
  
  const totalDishes = await prisma.dish.count();
  const countableDishes = await prisma.dish.count({ where: { countable: true } });
  const prepRequiredDishes = await prisma.dish.count({ where: { needPrep: true } });
  
  console.log(`  总菜品数: ${totalDishes}`);
  console.log(`  可计数菜品: ${countableDishes}`);
  console.log(`  需预处理菜品: ${prepRequiredDishes}`);
  
  // 检查是否有重复菜品名
  const duplicateNames = await prisma.$queryRaw`
    SELECT name, COUNT(*) as count
    FROM dishes
    GROUP BY name
    HAVING COUNT(*) > 1
  `;
  
  if (duplicateNames.length > 0) {
    console.log('⚠️  发现重复菜品名:');
    duplicateNames.forEach(row => {
      console.log(`  ${row.name}: ${row.count} 个`);
    });
  } else {
    console.log('✅ 无重复菜品名');
  }
}

// 执行更新
if (require.main === module) {
  updateDishesFromLibrary();
}

module.exports = { updateDishesFromLibrary, DISH_LIBRARY };