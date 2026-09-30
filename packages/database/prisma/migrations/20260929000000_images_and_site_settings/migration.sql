-- Thumbnails become standalone images shared by barbers and the gallery.

-- AlterTable
ALTER TABLE "thumbnails" ADD COLUMN     "alt" TEXT;

-- CreateTable
CREATE TABLE "employee_images" (
    "employee_id" TEXT NOT NULL,
    "thumbnail_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_images_pkey" PRIMARY KEY ("employee_id","thumbnail_id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "thumbnail_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- Keep each barber's current picture as their first image before dropping the old column
INSERT INTO "employee_images" ("employee_id", "thumbnail_id", "sort_order", "updated_at")
SELECT "id", "picture_id", 0, CURRENT_TIMESTAMP FROM "employees" WHERE "picture_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_picture_id_fkey";

-- DropIndex
DROP INDEX "employees_picture_id_idx";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "picture_id";

-- Key/value settings were never used; replaced by the typed site_settings row.
-- DropTable
DROP TABLE "settings";

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "opening_hours" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_settings_single_row" CHECK ("id" = 1)
);

-- CreateIndex
CREATE INDEX "employee_images_thumbnail_id_idx" ON "employee_images"("thumbnail_id");

-- CreateIndex
CREATE INDEX "gallery_images_thumbnail_id_idx" ON "gallery_images"("thumbnail_id");

-- CreateIndex
CREATE INDEX "gallery_images_sort_order_idx" ON "gallery_images"("sort_order");

-- AddForeignKey
ALTER TABLE "employee_images" ADD CONSTRAINT "employee_images_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_images" ADD CONSTRAINT "employee_images_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "thumbnails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "thumbnails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
