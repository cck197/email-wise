-- AlterTable
ALTER TABLE "EmailGenerator" ADD COLUMN     "toneId" INTEGER;

-- CreateTable
CREATE TABLE "Tone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tone_pkey" PRIMARY KEY ("id")
);
