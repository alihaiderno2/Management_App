/*
  Warnings:

  - You are about to drop the column `chatRoomId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `chatRoom` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[directKey]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatRoomId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "chatRoomId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- DropTable
DROP TABLE "chatRoom";

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_directKey_key" ON "ChatRoom"("directKey");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
