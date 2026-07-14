"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActivityType, SourceType } from "@/generated/prisma/enums";

export async function addActivity(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const recruiterId = String(formData.get("recruiterId") ?? "");
  const type = String(formData.get("type") ?? "") as ActivityType;
  const roleId = String(formData.get("roleId") ?? "");
  const sourceType = String(formData.get("sourceType") ?? "") as SourceType;
  const vendorId = String(formData.get("vendorId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!date || !recruiterId || !roleId || !type || !sourceType) return;
  if (sourceType === "VENDOR" && !vendorId) return;

  await prisma.activity.create({
    data: {
      date: new Date(`${date}T00:00:00`),
      recruiterId,
      type,
      roleId,
      sourceType,
      vendorId: sourceType === "VENDOR" ? vendorId : null,
      notes,
    },
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
