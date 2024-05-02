/*
  Warnings:

  - You are about to drop the column `shop` on the `PrivateKey` table. All the data in the column will be lost.
  - Added the required column `shop` to the `EmailGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrivateKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "emailProviderId" INTEGER,
    "lLMProviderId" INTEGER,
    CONSTRAINT "PrivateKey_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrivateKey_lLMProviderId_fkey" FOREIGN KEY ("lLMProviderId") REFERENCES "LLMProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrivateKey" ("emailProviderId", "id", "key", "lLMProviderId") SELECT "emailProviderId", "id", "key", "lLMProviderId" FROM "PrivateKey";
DROP TABLE "PrivateKey";
ALTER TABLE "new_PrivateKey" RENAME TO "PrivateKey";
CREATE TABLE "new_EmailGenerator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "emailProviderId" INTEGER,
    "llmProviderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailGenerator_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailGenerator_llmProviderId_fkey" FOREIGN KEY ("llmProviderId") REFERENCES "LLMProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmailGenerator" ("createdAt", "emailProviderId", "id", "llmProviderId", "productHandle", "productId", "productVariantId", "title") SELECT "createdAt", "emailProviderId", "id", "llmProviderId", "productHandle", "productId", "productVariantId", "title" FROM "EmailGenerator";
DROP TABLE "EmailGenerator";
ALTER TABLE "new_EmailGenerator" RENAME TO "EmailGenerator";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
