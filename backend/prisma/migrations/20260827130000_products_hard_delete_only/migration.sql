-- Products use hard delete only. Purge any soft-deleted rows, then drop the column.

DELETE FROM wishlist
WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);

DELETE FROM cart_items
WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE deleted_at IS NOT NULL);

DELETE FROM products
WHERE deleted_at IS NOT NULL;

ALTER TABLE "products" DROP COLUMN IF EXISTS "deleted_at";
