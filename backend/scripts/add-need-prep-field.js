#!/usr/bin/env node

/**
 * 添加 need_prep 字段到菜品表的迁移脚本
 * 用于支持菜品预处理状态管理
 */

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function addNeedPrepField() {
  console.log('🚀 开始添加 need_prep 字段到菜品表...');
  
  let prisma; // 在函数作用域声明prisma变量
  
  try {
    // 按照 Prisma 7.4.0+ 规范配置数据库连接
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });

    // 检查字段是否已存在
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' AND column_name = 'need_prep'
    `;

    if (existingColumns.length > 0) {
      console.log('✅ need_prep 字段已存在，跳过添加');
    } else {
      // 添加字段
      console.log('📝 正在添加 need_prep 字段...');
      await prisma.$executeRaw`
        ALTER TABLE dishes 
        ADD COLUMN need_prep BOOLEAN DEFAULT FALSE
      `;

      // 添加注释
      console.log('📝 正在添加字段注释...');
      await prisma.$executeRaw`
        COMMENT ON COLUMN dishes.need_prep IS '是否需要预处理（如裹粉、蒸、预炸），如否则跳过status.prep'
      `;

      // 验证字段添加结果
      const verification = await prisma.$queryRaw`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'dishes' AND column_name = 'need_prep'
      `;

      console.log('✅ 字段添加成功!');
      console.log('📋 字段信息:', verification[0]);
    }

    // 更新一些示例菜品的 need_prep 值（可选）
    console.log('📝 更新部分菜品的预处理需求...');
    
    // 需要预处理的菜品示例（可根据实际情况调整）
    const prepRequiredDishes = [
      '托炉饼',    // 需要预炸
      '红烧肉',    // 需要预处理
      '椒盐排骨',  // 需要裹粉预炸
      '小笼馒头',  // 需要蒸制
    ];

    for (const dishName of prepRequiredDishes) {
      const result = await prisma.dish.updateMany({
        where: { name: dishName },
        data: { needPrep: true }
      });
      
      if (result.count > 0) {
        console.log(`  ✅ 更新 "${dishName}" 为需要预处理`);
      }
    }

    console.log('🎉 need_prep 字段添加和初始化完成!');

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 确保连接关闭
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// 执行迁移
if (require.main === module) {
  addNeedPrepField();
}

module.exports = { addNeedPrepField };