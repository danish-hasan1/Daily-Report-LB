-- One-time database setup for LatentBridge Recruitment Tracker.
--
-- Run this ONCE in your database to create the tables (e.g. paste it into
-- the Supabase SQL Editor and click Run). This is the same schema Prisma
-- generates; running it here avoids needing a database connection during the
-- Vercel build. Safe to re-run: it will error if the tables already exist,
-- which simply means setup is already done.

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('INTERNAL', 'VENDOR');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SubmissionStage" AS ENUM ('SUBMITTED', 'INTERVIEWING', 'OFFER', 'JOINED', 'REJECTED', 'DROPOUT');

-- CreateEnum
CREATE TYPE "StageEventType" AS ENUM ('SUBMITTED', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED', 'DROPOUT');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('CLIENT_REJECTED', 'CANDIDATE_DECLINED', 'NO_SHOW', 'SALARY_MISMATCH', 'POSITION_ON_HOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('L1', 'L2', 'L3', 'MANAGER', 'CLIENT', 'HR', 'FINAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startMonth" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "columnMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT,
    "status" "RoleStatus" NOT NULL DEFAULT 'OPEN',
    "priority" TEXT,
    "dateOpened" TIMESTAMP(3),
    "dateClosed" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorImportBatch" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "columnMapping" JSONB NOT NULL,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "vendorId" TEXT,
    "stage" "SubmissionStage" NOT NULL DEFAULT 'SUBMITTED',
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewCount" INTEGER NOT NULL DEFAULT 0,
    "currentInterviewStage" "InterviewStage",
    "reasonCategory" "ReasonCategory",
    "reason" TEXT,
    "notes" TEXT,
    "externalRef" TEXT,
    "dedupeKey" TEXT,
    "importBatchId" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageEvent" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "StageEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "round" INTEGER,
    "stage" "InterviewStage",
    "reasonCategory" "ReasonCategory",
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageEvent_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "Recruiter_active_idx" ON "Recruiter"("active");

-- CreateIndex
CREATE INDEX "Vendor_active_idx" ON "Vendor"("active");

-- CreateIndex
CREATE INDEX "Role_status_idx" ON "Role"("status");

-- CreateIndex
CREATE INDEX "VendorImportBatch_vendorId_idx" ON "VendorImportBatch"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_dedupeKey_key" ON "Submission"("dedupeKey");

-- CreateIndex
CREATE INDEX "Submission_date_idx" ON "Submission"("date");

-- CreateIndex
CREATE INDEX "Submission_recruiterId_idx" ON "Submission"("recruiterId");

-- CreateIndex
CREATE INDEX "Submission_roleId_idx" ON "Submission"("roleId");

-- CreateIndex
CREATE INDEX "Submission_vendorId_idx" ON "Submission"("vendorId");

-- CreateIndex
CREATE INDEX "Submission_stage_idx" ON "Submission"("stage");

-- CreateIndex
CREATE INDEX "Submission_sourceType_idx" ON "Submission"("sourceType");

-- CreateIndex
CREATE INDEX "StageEvent_submissionId_idx" ON "StageEvent"("submissionId");

-- CreateIndex
CREATE INDEX "StageEvent_type_idx" ON "StageEvent"("type");

-- CreateIndex
CREATE INDEX "StageEvent_date_idx" ON "StageEvent"("date");

-- CreateIndex
CREATE INDEX "PriorityRole_active_idx" ON "PriorityRole"("active");

-- CreateIndex
CREATE INDEX "PriorityRole_roleId_idx" ON "PriorityRole"("roleId");

-- CreateIndex
CREATE INDEX "PriorityRole_recruiterId_idx" ON "PriorityRole"("recruiterId");

-- AddForeignKey
ALTER TABLE "VendorImportBatch" ADD CONSTRAINT "VendorImportBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "VendorImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageEvent" ADD CONSTRAINT "StageEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityRole" ADD CONSTRAINT "PriorityRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityRole" ADD CONSTRAINT "PriorityRole_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
