# 工位管理说明

## 概述
本项目支持以下标准厨房工位：
- 热菜
- 打荷  
- 凉菜
- 蒸菜 (原为"蒸煮"，已标准化)
- 点心
- 切配

## 文件说明

### 数据库脚本
- `database/manage-stations.sql` - 主要的工位管理脚本，确保所有标准工位存在并标准化命名
- `database/update-stations.sql` - 简单的工位名称更新脚本

### 执行脚本
- `scripts/update-stations.sh` - Linux/Mac 环境执行脚本
- `scripts/update-stations.bat` - Windows 环境执行脚本

## 执行方法

### 方法1：使用执行脚本
```bash
# Linux/Mac
./scripts/update-stations.sh

# Windows
scripts\update-stations.bat
```

### 方法2：手动执行SQL
```bash
# 连接数据库并执行
psql -h localhost -U postgres -d smart_kitchen_dev -f database/manage-stations.sql
```

## 验证结果
执行后可以通过以下SQL验证：
```sql
SELECT id, name FROM stations ORDER BY id;
```

预期输出应该显示6个标准工位，其中"蒸菜"替代了原来的"蒸煮"。

## 注意事项
- 脚本具有幂等性，可重复执行
- 不会影响现有的菜品关联关系
- 会自动处理工位名称标准化