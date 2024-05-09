/*
  Warnings:

  - Added the required column `emailKey` to the `Config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lLMKey` to the `Config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "emailKey" TEXT NOT NULL,
ADD COLUMN     "lLMKey" TEXT NOT NULL;
