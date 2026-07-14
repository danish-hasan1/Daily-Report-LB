"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RoleStatus } from "@/generated/prisma/enums";

export async function addRole(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const client = String(formData.get("client") ?? "").trim() || null;
  const priority = String(formData.get("priority") ?? "").trim() || null;

  await prisma.role.create({
    data: { title, client, priority, dateOpened: new Date() },
  });
  revalidatePath("/roles");
  revalidatePath("/entry");
}

export async function updateRoleStatus(id: string, status: RoleStatus) {
  await prisma.role.update({
    where: { id },
    data: {
      status,
      dateClosed: status === "FILLED" || status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath("/roles");
  revalidatePath("/entry");
}

export async function deleteRole(id: string) {
  const count = await prisma.activity.count({ where: { roleId: id } });
  if (count > 0) {
    await prisma.role.update({ where: { id }, data: { status: "CLOSED" } });
  } else {
    await prisma.role.delete({ where: { id } });
  }
  revalidatePath("/roles");
  revalidatePath("/entry");
}
