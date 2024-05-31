/*
  Warnings:

  - You are about to drop the column `salt` on the `EmailGenerator` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailGenerator" DROP COLUMN "salt",
ADD COLUMN     "specials" TEXT,
ADD COLUMN     "stories" TEXT;
