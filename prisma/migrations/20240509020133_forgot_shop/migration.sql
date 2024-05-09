/*
  Warnings:

  - Added the required column `shop` to the `EmailProviderKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `LLMProviderKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailProviderKey" ADD COLUMN     "shop" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LLMProviderKey" ADD COLUMN     "shop" TEXT NOT NULL;
