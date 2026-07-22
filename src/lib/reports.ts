import { prisma } from "@/lib/prisma";
import type { StageEventType, ReasonCategory } from "@/generated/prisma/enums";

export type ReportRange = { from: string; to: string };

export type PresetRange = "today" | "week" | "month" | "quarter";

function rangeDates({ from, to }: ReportRange) {
  return {
    start: new Date(`${from}T00:00:00`),
    end: new Date(`${to}T23:59:59.999`),
  };
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function getPresetRange(preset: PresetRange): ReportRange {
  const now = new Date();
  const to = isoDate(now);

  if (preset === "today") return { from: to, to };

  if (preset === "week") {
    const from = new Date(now);
    const daysSinceMonday = (from.getDay() + 6) % 7;
    from.setDate(from.getDate() - daysSinceMonday);
    return { from: isoDate(from), to };
  }

  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: isoDate(from), to };
  }

  const quarter = Math.floor(now.getMonth() / 3);
  const from = new Date(now.getFullYear(), quarter * 3, 1);
  return { from: isoDate(from), to };
}

export async function getSubmissionsInRange({ from, to }: ReportRange) {
  const { start, end } = rangeDates({ from, to });
  return prisma.submission.findMany({
    where: { date: { gte: start, lte: end } },
    include: { recruiter: true, role: true, vendor: true },
    orderBy: { date: "asc" },
  });
}

export type SubmissionRow = Awaited<ReturnType<typeof getSubmissionsInRange>>[number];

export async function getStageEventsInRange({ from, to }: ReportRange) {
  const { start, end } = rangeDates({ from, to });
  return prisma.stageEvent.findMany({
    where: { date: { gte: start, lte: end } },
    include: { submission: { include: { recruiter: true, role: true, vendor: true } } },
    orderBy: { date: "asc" },
  });
}

export type StageEventRow = Awaited<ReturnType<typeof getStageEventsInRange>>[number];

export async function getFunnelDataInRange(range: ReportRange) {
  const [submissions, stageEvents] = await Promise.all([
    getSubmissionsInRange(range),
    getStageEventsInRange(range),
  ]);
  return { submissions, stageEvents };
}

function countByType(events: StageEventRow[], type: StageEventType) {
  return events.filter((e) => e.type === type).length;
}

function distinctSubmissionsByType(events: StageEventRow[], type: StageEventType) {
  return new Set(events.filter((e) => e.type === type).map((e) => e.submissionId)).size;
}

function rate(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 1000) / 10;
}

export function summarize(submissions: SubmissionRow[], stageEvents: StageEventRow[]) {
  const internalSubmissions = submissions.filter((s) => s.sourceType === "INTERNAL").length;
  const vendorSubmissions = submissions.filter((s) => s.sourceType === "VENDOR").length;

  const totalInterviews = countByType(stageEvents, "INTERVIEW");
  const totalOffers = countByType(stageEvents, "OFFER");
  const totalJoins = countByType(stageEvents, "JOINED");
  const totalRejected = countByType(stageEvents, "REJECTED");
  const totalDropout = countByType(stageEvents, "DROPOUT");

  const interviewedSubmissions = distinctSubmissionsByType(stageEvents, "INTERVIEW");
  const offeredSubmissions = distinctSubmissionsByType(stageEvents, "OFFER");
  const joinedSubmissions = distinctSubmissionsByType(stageEvents, "JOINED");

  return {
    totalSubmissions: submissions.length,
    internalSubmissions,
    vendorSubmissions,
    totalInterviews,
    totalOffers,
    totalJoins,
    totalRejected,
    totalDropout,
    submissionToInterviewRate: rate(interviewedSubmissions, submissions.length),
    interviewToOfferRate: rate(offeredSubmissions, interviewedSubmissions),
    offerToJoinRate: rate(joinedSubmissions, offeredSubmissions),
  };
}

type GroupRow = {
  id: string;
  submissions: number;
  internal: number;
  vendor: number;
  interviews: number;
  offers: number;
  joins: number;
  rejected: number;
  dropout: number;
};

type StageCounts = {
  interviews: number;
  offers: number;
  joins: number;
  rejected: number;
  dropout: number;
};

function applyStageEvent(row: StageCounts, type: StageEventType) {
  if (type === "INTERVIEW") row.interviews += 1;
  else if (type === "OFFER") row.offers += 1;
  else if (type === "JOINED") row.joins += 1;
  else if (type === "REJECTED") row.rejected += 1;
  else if (type === "DROPOUT") row.dropout += 1;
}

export function byRecruiter(submissions: SubmissionRow[], stageEvents: StageEventRow[]) {
  const map = new Map<string, GroupRow & { name: string }>();
  const ensure = (id: string, name: string) => {
    if (!map.has(id)) {
      map.set(id, { id, name, submissions: 0, internal: 0, vendor: 0, interviews: 0, offers: 0, joins: 0, rejected: 0, dropout: 0 });
    }
    return map.get(id)!;
  };

  for (const s of submissions) {
    const row = ensure(s.recruiterId, s.recruiter.name);
    row.submissions += 1;
    if (s.sourceType === "INTERNAL") row.internal += 1;
    else row.vendor += 1;
  }
  for (const e of stageEvents) {
    const row = ensure(e.submission.recruiterId, e.submission.recruiter.name);
    applyStageEvent(row, e.type);
  }

  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byVendor(submissions: SubmissionRow[], stageEvents: StageEventRow[]) {
  const map = new Map<string, Omit<GroupRow, "internal" | "vendor"> & { name: string }>();
  const ensure = (id: string, name: string) => {
    if (!map.has(id)) {
      map.set(id, { id, name, submissions: 0, interviews: 0, offers: 0, joins: 0, rejected: 0, dropout: 0 });
    }
    return map.get(id)!;
  };

  for (const s of submissions) {
    if (s.sourceType !== "VENDOR" || !s.vendor) continue;
    const row = ensure(s.vendorId!, s.vendor.name);
    row.submissions += 1;
  }
  for (const e of stageEvents) {
    if (e.submission.sourceType !== "VENDOR" || !e.submission.vendor) continue;
    const row = ensure(e.submission.vendorId!, e.submission.vendor.name);
    applyStageEvent(row, e.type);
  }

  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byRole(submissions: SubmissionRow[], stageEvents: StageEventRow[]) {
  const map = new Map<string, Omit<GroupRow, "internal" | "vendor"> & { title: string; client: string | null }>();
  const ensure = (id: string, title: string, client: string | null) => {
    if (!map.has(id)) {
      map.set(id, { id, title, client, submissions: 0, interviews: 0, offers: 0, joins: 0, rejected: 0, dropout: 0 });
    }
    return map.get(id)!;
  };

  for (const s of submissions) {
    const row = ensure(s.roleId, s.role.title, s.role.client);
    row.submissions += 1;
  }
  for (const e of stageEvents) {
    const row = ensure(e.submission.roleId, e.submission.role.title, e.submission.role.client);
    applyStageEvent(row, e.type);
  }

  return Array.from(map.values()).sort((a, b) => b.submissions - a.submissions);
}

export function byDay(submissions: SubmissionRow[], stageEvents: StageEventRow[]) {
  const map = new Map<string, Omit<GroupRow, "id" | "internal" | "vendor"> & { date: string }>();
  const ensure = (date: string) => {
    if (!map.has(date)) {
      map.set(date, { date, submissions: 0, interviews: 0, offers: 0, joins: 0, rejected: 0, dropout: 0 });
    }
    return map.get(date)!;
  };

  for (const s of submissions) {
    ensure(s.date.toISOString().slice(0, 10)).submissions += 1;
  }
  for (const e of stageEvents) {
    const row = ensure(e.date.toISOString().slice(0, 10));
    applyStageEvent(row, e.type);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export const REASON_LABELS: Record<ReasonCategory, string> = {
  CLIENT_REJECTED: "Client Rejected",
  CANDIDATE_DECLINED: "Candidate Declined",
  NO_SHOW: "No Show",
  SALARY_MISMATCH: "Salary Mismatch",
  POSITION_ON_HOLD: "Position On Hold",
  OTHER: "Other",
};

export function rejectionBreakdown(stageEvents: StageEventRow[]) {
  const terminal = stageEvents.filter((e) => e.type === "REJECTED" || e.type === "DROPOUT");
  const map = new Map<string, { type: "REJECTED" | "DROPOUT"; reason: string; count: number }>();

  for (const e of terminal) {
    const reason = e.reasonCategory ? REASON_LABELS[e.reasonCategory] : "Unspecified";
    const key = `${e.type}::${reason}`;
    if (!map.has(key)) map.set(key, { type: e.type as "REJECTED" | "DROPOUT", reason, count: 0 });
    map.get(key)!.count += 1;
  }

  const rows = Array.from(map.values()).sort((a, b) => b.count - a.count);
  return { rows, total: terminal.length };
}

export async function timeToFillInRange({ from, to }: ReportRange) {
  const { start, end } = rangeDates({ from, to });
  const roles = await prisma.role.findMany({
    where: { dateClosed: { gte: start, lte: end } },
    orderBy: { dateClosed: "asc" },
  });

  const rows = roles
    .filter((r) => r.dateOpened && r.dateClosed)
    .map((r) => {
      const days = Math.round((r.dateClosed!.getTime() - r.dateOpened!.getTime()) / 86_400_000);
      return { id: r.id, title: r.title, client: r.client, dateOpened: r.dateOpened!, dateClosed: r.dateClosed!, days };
    });

  const avgDays = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.days, 0) / rows.length);

  return { rows, avgDays };
}
