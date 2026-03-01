# 菜品分类排序更新报告

## 更新概述
根据上菜流程要求，调整了菜品分类的显示顺序：**started → 凉菜 → serving → 前菜 → 中菜、点心、蒸菜 → 后菜 → 尾菜 → done**

## 更新时间
2024年3月1日

## 技术实现方案
由于PostgreSQL中表的主键ID是自增且不可修改的，采用了添加 `display_order` 字段的方式来控制显示顺序，这是一种标准的排序解决方案。

## 新的分类顺序
1. **凉菜** (display_order: 1)
2. **前菜** (display_order: 2)  
3. **中菜** (display_order: 3)
4. **点心** (display_order: 4)
5. **蒸菜** (display_order: 5)
6. **后菜** (display_order: 6)
7. **尾菜** (display_order: 7)

## 数据库变更

### 新增字段
- 在 `dish_categories` 表中添加 `display_order` 字段 (INTEGER, DEFAULT 0)

### 数据更新
- 凉菜: display_order = 1
- 前菜: display_order = 2
- 中菜: display_order = 3
- 点心: display_order = 4
- 蒸菜: display_order = 5
- 后菜: display_order = 6
- 尾菜: display_order = 7

## 代码变更

### 后端服务层更新
1. **DishesService** 添加新方法：
   - `getCategoriesInServingOrder()` - 获取按上菜顺序排序的分类
   - `getDishesGroupedByCategory()` - 获取按分类分组的菜品

2. **查询优化**：
   - 所有菜品查询默认按 `category.displayOrder ASC` 排序
   - 支持复合排序（先按分类，再按菜品名称）

### API端点更新
新增API端点：
- `GET /dishes/categories/serving-order` - 获取按上菜顺序的分类列表
- `GET /dishes/grouped-by-category` - 获取按分类分组的菜品数据

## 验证结果

### 功能测试
✅ 分类按display_order正确排序
✅ 菜品按分类顺序正确显示
✅ 分组查询功能正常工作
✅ Prisma Client重新生成成功

### 数据统计
- 总分类数: 7个
- 凉菜: 2个菜品
- 前菜: 8个菜品
- 中菜: 24个菜品
- 点心: 2个菜品
- 蒸菜: 8个菜品
- 后菜: 5个菜品
- 尾菜: 2个菜品

## 使用示例

### 前端调用示例
```javascript
// 获取按上菜顺序的分类
const categories = await api.get('/dishes/categories/serving-order');

// 获取分组的菜品数据
const groupedDishes = await api.get('/dishes/grouped-by-category');

// 按新顺序显示菜品
groupedDishes.forEach(group => {
  console.log(`${group.category.name}:`);
  group.dishes.forEach(dish => {
    console.log(`  - ${dish.name}`);
  });
});
```

## 后续建议

1. **前端界面更新**：调整菜品选择界面，按照新的分类顺序显示
2. **订单处理优化**：在订单创建和处理流程中考虑分类顺序
3. **打印模板调整**：菜单打印和厨房单据按新顺序排列
4. **移动端适配**：确保移动设备上的菜品显示顺序一致

## 回滚方案
如需回滚，可执行以下SQL：
```sql
UPDATE dish_categories SET display_order = id - 8;
```
这将恢复到基于ID的原始排序。

## 注意事项
- 此变更为非破坏性更新，不影响现有数据
- display_order字段默认值为0，未设置的分类会排在最前
- 建议在所有查询中明确指定排序条件，避免依赖默认排序