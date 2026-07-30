-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('NEW', 'SALE', 'MARKETING', 'FEATURED');

-- CreateEnum
CREATE TYPE "BannerLinkType" AS ENUM ('PRODUCT', 'CATEGORY', 'NONE');

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badge_label" "BannerType" NOT NULL DEFAULT 'NEW',
    "image_url" TEXT,
    "image_storage_key" TEXT,
    "link_type" "BannerLinkType" NOT NULL DEFAULT 'NONE',
    "link_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_is_active_idx" ON "banners"("is_active");
