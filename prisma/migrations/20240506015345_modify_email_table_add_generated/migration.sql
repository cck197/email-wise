/*
  Warnings:

  - You are about to drop the column `emailGeneratorId` on the `Email` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_emailGeneratorId_fkey";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "emailGeneratorId",
ADD COLUMN     "generated" BOOLEAN NOT NULL DEFAULT false;
