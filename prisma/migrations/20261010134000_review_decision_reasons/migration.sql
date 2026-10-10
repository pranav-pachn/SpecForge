-- AlterTable
ALTER TABLE "ReviewRun" ADD COLUMN "decisionReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
