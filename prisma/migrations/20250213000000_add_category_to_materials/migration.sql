-- Add categoryId to MaterialType table
ALTER TABLE "MaterialType" ADD COLUMN "categoryId" TEXT;

-- Add foreign key constraint
ALTER TABLE "MaterialType" ADD CONSTRAINT "MaterialType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE; 