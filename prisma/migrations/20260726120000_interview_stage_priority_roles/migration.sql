-- Add interview stage tracking (StageEvent.stage / Submission.currentInterviewStage)
-- and the PriorityRole model for the daily morning priority-role discussion.

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('L1', 'L2', 'L3', 'MANAGER', 'CLIENT', 'HR', 'FINAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "currentInterviewStage" "InterviewStage";

-- AlterTable
ALTER TABLE "StageEvent" ADD COLUMN "stage" "InterviewStage";

-- CreateTable
CREATE TABLE "PriorityRole" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriorityRole_active_idx" ON "PriorityRole"("active");

-- CreateIndex
CREATE INDEX "PriorityRole_roleId_idx" ON "PriorityRole"("roleId");

-- CreateIndex
CREATE INDEX "PriorityRole_recruiterId_idx" ON "PriorityRole"("recruiterId");

-- AddForeignKey
ALTER TABLE "PriorityRole" ADD CONSTRAINT "PriorityRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityRole" ADD CONSTRAINT "PriorityRole_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
