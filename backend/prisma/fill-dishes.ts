import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fillDishesFromMenu() {
  console.log('🌱 开始根据菜品库填充数据库...');
  
  try {
    // 检查现有数据
    const existingDishCount = await prisma.dish.count();
    console.log(`当前菜品数量: ${existingDishCount}`);
    
    // 如果已经有数据，询问是否要追加还是清空重建
    if (existingDishCount > 0) {
      console.log('数据库中已有菜品数据，将追加新菜品...');
    }
    
    // 获取现有的分类和工位映射
    const categories = await prisma.dishCategory.findMany();
    const stations = await prisma.station.findMany();
    
    const categoryMap: Record<string, number> = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    const stationMap: Record<string, number> = {};
    stations.forEach(station => {
      stationMap[station.name] = station.id;
    });
    
    console.log('现有分类:', Object.keys(categoryMap));
    console.log('现有工位:', Object.keys(stationMap));
    
    // 菜品库数据 - 根据菜品库.md整理
    const menuItems = [
      // 凉菜类
      { name: '三文鱼拼鹅肝', category: '凉菜', station: '凉菜', shortcutCode: 'SWSPGH', countable: false },
      { name: '美味八碟', category: '凉菜', station: '凉菜', shortcutCode: 'MWBD', countable: false },
      
      // 前菜类
      { name: '藜麦元宝虾', category: '前菜', station: '热菜', shortcutCode: 'LMYYX', countable: false },
      { name: '盐水河虾', category: '前菜', station: '热菜', shortcutCode: 'YSHX', countable: false },
      { name: '红汤油爆河虾', category: '前菜', station: '热菜', shortcutCode: 'HTYBHX', countable: false },
      { name: '椒盐基围虾', category: '前菜', station: '热菜', shortcutCode: 'JYJWX', countable: false },
      { name: '发财银鱼羹', category: '前菜', station: '热菜', shortcutCode: 'FCYWG', countable: false },
      { name: '海皇鲍翅羹', category: '前菜', station: '热菜', shortcutCode: 'HHBCG', countable: false },
      { name: '牛肉羹', category: '前菜', station: '热菜', shortcutCode: 'NRG', countable: false },
      { name: '扎腻头', category: '前菜', station: '热菜', shortcutCode: 'ZNT', countable: false },
      
      // 中菜类
      { name: '藤椒双脆', category: '中菜', station: '热菜', shortcutCode: 'TZSC', countable: false },
      { name: '红烧肉', category: '中菜', station: '热菜', shortcutCode: 'HSR', countable: false },
      { name: '板栗烧鳝筒', category: '中菜', station: '热菜', shortcutCode: 'BLSST', countable: false },
      { name: '黑椒菌香牛肉粒', category: '中菜', station: '热菜', shortcutCode: 'HJJXNRL', countable: false },
      { name: '香菜腰花', category: '中菜', station: '热菜', shortcutCode: 'XCYH', countable: false },
      { name: '野菜山药虾仁', category: '中菜', station: '热菜', shortcutCode: 'YCSYXR', countable: false },
      { name: '佛跳墙', category: '中菜', station: '热菜', shortcutCode: 'FTQ', countable: false },
      { name: '葱烧玛卡菌海参蹄筋', category: '中菜', station: '热菜', shortcutCode: 'CSMKJHSTJ', countable: false },
      { name: '红烧河鱼', category: '中菜', station: '热菜', shortcutCode: 'HSHY', countable: false },
      { name: '椒盐猪手', category: '中菜', station: '热菜', shortcutCode: 'JYZS', countable: false },
      { name: '葱姜炒珍宝蟹', category: '中菜', station: '热菜', shortcutCode: 'CJCZBX', countable: false },
      { name: '清炒虾仁', category: '中菜', station: '热菜', shortcutCode: 'QCXR', countable: false },
      { name: '茶树菇炭烧肉', category: '中菜', station: '热菜', shortcutCode: 'CSGTSR', countable: false },
      { name: '黑椒牛仔骨', category: '中菜', station: '热菜', shortcutCode: 'HJNZG', countable: false },
      { name: '椒盐排骨', category: '中菜', station: '热菜', shortcutCode: 'JYGP', countable: true }, // 计数
      { name: '红烧鳗鱼板栗', category: '中菜', station: '热菜', shortcutCode: 'HSEYBL', countable: false },
      { name: '黎山汁虾球', category: '中菜', station: '热菜', shortcutCode: 'LSZXQ', countable: false },
      { name: '托炉饼', category: '中菜', station: '热菜', shortcutCode: 'TLB', countable: true }, // 计数
      { name: '松鼠桂鱼', category: '中菜', station: '热菜', shortcutCode: 'SSGY', countable: false },
      { name: '小炒黄牛肉', category: '中菜', station: '热菜', shortcutCode: 'XCHNR', countable: false },
      { name: '干捞粉丝', category: '中菜', station: '热菜', shortcutCode: 'GLFS', countable: false },
      { name: '铁板豆腐', category: '中菜', station: '热菜', shortcutCode: 'TBDF', countable: true }, // 计数
      { name: '沙拉牛排', category: '中菜', station: '热菜', shortcutCode: 'SLNP', countable: true }, // 计数
      
      // 点心类
      { name: '小笼馒头', category: '点心', station: '点心', shortcutCode: 'XLMT', countable: true }, // 计数
      { name: '手工米糕', category: '点心', station: '点心', shortcutCode: 'SGMG', countable: true }, // 计数
      
      // 蒸菜类
      { name: '红蒸湘鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'HZXY', countable: false },
      { name: '蒜蓉小鲍鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'TRXBY', countable: true }, // 计数
      { name: '清蒸大黄鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'QZDHY', countable: false },
      { name: '菌菇整鸡煲', category: '蒸菜', station: '蒸菜', shortcutCode: 'JGZJB', countable: false },
      { name: '乌米饭', category: '蒸菜', station: '蒸菜', shortcutCode: 'WFM', countable: true }, // 计数
      { name: '红蒸长寿鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'HZCSY', countable: false },
      { name: '蒜蓉小青龙', category: '蒸菜', station: '蒸菜', shortcutCode: 'TRXQL', countable: false },
      { name: '清蒸牛肋骨', category: '蒸菜', station: '蒸菜', shortcutCode: 'QZNLG', countable: false },
      
      // 后菜类
      { name: '菠萝炒饭', category: '后菜', station: '热菜', shortcutCode: 'PLCF', countable: false },
      { name: '雪菜冬笋', category: '后菜', station: '热菜', shortcutCode: 'XCD', countable: false },
      { name: '荷塘月色', category: '后菜', station: '热菜', shortcutCode: 'HTYS', countable: false },
      { name: '金蒜小葱山药', category: '后菜', station: '热菜', shortcutCode: 'JSXCYS', countable: false },
      { name: '雪菜马蹄炒鲜蘑', category: '后菜', station: '热菜', shortcutCode: 'XCMTXCM', countable: false },
      
      // 尾菜类
      { name: '时蔬', category: '尾菜', station: '热菜', shortcutCode: 'SS', countable: false },
      { name: '蛋皮汤', category: '尾菜', station: '热菜', shortcutCode: 'DPT', countable: false }
    ];
    
    console.log(`准备添加 ${menuItems.length} 个菜品...`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const item of menuItems) {
      // 检查菜品是否已存在
      const existingDish = await prisma.dish.findUnique({
        where: { name: item.name }
      });
      
      if (existingDish) {
        console.log(`⚠️  菜品 "${item.name}" 已存在，跳过`);
        skippedCount++;
        continue;
      }
      
      // 验证分类和工位是否存在
      if (!categoryMap[item.category]) {
        console.log(`❌ 分类 "${item.category}" 不存在，跳过菜品 "${item.name}"`);
        skippedCount++;
        continue;
      }
      
      if (!stationMap[item.station]) {
        console.log(`❌ 工位 "${item.station}" 不存在，跳过菜品 "${item.name}"`);
        skippedCount++;
        continue;
      }
      
      try {
        await prisma.dish.create({
          data: {
            name: item.name,
            categoryId: categoryMap[item.category],
            stationId: stationMap[item.station],
            shortcutCode: item.shortcutCode,
            countable: item.countable
          }
        });
        console.log(`✅ 添加菜品: ${item.name} (${item.category}, ${item.station})`);
        addedCount++;
      } catch (error) {
        console.log(`❌ 添加菜品 "${item.name}" 失败:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n📊 填充结果:');
    console.log(`✅ 成功添加: ${addedCount} 个菜品`);
    console.log(`⚠️  跳过: ${skippedCount} 个菜品`);
    
    // 显示最终统计
    const finalCount = await prisma.dish.count();
    console.log(`📦 数据库中总菜品数: ${finalCount}`);
    
    // 按分类统计
    const categoryStats = await prisma.dish.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: {
        categoryId: 'asc'
      }
    });
    
    console.log('\n📋 各分类菜品数量:');
    for (const stat of categoryStats) {
      const category = categories.find(c => c.id === stat.categoryId);
      if (category) {
        console.log(`${category.name}: ${stat._count} 个`);
      }
    }
    
  } catch (error) {
    console.error('❌ 填充过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillDishesFromMenu()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });