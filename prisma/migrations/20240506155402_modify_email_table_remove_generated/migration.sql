/*
  Warnings:

  - Made the column `shop` on table `Email` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Email" ALTER COLUMN "shop" SET NOT NULL;
