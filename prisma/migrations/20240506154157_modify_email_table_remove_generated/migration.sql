/*
  Warnings:

  - You are about to drop the column `generated` on the `Email` table. All the data in the column will be lost.
  - Added the required column `shop` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email" DROP COLUMN "generated",
ADD COLUMN     "emailGeneratorId" INTEGER,
ADD COLUMN     "shop" TEXT;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_emailGeneratorId_fkey" FOREIGN KEY ("emailGeneratorId") REFERENCES "EmailGenerator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
