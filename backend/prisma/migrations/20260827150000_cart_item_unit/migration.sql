-- Store how the shopper added the item (pieces vs kg) for cart display.

CREATE TYPE "CartUnit" AS ENUM ('PIECES', 'KG');

ALTER TABLE "cart_items"
ADD COLUMN "unit" "CartUnit" NOT NULL DEFAULT 'PIECES',
ADD COLUMN "unit_amount" DECIMAL(12,3) NOT NULL DEFAULT 1;

UPDATE "cart_items"
SET "unit_amount" = "quantity";
