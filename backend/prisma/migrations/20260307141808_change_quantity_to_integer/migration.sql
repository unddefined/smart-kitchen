-- AlterTable
-- Modify quantity column from DECIMAL(3,1) to INTEGER
ALTER TABLE "order_items" 
ALTER COLUMN "quantity" TYPE INTEGER USING quantity::INTEGER,
ALTER COLUMN "quantity" SET DEFAULT 1;
