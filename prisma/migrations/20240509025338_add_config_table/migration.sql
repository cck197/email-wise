/*
  Warnings:

  - You are about to drop the `EmailProviderKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LLMProviderKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailProviderKey" DROP CONSTRAINT "EmailProviderKey_emailProviderId_fkey";

-- DropForeignKey
ALTER TABLE "LLMProviderKey" DROP CONSTRAINT "LLMProviderKey_llmProviderId_fkey";

-- DropTable
DROP TABLE "EmailProviderKey";

-- DropTable
DROP TABLE "LLMProviderKey";

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "emailProviderId" INTEGER,
    "lLMProviderId" INTEGER,
    "emailGeneratorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_lLMProviderId_fkey" FOREIGN KEY ("lLMProviderId") REFERENCES "LLMProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_emailGeneratorId_fkey" FOREIGN KEY ("emailGeneratorId") REFERENCES "EmailGenerator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
