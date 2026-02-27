-- 添加缺失的countable字段到菜品表
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS countable BOOLEAN DEFAULT false;

-- 验证字段已添加
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'countable';