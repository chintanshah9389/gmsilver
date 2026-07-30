-- Migration: Merge product_images table into products table
-- Each product now stores up to 3 images inline (image1, image2, image3)

-- Step 1: Rename existing image_url/storage_key to image1_url/image1_storage_key
ALTER TABLE "products" RENAME COLUMN "image_url" TO "image1_url";
ALTER TABLE "products" RENAME COLUMN "storage_key" TO "image1_storage_key";

-- Step 2: Add image2 and image3 columns
ALTER TABLE "products" ADD COLUMN "image2_url" TEXT;
ALTER TABLE "products" ADD COLUMN "image2_storage_key" TEXT;
ALTER TABLE "products" ADD COLUMN "image3_url" TEXT;
ALTER TABLE "products" ADD COLUMN "image3_storage_key" TEXT;

-- Step 3: Backfill image1 from product_images primary records when products.image1_url is empty
UPDATE "products" p
SET "image1_url" = sub.image_url,
    "image1_storage_key" = sub.storage_key
FROM (
  SELECT DISTINCT ON (product_id) product_id, image_url, storage_key
  FROM "product_images"
  WHERE is_primary = true
  ORDER BY product_id, sort_order ASC
) sub
WHERE p.id = sub.product_id
  AND p.image1_url IS NULL;

-- Step 4: Migrate image2 data from product_images (first non-primary by sort_order)
UPDATE "products" p
SET "image2_url" = sub.image_url,
    "image2_storage_key" = sub.storage_key
FROM (
  SELECT DISTINCT ON (product_id) product_id, image_url, storage_key
  FROM "product_images"
  WHERE is_primary = false
  ORDER BY product_id, sort_order ASC
) sub
WHERE p.id = sub.product_id;

-- Step 5: Migrate image3 data from product_images (second non-primary by sort_order)
UPDATE "products" p
SET "image3_url" = sub.image_url,
    "image3_storage_key" = sub.storage_key
FROM (
  SELECT product_id, image_url, storage_key
  FROM (
    SELECT product_id, image_url, storage_key,
           ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sort_order ASC) AS rn
    FROM "product_images"
    WHERE is_primary = false
  ) ranked
  WHERE rn = 2
) sub
WHERE p.id = sub.product_id;

-- Step 6: Drop the product_images table
DROP TABLE "product_images";
