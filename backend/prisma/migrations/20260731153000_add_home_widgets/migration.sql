-- BannerLinkType is also created in 20260731200000_add_banners.
-- On a fresh database this migration runs first, so create the enum here.
DO $$ BEGIN
    CREATE TYPE "BannerLinkType" AS ENUM ('PRODUCT', 'CATEGORY', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "home_widgets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link_type" "BannerLinkType" NOT NULL DEFAULT 'NONE',
    "link_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "home_widgets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "home_widgets_key_key" ON "home_widgets"("key");
CREATE INDEX "home_widgets_key_is_active_idx" ON "home_widgets"("key", "is_active");