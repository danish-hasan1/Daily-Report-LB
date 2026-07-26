"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PriorityLevel } from "@/generated/prisma/enums";

export async function upsertPriorityRole(input: {
  id?: string;
  roleId: string;
  recruiterId: string;
  priority: PriorityLevel;
  notes?: string;
}) {
  const { id, roleId, recruiterId, priority } = input;
  if (!roleId || !recruiterId || !priority) return;
  const notes = input.notes?.trim() || null;

  if (id) {
    await prisma.priorityRole.update({
      where: { id },
      data: { roleId, recruiterId, priority, notes, active: true },
    });
  } else {
    await prisma.priorityRole.create({
      data: { roleId, recruiterId, priority, notes },
    });
  }

  revalidatePath("/");
}

export async function setPriorityRoleActive(id: string, active: boolean) {
  if (!id) return;
  await prisma.priorityRole.update({ where: { id }, data: { active } });
  revalidatePath("/");
}
