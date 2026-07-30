CREATE TABLE "storage_delete_failures" (
    "id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "product_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processing_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_delete_failures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "storage_delete_failures_storage_key_key"
    ON "storage_delete_failures"("storage_key");

CREATE INDEX "storage_delete_failures_processed_at_next_retry_at_idx"
    ON "storage_delete_failures"("processed_at", "next_retry_at");

CREATE INDEX "storage_delete_failures_product_id_idx"
    ON "storage_delete_failures"("product_id");
