/*
  Warnings:

  - You are about to drop the column `name` on the `EmailGenerator` table. All the data in the column will be lost.
  - You are about to drop the `Config` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productTitle` to the `EmailGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Config" DROP CONSTRAINT "Config_emailProviderId_fkey";

-- DropForeignKey
ALTER TABLE "Config" DROP CONSTRAINT "Config_lLMProviderId_fkey";

-- AlterTable
ALTER TABLE "EmailGenerator" DROP COLUMN "name",
ADD COLUMN     "productTitle" TEXT NOT NULL;

-- DropTable
DROP TABLE "Config";

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "emailProviderId" INTEGER NOT NULL,
    "emailKey" TEXT NOT NULL,
    "lLMProviderId" INTEGER NOT NULL,
    "lLMKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_lLMProviderId_fkey" FOREIGN KEY ("lLMProviderId") REFERENCES "LLMProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
