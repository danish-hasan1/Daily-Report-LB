-- One-time database setup for LatentBridge Recruitment Tracker.
--
-- Run this ONCE in your database to create the tables (e.g. paste it into
-- the Supabase SQL Editor and click Run). This is the same schema Prisma
-- generates; running it here avoids needing a database connection during the
-- Vercel build. Safe to re-run: it will error if the tables already exist,
-- which simply means setup is already done.

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SUBMISSION', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('INTERNAL', 'VENDOR');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED', 'ON_HOLD');

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
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ActivityType" NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "vendorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recruiter_active_idx" ON "Recruiter"("active");

-- CreateIndex
CREATE INDEX "Vendor_active_idx" ON "Vendor"("active");

-- CreateIndex
CREATE INDEX "Role_status_idx" ON "Role"("status");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_recruiterId_idx" ON "Activity"("recruiterId");

-- CreateIndex
CREATE INDEX "Activity_roleId_idx" ON "Activity"("roleId");

-- CreateIndex
CREATE INDEX "Activity_vendorId_idx" ON "Activity"("vendorId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
