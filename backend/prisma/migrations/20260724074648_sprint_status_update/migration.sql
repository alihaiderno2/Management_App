-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "status" "SprintStatus" NOT NULL DEFAULT 'PENDING';
