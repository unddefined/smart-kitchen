# Seed脚本安全规范指南

## 🎯 目标
确保数据库seed脚本的安全性，防止生产环境数据丢失和其他安全风险。

## 🚫 严格禁止的操作

### 绝对禁止的破坏性操作
```typescript
// ❌ 绝对不允许的操作
await prisma.anyModel.deleteMany();    // 清空整个表
await prisma.anyModel.delete();        // 删除单条记录
await prisma.$executeRaw`TRUNCATE table_name`;  // 截断表
await prisma.$executeRaw`DROP TABLE table_name`; // 删除表
```

### 危险的数据操作
```typescript
// ❌ 高风险操作
await prisma.anyModel.updateMany();    // 批量更新可能影响大量数据
await prisma.anyModel.upsert();        // 可能意外覆盖现有数据
```

## ✅ 安全的Seed脚本规范

### 1. 增量式数据创建
```typescript
// ✅ 正确的做法：检查存在性后创建
const existingRecord = await prisma.model.findFirst({
  where: { uniqueField: data.uniqueField }
});

if (!existingRecord) {
  await prisma.model.create({ data });
  console.log(`✅ 创建新记录: ${data.name}`);
} else {
  console.log(`ℹ️  记录已存在，跳过: ${data.name}`);
}
```

### 2. 使用事务保护
```typescript
// ✅ 使用事务确保数据一致性
await prisma.$transaction(async (tx) => {
  // 所有相关操作都在事务中执行
  await tx.model1.create({ data: data1 });
  await tx.model2.create({ data: data2 });
});
```

### 3. 详细的日志记录
```typescript
// ✅ 完整的日志记录
console.log('🌱 开始填充数据库...');
console.log(`📊 当前${modelName}数量: ${currentCount}`);
console.log(`➕ 新增${modelName}数量: ${newCount}`);
console.log(`✅ 最终${modelName}数量: ${finalCount}`);
```

## 🔍 安全检查机制

### 自动化检查
GitHub Actions会在每次部署前自动检查seed脚本：

```yaml
- name: Security check - Verify seed script safety
  run: |
    echo "🔍 检查seed脚本安全性..."
    # 检查未注释的危险操作（排除注释行）
    if grep -v "^[[:space:]]*//" ./backend/prisma/seed.ts | grep -E "deleteMany\(\)|truncate|drop table" > /dev/null 2>&1; then
      echo "❌ 危险操作检测到！seed脚本包含未注释的破坏性操作"
      exit 1
    else
      echo "✅ seed脚本安全检查通过"
    fi
```

### 专用检查工具
使用提供的检查脚本进行详细分析：
```bash
node scripts/seed-script-security-check.js
```

## 🛡️ 生产环境保护措施

### 1. 环境变量保护
```typescript
// ✅ 生产环境保护
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  生产环境：跳过数据填充');
  return;
}
```

### 2. 数据备份提醒
```typescript
// ✅ 部署前提醒
console.log('🛡️  注意：即将执行数据库操作');
console.log('📋 建议先创建数据备份');
```

### 3. 渐进式部署
- 先部署到staging环境测试
- 确认无误后再部署到生产环境
- 建立快速回滚机制

## 📋 安全检查清单

### 代码审查清单
- [ ] 确认没有未注释的危险操作
- [ ] 验证使用了存在性检查
- [ ] 确认有适当的日志记录
- [ ] 检查是否有事务保护
- [ ] 验证生产环境保护机制
- [ ] 确认数据变更是幂等的

### 部署前检查
- [ ] 运行自动化安全检查
- [ ] 执行专用检查脚本
- [ ] 创建数据备份
- [ ] 在staging环境测试
- [ ] 获得必要的审批

## 🚨 应急处理

### 发现安全问题时
1. **立即停止部署**
2. **回滚到安全版本**
3. **分析问题根源**
4. **修复并重新测试**
5. **更新安全规范**

### 数据恢复流程
如果发生数据丢失：
1. 使用最近的备份恢复
2. 执行数据完整性检查
3. 验证应用程序功能
4. 更新监控告警
5. 完善预防措施

## 📚 相关文档
- [GITHUB_ACTIONS_SECURITY_GUIDELINES.md](GITHUB_ACTIONS_SECURITY_GUIDELINES.md) - GitHub Actions安全规范
- [DATA_RECOVERY_REPORT.md](DATA_RECOVERY_REPORT.md) - 数据恢复报告
- [FRONTEND_AUTO_UPDATE_DEPLOYMENT.md](FRONTEND_AUTO_UPDATE_DEPLOYMENT.md) - 前端自动更新部署

---
**最后更新**: 2026年2月28日
**版本**: v1.0
**状态**: ✅ 已实施并验证