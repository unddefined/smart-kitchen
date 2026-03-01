import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// 按照Prisma 7.4.0+规范配置PrismaClient
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function fillDishesFromMenu() {
  console.log('🌱 开始根据菜品库填充数据库...');
  
  try {
    // 检查现有数据
    const existingDishCount = await prisma.dish.count();
    console.log(`当前菜品数量: ${existingDishCount}`);

    // 如果已有数据，询问是否继续
    if (existingDishCount > 0) {
      console.log('⚠️  数据库中已存在菜品数据');
      // 这里可以根据需要添加确认逻辑
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
    
    // 菜品库数据 - 根据菜品库.md整理（不含countable字段）
    const menuItems = [
      // 凉菜类
      { name: '三文鱼拼鹅肝', category: '凉菜', station: '凉菜', shortcutCode: 'SWSPGH' },
      { name: '美味八碟', category: '凉菜', station: '凉菜', shortcutCode: 'MWBD' },
      
      // 前菜类
      { name: '藜麦元宝虾', category: '前菜', station: '热菜', shortcutCode: 'LMYYX' },
      { name: '盐水河虾', category: '前菜', station: '热菜', shortcutCode: 'YSHX' },
      { name: '红汤油爆河虾', category: '前菜', station: '热菜', shortcutCode: 'HTYBHX' },
      { name: '椒盐基围虾', category: '前菜', station: '热菜', shortcutCode: 'JYJWX' },
      { name: '发财银鱼羹', category: '前菜', station: '热菜', shortcutCode: 'FCYWG' },
      { name: '海皇鲍翅羹', category: '前菜', station: '热菜', shortcutCode: 'HHBCG' },
      { name: '牛肉羹', category: '前菜', station: '热菜', shortcutCode: 'NRG' },
      { name: '扎腻头', category: '前菜', station: '热菜', shortcutCode: 'ZNT' },
      
      // 中菜类
      { name: '藤椒双脆', category: '中菜', station: '热菜', shortcutCode: 'TZSC' },
      { name: '红烧肉', category: '中菜', station: '热菜', shortcutCode: 'HSR' },
      { name: '板栗烧鳝筒', category: '中菜', station: '热菜', shortcutCode: 'BLSST' },
      { name: '黑椒菌香牛肉粒', category: '中菜', station: '热菜', shortcutCode: 'HJJXNRL' },
      { name: '香菜腰花', category: '中菜', station: '热菜', shortcutCode: 'XCYH' },
      { name: '野菜山药虾仁', category: '中菜', station: '热菜', shortcutCode: 'YCSYXR' },
      { name: '佛跳墙', category: '中菜', station: '热菜', shortcutCode: 'FTQ' },
      { name: '葱烧玛卡菌海参蹄筋', category: '中菜', station: '热菜', shortcutCode: 'CSMKJHSTJ' },
      { name: '红烧河鱼', category: '中菜', station: '热菜', shortcutCode: 'HSHY' },
      { name: '椒盐猪手', category: '中菜', station: '热菜', shortcutCode: 'JYZS' },
      { name: '葱姜炒珍宝蟹', category: '中菜', station: '热菜', shortcutCode: 'CJCZBX' },
      { name: '清炒虾仁', category: '中菜', station: '热菜', shortcutCode: 'QCXR' },
      { name: '茶树菇炭烧肉', category: '中菜', station: '热菜', shortcutCode: 'CSGTSR' },
      { name: '黑椒牛仔骨', category: '中菜', station: '热菜', shortcutCode: 'HJNZG' },
      { name: '椒盐排骨', category: '中菜', station: '热菜', shortcutCode: 'JYGP' },
      { name: '红烧鳗鱼板栗', category: '中菜', station: '热菜', shortcutCode: 'HSEYBL' },
      { name: '黎山汁虾球', category: '中菜', station: '热菜', shortcutCode: 'LSZXQ' },
      { name: '托炉饼', category: '中菜', station: '热菜', shortcutCode: 'TLB' },
      { name: '松鼠桂鱼', category: '中菜', station: '热菜', shortcutCode: 'SSGY' },
      { name: '小炒黄牛肉', category: '中菜', station: '热菜', shortcutCode: 'XCHNR' },
      { name: '干捞粉丝', category: '中菜', station: '热菜', shortcutCode: 'GLFS' },
      { name: '铁板豆腐', category: '中菜', station: '热菜', shortcutCode: 'TBDF' },
      { name: '沙拉牛排', category: '中菜', station: '热菜', shortcutCode: 'SLNP' },
      
      // 点心类
      { name: '小笼馒头', category: '点心', station: '点心', shortcutCode: 'XLMT' },
      { name: '手工米糕', category: '点心', station: '点心', shortcutCode: 'SGMG' },
      
      // 蒸菜类
      { name: '红蒸湘鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'HZXY' },
      { name: '蒜蓉小鲍鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'TRXBY' },
      { name: '清蒸大黄鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'QZDHY' },
      { name: '菌菇整鸡煲', category: '蒸菜', station: '蒸菜', shortcutCode: 'JGZJB' },
      { name: '乌米饭', category: '蒸菜', station: '蒸菜', shortcutCode: 'WFM' },
      { name: '红蒸长寿鱼', category: '蒸菜', station: '蒸菜', shortcutCode: 'HZCSY' },
      { name: '蒜蓉小青龙', category: '蒸菜', station: '蒸菜', shortcutCode: 'TRXQL' },
      { name: '清蒸牛肋骨', category: '蒸菜', station: '蒸菜', shortcutCode: 'QZNLG' },
      
      // 后菜类
      { name: '菠萝炒饭', category: '后菜', station: '热菜', shortcutCode: 'PLCF' },
      { name: '雪菜冬笋', category: '后菜', station: '热菜', shortcutCode: 'XCD' },
      { name: '荷塘月色', category: '后菜', station: '热菜', shortcutCode: 'HTYS' },
      { name: '金蒜小葱山药', category: '后菜', station: '热菜', shortcutCode: 'JSXCYS' },
      { name: '雪菜马蹄炒鲜蘑', category: '后菜', station: '热菜', shortcutCode: 'XCMTXCM' },
      
      // 尾菜类
      { name: '时蔬', category: '尾菜', station: '热菜', shortcutCode: 'SS' },
      { name: '蛋皮汤', category: '尾菜', station: '热菜', shortcutCode: 'DPT' }
    ];
    
    // 需要计数的菜品列表
    const countableDishes = [
      '椒盐排骨',
      '托炉饼', 
      '铁板豆腐',
      '沙拉牛排',
      '小笼馒头',
      '手工米糕',
      '蒜蓉小鲍鱼',
      '乌米饭'
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
            shortcutCode: item.shortcutCode
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
    
    // 显示需要计数的菜品
    console.log('\n🔢 需要计数的菜品:');
    for (const dishName of countableDishes) {
      const dish = await prisma.dish.findUnique({
        where: { name: dishName }
      });
      if (dish) {
        console.log(`• ${dishName} (${dish.id})`);
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