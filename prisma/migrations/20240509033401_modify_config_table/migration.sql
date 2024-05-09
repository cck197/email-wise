/*
  Warnings:

  - Made the column `emailProviderId` on table `Config` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lLMProviderId` on table `Config` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Config" DROP CONSTRAINT "Config_emailProviderId_fkey";

-- DropForeignKey
ALTER TABLE "Config" DROP CONSTRAINT "Config_lLMProviderId_fkey";

-- AlterTable
ALTER TABLE "Config" ALTER COLUMN "emailProviderId" SET NOT NULL,
ALTER COLUMN "lLMProviderId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_lLMProviderId_fkey" FOREIGN KEY ("lLMProviderId") REFERENCES "LLMProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
