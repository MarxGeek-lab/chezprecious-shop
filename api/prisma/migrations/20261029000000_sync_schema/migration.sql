
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ORDER_STATUS', 'MESSAGE_NEW', 'STOCK_LOW', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropIndex
DROP INDEX "order_items_store_id_idx";

-- AlterTable
ALTER TABLE "newsletter_campaigns" ALTER COLUMN "admin_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "store_id";

-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "boost_pricing",
DROP COLUMN "commission",
DROP COLUMN "seller_registration",
ALTER COLUMN "site_name" SET DEFAULT 'Chez Precious',
ALTER COLUMN "primary_color" SET DEFAULT '#C8A24A',
ALTER COLUMN "secondary_color" SET DEFAULT '#0A0A0A',
ALTER COLUMN "accent_color" SET DEFAULT '#F4F1EC',
ALTER COLUMN "min_order" SET DEFAULT 0;

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "abandoned_carts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "user_id" TEXT,
    "cart_data" JSONB NOT NULL,
    "cart_total" DECIMAL(12,2) NOT NULL,
    "item_count" INTEGER NOT NULL,
    "recovery_token" TEXT NOT NULL,
    "is_recovered" BOOLEAN NOT NULL DEFAULT false,
    "recovered_at" TIMESTAMP(3),
    "first_reminder_sent_at" TIMESTAMP(3),
    "second_reminder_sent_at" TIMESTAMP(3),
    "abandoned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_carts_recovery_token_key" ON "abandoned_carts"("recovery_token");

-- CreateIndex
CREATE INDEX "abandoned_carts_email_idx" ON "abandoned_carts"("email");

-- CreateIndex
CREATE INDEX "abandoned_carts_is_recovered_abandoned_at_idx" ON "abandoned_carts"("is_recovered", "abandoned_at");

-- CreateIndex
CREATE INDEX "abandoned_carts_recovery_token_idx" ON "abandoned_carts"("recovery_token");

