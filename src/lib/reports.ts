import { prisma } from "@/lib/prisma";

export type ReportRange = { from: string; to: string };

export async function getActivitiesInRange({ from, to }: ReportRange) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59.999`);

  return prisma.activity.findMany({
    where: { date: { gte: start, lte: end } },
    include: { recruiter: true, role: true, vendor: true },
    orderBy: { date: "asc" },
  });
}

export type Activity = Awaited<ReturnType<typeof getActivitiesInRange>>[number];

export function summarize(activities: Activity[]) {
  const submissions = activities.filter((a) => a.type === "SUBMISSION");
  const interviews = activities.filter((a) => a.type === "INTERVIEW");
  const internalSubs = submissions.filter((a) => a.sourceType === "INTERNAL");
  const vendorSubs = submissions.filter((a) => a.sourceType === "VENDOR");

  return {
    totalSubmissions: submissions.length,
    totalInterviews: interviews.length,
    internalSubmissions: internalSubs.length,
    vendorSubmissions: vendorSubs.length,
  };
}

export function byRecruiter(activities: Activity[]) {
  const map = new Map<
    string,
    { id: string; name: string; submissions: number; internal: number; vendor: number; interviews: number }
  >();
  for (const a of activities) {
    const key = a.recruiterId;
    if (!map.has(key)) {
      map.set(key, { id: key, name: a.recruiter.name, submissions: 0, internal: 0, vendor: 0, interviews: 0 });
    }
    const row = map.get(key)!;
    if (a.type === "SUBMISSION") {
      row.submissions += 1;
      if (a.sourceType === "INTERNAL") row.internal += 1;
      else row.vendor += 1;
    } else {
      row.interviews += 1;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byVendor(activities: Activity[]) {
  const map = new Map<string, { id: string; name: string; submissions: number; interviews: number }>();
  for (const a of activities) {
    if (a.sourceType !== "VENDOR" || !a.vendor) continue;
    const key = a.vendorId!;
    if (!map.has(key)) map.set(key, { id: key, name: a.vendor.name, submissions: 0, interviews: 0 });
    const row = map.get(key)!;
    if (a.type === "SUBMISSION") row.submissions += 1;
    else row.interviews += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byRole(activities: Activity[]) {
  const map = new Map<
    string,
    { id: string; title: string; client: string | null; submissions: number; interviews: number }
  >();
  for (const a of activities) {
    const key = a.roleId;
    if (!map.has(key)) {
      map.set(key, { id: key, title: a.role.title, client: a.role.client, submissions: 0, interviews: 0 });
    }
    const row = map.get(key)!;
    if (a.type === "SUBMISSION") row.submissions += 1;
    else row.interviews += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byDay(activities: Activity[]) {
  const map = new Map<string, { submissions: number; interviews: number }>();
  for (const a of activities) {
    const key = a.date.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, { submissions: 0, interviews: 0 });
    const row = map.get(key)!;
    if (a.type === "SUBMISSION") row.submissions += 1;
    else row.interviews += 1;
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
