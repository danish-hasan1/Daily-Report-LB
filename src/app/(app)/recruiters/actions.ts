"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addRecruiter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.recruiter.create({ data: { name } });
  revalidatePath("/recruiters");
  revalidatePath("/entry");
}

export async function toggleRecruiterActive(id: string, active: boolean) {
  await prisma.recruiter.update({ where: { id }, data: { active } });
  revalidatePath("/recruiters");
  revalidatePath("/entry");
}

export async function deleteRecruiter(id: string) {
  const count = await prisma.submission.count({ where: { recruiterId: id } });
  if (count > 0) {
    await prisma.recruiter.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.recruiter.delete({ where: { id } });
  }
  revalidatePath("/recruiters");
  revalidatePath("/entry");
}
