-- CreateEnum
CREATE TYPE "ProductOrigin" AS ENUM ('INDIAN', 'IMPORTED');

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "origin" "ProductOrigin" NOT NULL DEFAULT 'INDIAN';

-- CreateIndex
CREATE INDEX "products_origin_idx" ON "products"("origin");
