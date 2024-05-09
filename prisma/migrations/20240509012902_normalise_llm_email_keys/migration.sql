/*
  Warnings:

  - You are about to drop the column `emailPrivateKey` on the `EmailGenerator` table. All the data in the column will be lost.
  - You are about to drop the column `emailProviderId` on the `EmailGenerator` table. All the data in the column will be lost.
  - You are about to drop the column `llmPrivateKey` on the `EmailGenerator` table. All the data in the column will be lost.
  - You are about to drop the column `llmProviderId` on the `EmailGenerator` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailGenerator" DROP CONSTRAINT "EmailGenerator_emailProviderId_fkey";

-- DropForeignKey
ALTER TABLE "EmailGenerator" DROP CONSTRAINT "EmailGenerator_llmProviderId_fkey";

-- AlterTable
ALTER TABLE "EmailGenerator" DROP COLUMN "emailPrivateKey",
DROP COLUMN "emailProviderId",
DROP COLUMN "llmPrivateKey",
DROP COLUMN "llmProviderId";

-- CreateTable
CREATE TABLE "EmailProviderKey" (
    "id" SERIAL NOT NULL,
    "emailProviderId" INTEGER,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailProviderKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMProviderKey" (
    "id" SERIAL NOT NULL,
    "llmProviderId" INTEGER,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMProviderKey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailProviderKey" ADD CONSTRAINT "EmailProviderKey_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMProviderKey" ADD CONSTRAINT "LLMProviderKey_llmProviderId_fkey" FOREIGN KEY ("llmProviderId") REFERENCES "LLMProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
