/*
  Warnings:

  - You are about to drop the column `emailGeneratorId` on the `Config` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Config" DROP CONSTRAINT "Config_emailGeneratorId_fkey";

-- AlterTable
ALTER TABLE "Config" DROP COLUMN "emailGeneratorId";
