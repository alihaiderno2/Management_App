-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "diabledBy" TEXT;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_diabledBy_fkey" FOREIGN KEY ("diabledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
