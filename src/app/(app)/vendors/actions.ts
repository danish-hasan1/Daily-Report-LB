"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addVendor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  await prisma.vendor.create({ data: { name, contact, email, phone } });
  revalidatePath("/vendors");
  revalidatePath("/entry");
}

export async function toggleVendorActive(id: string, active: boolean) {
  await prisma.vendor.update({ where: { id }, data: { active } });
  revalidatePath("/vendors");
  revalidatePath("/entry");
}

export async function deleteVendor(id: string) {
  const count = await prisma.activity.count({ where: { vendorId: id } });
  if (count > 0) {
    await prisma.vendor.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.vendor.delete({ where: { id } });
  }
  revalidatePath("/vendors");
  revalidatePath("/entry");
}
