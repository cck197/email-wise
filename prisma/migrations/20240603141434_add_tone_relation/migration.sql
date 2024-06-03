-- AddForeignKey
ALTER TABLE "EmailGenerator" ADD CONSTRAINT "EmailGenerator_toneId_fkey" FOREIGN KEY ("toneId") REFERENCES "Tone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
