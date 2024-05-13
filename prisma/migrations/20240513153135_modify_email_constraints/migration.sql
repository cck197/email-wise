/*
  Warnings:

  - Added the required column `productDescription` to the `EmailGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailGenerator" ADD COLUMN     "productDescription" TEXT NOT NULL;
