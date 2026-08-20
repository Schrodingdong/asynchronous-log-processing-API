/*
  Warnings:

  - Added the required column `logPath` to the `ProcessingJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessingJob" ADD COLUMN     "logPath" TEXT NOT NULL;
