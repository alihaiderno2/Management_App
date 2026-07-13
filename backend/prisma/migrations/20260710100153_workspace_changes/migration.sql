/*
  Warnings:

  - Added the required column `ownerId` to the `Workspace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "ownerId" TEXT NOT NULL;
