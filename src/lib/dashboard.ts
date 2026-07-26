import { prisma } from "@/lib/prisma";

export async function getActivePriorityRoles() {
  return prisma.priorityRole.findMany({
    where: { active: true },
    include: { role: true, recruiter: true },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getAllInFlight() {
  return prisma.submission.findMany({
    where: { stage: { notIn: ["JOINED", "REJECTED", "DROPOUT"] } },
    include: { role: true },
    orderBy: { stageChangedAt: "asc" },
  });
}
