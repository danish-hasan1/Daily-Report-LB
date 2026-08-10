"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActivityType, SourceType } from "@/generated/prisma/enums";

type ActivityDraft = {
  date: string;
  recruiterId: string;
  type: ActivityType;
  roleId: string;
  sourceType: SourceType;
  vendorId: string | null;
  notes: string | null;
};

export async function addActivities(entries: ActivityDraft[]) {
  const valid = entries.filter(
    (e) =>
      e.date &&
      e.recruiterId &&
      e.roleId &&
      e.type &&
      e.sourceType &&
      (e.sourceType !== "VENDOR" || e.vendorId)
  );
  if (valid.length === 0) return;

  await prisma.activity.createMany({
    data: valid.map((e) => ({
      date: new Date(`${e.date}T00:00:00`),
      recruiterId: e.recruiterId,
      type: e.type,
      roleId: e.roleId,
      sourceType: e.sourceType,
      vendorId: e.sourceType === "VENDOR" ? e.vendorId : null,
      notes: e.notes,
    })),
  });

  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function deleteActivity(id: string) {
  await prisma.activity.delete({ where: { id } });
  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/");
}
