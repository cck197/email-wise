-- CreateTable
CREATE TABLE "EmailProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LLMProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PrivateKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "emailProviderId" INTEGER,
    "lLMProviderId" INTEGER,
    CONSTRAINT "PrivateKey_emailProviderId_fkey" FOREIGN KEY ("emailProviderId") REFERENCES "EmailProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PrivateKey_lLMProviderId_fkey" FOREIGN KEY ("lLMProviderId") REFERENCES "LLMProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailGenerator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
