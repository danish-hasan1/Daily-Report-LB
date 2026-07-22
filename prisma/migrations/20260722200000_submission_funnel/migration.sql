-- Replace the flat Activity log with a Submission (funnel head record) +
-- StageEvent (history) model, plus vendor sheet import support.

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_recruiterId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_roleId_fkey";
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_vendorId_fkey";

-- DropTable
DROP TABLE "Activity";

-- DropEnum
DROP TYPE "ActivityType";

-- CreateEnum
CREATE TYPE "SubmissionStage" AS ENUM ('SUBMITTED', 'INTERVIEWING', 'OFFER', 'JOINED', 'REJECTED', 'DROPOUT');

-- CreateEnum
CREATE TYPE "StageEventType" AS ENUM ('SUBMITTED', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED', 'DROPOUT');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('CLIENT_REJECTED', 'CANDIDATE_DECLINED', 'NO_SHOW', 'SALARY_MISMATCH', 'POSITION_ON_HOLD', 'OTHER');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "columnMapping" JSONB;

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
    "reasonCategory" "ReasonCategory",
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageEvent_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "VendorImportBatch_vendorId_idx" ON "VendorImportBatch"("vendorId");

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
ALTER TABLE "VendorImportBatch" ADD CONSTRAINT "VendorImportBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
