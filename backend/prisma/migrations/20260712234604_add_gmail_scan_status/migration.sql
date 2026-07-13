-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('idle', 'running', 'completed', 'failed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "scanCreated" INTEGER DEFAULT 0,
ADD COLUMN     "scanDepth" INTEGER,
ADD COLUMN     "scanError" TEXT,
ADD COLUMN     "scanProcessed" INTEGER DEFAULT 0,
ADD COLUMN     "scanStartedAt" TIMESTAMP(3),
ADD COLUMN     "scanStatus" "ScanStatus" NOT NULL DEFAULT 'idle',
ADD COLUMN     "scanTotal" INTEGER DEFAULT 0,
ADD COLUMN     "scanUpdated" INTEGER DEFAULT 0;
