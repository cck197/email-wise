/*
  Warnings:

  - You are about to drop the column `email` on the `Email` table. All the data in the column will be lost.
  - Added the required column `html` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_emailGeneratorId_fkey";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "email",
ADD COLUMN     "html" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL,
ALTER COLUMN "emailGeneratorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_emailGeneratorId_fkey" FOREIGN KEY ("emailGeneratorId") REFERENCES "EmailGenerator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
