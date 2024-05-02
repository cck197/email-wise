/*
  Warnings:

  - You are about to drop the `PrivateKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `title` on the `EmailGenerator` table. All the data in the column will be lost.
  - Added the required column `name` to the `EmailGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PrivateKey";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailGenerator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "emailProviderId" INTEGER,
    "llmProviderId" INTEGER,
    "emailPrivateKey" TEXT,
    "llmPrivateKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailGenerator_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailGenerator_llmProviderId_fkey" FOREIGN KEY ("llmProviderId") REFERENCES "LLMProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmailGenerator" ("createdAt", "emailProviderId", "id", "llmProviderId", "productHandle", "productId", "productVariantId", "shop") SELECT "createdAt", "emailProviderId", "id", "llmProviderId", "productHandle", "productId", "productVariantId", "shop" FROM "EmailGenerator";
DROP TABLE "EmailGenerator";
ALTER TABLE "new_EmailGenerator" RENAME TO "EmailGenerator";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
