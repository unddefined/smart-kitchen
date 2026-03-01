-- 添加need_prep字段到菜品表
ALTER TABLE dishes 
ADD COLUMN IF NOT EXISTS need_prep BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN dishes.need_prep IS '是否需要预处理（如裹粉、蒸、预炸），如否则跳过status.prep';

-- 验证字段是否添加成功
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'need_prep';