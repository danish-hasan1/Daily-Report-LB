"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { SourceType, SubmissionStage, ReasonCategory } from "@/generated/prisma/enums";

export async function createSubmission(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const recruiterId = String(formData.get("recruiterId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const sourceType = String(formData.get("sourceType") ?? "") as SourceType;
  const vendorId = String(formData.get("vendorId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!date || !recruiterId || !roleId || !candidateName || !sourceType) return;
  if (sourceType === "VENDOR" && !vendorId) return;

  const submissionDate = new Date(`${date}T00:00:00`);

  await prisma.submission.create({
    data: {
      candidateName,
      date: submissionDate,
      sourceType,
      recruiterId,
      roleId,
      vendorId: sourceType === "VENDOR" ? vendorId : null,
      notes,
      stageEvents: { create: { type: "SUBMITTED", date: submissionDate } },
    },
  });

  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function dismissReview(id: string) {
  await prisma.submission.update({ where: { id }, data: { needsReview: false } });
  revalidatePath("/entry");
}

export async function deleteSubmission(id: string) {
  await prisma.submission.delete({ where: { id } });
  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/");
}

const STAGE_BY_EVENT: Record<AdvanceEventType, SubmissionStage> = {
  INTERVIEW: "INTERVIEWING",
  OFFER: "OFFER",
  JOINED: "JOINED",
  REJECTED: "REJECTED",
  DROPOUT: "DROPOUT",
};

type AdvanceEventType = "INTERVIEW" | "OFFER" | "JOINED" | "REJECTED" | "DROPOUT";

export async function advanceStage(
  submissionId: string,
  input: {
    type: AdvanceEventType;
    date: string;
    reasonCategory?: ReasonCategory;
    reason?: string;
  }
) {
  const { type, date } = input;
  if (!submissionId || !date) return;
  if ((type === "REJECTED" || type === "DROPOUT") && !input.reasonCategory) return;
  if (input.reasonCategory === "OTHER" && !input.reason?.trim()) return;

  const eventDate = new Date(`${date}T00:00:00`);
  const isTerminal = type === "REJECTED" || type === "DROPOUT";

  await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      select: { interviewCount: true },
    });
    if (!submission) return;

    const round = type === "INTERVIEW" ? submission.interviewCount + 1 : null;

    await tx.stageEvent.create({
      data: {
        submissionId,
        type,
        date: eventDate,
        round,
        reasonCategory: isTerminal ? input.reasonCategory : undefined,
        reason: isTerminal ? input.reason?.trim() || null : null,
      },
    });

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        stage: STAGE_BY_EVENT[type],
        stageChangedAt: eventDate,
        interviewCount: type === "INTERVIEW" ? { increment: 1 } : undefined,
        reasonCategory: isTerminal ? input.reasonCategory : undefined,
        reason: isTerminal ? input.reason?.trim() || null : undefined,
        needsReview: false,
      },
    });
  });

  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/");
}
