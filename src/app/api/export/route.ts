import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import {
  getFunnelDataInRange,
  summarize,
  byRecruiter,
  byVendor,
  byRole,
  byDay,
  rejectionBreakdown,
  timeToFillInRange,
} from "@/lib/reports";

// This route reads live database state on every request and must not be
// prerendered (which would also require a DB connection at build time).
export const dynamic = "force-dynamic";

function isoDate(v: string | null, fallback: string) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fallback;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E293B" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 45);
  });
}

const STAGE_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  JOINED: "Joined",
  REJECTED: "Rejected",
  DROPOUT: "Dropout",
};

const EVENT_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  JOINED: "Joined",
  REJECTED: "Rejected",
  DROPOUT: "Dropout",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = isoDate(searchParams.get("from"), firstOfMonth());
  const to = isoDate(searchParams.get("to"), todayIso());

  const { submissions, stageEvents } = await getFunnelDataInRange({ from, to });
  const summary = summarize(submissions, stageEvents);
  const recruiterRows = byRecruiter(submissions, stageEvents);
  const vendorRows = byVendor(submissions, stageEvents);
  const roleRows = byRole(submissions, stageEvents);
  const dayRows = byDay(submissions, stageEvents);
  const { rows: rejectionRows } = rejectionBreakdown(stageEvents);
  const { rows: fillRows, avgDays } = await timeToFillInRange({ from, to });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LatentBridge Recruitment Tracker";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.mergeCells("A1:D1");
  summarySheet.getCell("A1").value = `LatentBridge Recruitment Summary — ${from} to ${to}`;
  summarySheet.getCell("A1").font = { bold: true, size: 14 };
  summarySheet.addRow([]);

  const totalsHeader = summarySheet.addRow(["Metric", "Count"]);
  styleHeaderRow(totalsHeader);
  summarySheet.addRow(["Total Submissions", summary.totalSubmissions]);
  summarySheet.addRow(["Self-sourced Submissions", summary.internalSubmissions]);
  summarySheet.addRow(["Vendor Submissions", summary.vendorSubmissions]);
  summarySheet.addRow(["Total Interviews", summary.totalInterviews]);
  summarySheet.addRow(["Total Offers", summary.totalOffers]);
  summarySheet.addRow(["Total Joins", summary.totalJoins]);
  summarySheet.addRow(["Total Rejected", summary.totalRejected]);
  summarySheet.addRow(["Total Dropout", summary.totalDropout]);
  summarySheet.addRow(["Submission → Interview Rate", `${summary.submissionToInterviewRate}%`]);
  summarySheet.addRow(["Interview → Offer Rate", `${summary.interviewToOfferRate}%`]);
  summarySheet.addRow(["Offer → Join Rate", `${summary.offerToJoinRate}%`]);
  summarySheet.addRow(["Avg. Time to Fill (days)", fillRows.length ? avgDays : "—"]);
  autoWidth(summarySheet);

  const recruiterSheet = workbook.addWorksheet("By Recruiter");
  const recruiterHeader = recruiterSheet.addRow([
    "Recruiter",
    "Submissions",
    "Self-sourced",
    "Vendor",
    "Interviews",
    "Offers",
    "Joins",
    "Rejected",
    "Dropout",
  ]);
  styleHeaderRow(recruiterHeader);
  for (const r of recruiterRows) {
    recruiterSheet.addRow([r.name, r.submissions, r.internal, r.vendor, r.interviews, r.offers, r.joins, r.rejected, r.dropout]);
  }
  autoWidth(recruiterSheet);

  const vendorSheet = workbook.addWorksheet("By Vendor");
  const vendorHeader = vendorSheet.addRow(["Vendor", "Submissions", "Interviews", "Offers", "Joins", "Rejected", "Dropout"]);
  styleHeaderRow(vendorHeader);
  for (const v of vendorRows) {
    vendorSheet.addRow([v.name, v.submissions, v.interviews, v.offers, v.joins, v.rejected, v.dropout]);
  }
  autoWidth(vendorSheet);

  const roleSheet = workbook.addWorksheet("By Role");
  const roleHeader = roleSheet.addRow(["Role", "Client", "Submissions", "Interviews", "Offers", "Joins", "Rejected", "Dropout"]);
  styleHeaderRow(roleHeader);
  for (const r of roleRows) {
    roleSheet.addRow([r.title, r.client ?? "", r.submissions, r.interviews, r.offers, r.joins, r.rejected, r.dropout]);
  }
  autoWidth(roleSheet);

  const daySheet = workbook.addWorksheet("By Day");
  const dayHeader = daySheet.addRow(["Date", "Submissions", "Interviews", "Offers", "Joins", "Rejected", "Dropout"]);
  styleHeaderRow(dayHeader);
  for (const d of dayRows) {
    daySheet.addRow([d.date, d.submissions, d.interviews, d.offers, d.joins, d.rejected, d.dropout]);
  }
  autoWidth(daySheet);

  const funnelSheet = workbook.addWorksheet("Funnel");
  const funnelHeader = funnelSheet.addRow(["Stage", "Count"]);
  styleHeaderRow(funnelHeader);
  funnelSheet.addRow(["Submitted", summary.totalSubmissions]);
  funnelSheet.addRow(["Interviewed", summary.totalInterviews]);
  funnelSheet.addRow(["Offered", summary.totalOffers]);
  funnelSheet.addRow(["Joined", summary.totalJoins]);
  funnelSheet.addRow([]);
  const rateHeader = funnelSheet.addRow(["Conversion", "Rate"]);
  styleHeaderRow(rateHeader);
  funnelSheet.addRow(["Submission → Interview", `${summary.submissionToInterviewRate}%`]);
  funnelSheet.addRow(["Interview → Offer", `${summary.interviewToOfferRate}%`]);
  funnelSheet.addRow(["Offer → Join", `${summary.offerToJoinRate}%`]);
  autoWidth(funnelSheet);

  const rejectionSheet = workbook.addWorksheet("Rejection Reasons");
  const rejectionHeader = rejectionSheet.addRow(["Type", "Reason", "Count"]);
  styleHeaderRow(rejectionHeader);
  for (const r of rejectionRows) {
    rejectionSheet.addRow([r.type === "REJECTED" ? "Rejected" : "Dropout", r.reason, r.count]);
  }
  autoWidth(rejectionSheet);

  const fillSheet = workbook.addWorksheet("Time to Fill");
  const fillHeader = fillSheet.addRow(["Role", "Client", "Date Opened", "Date Closed", "Days"]);
  styleHeaderRow(fillHeader);
  for (const r of fillRows) {
    fillSheet.addRow([
      r.title,
      r.client ?? "",
      r.dateOpened.toISOString().slice(0, 10),
      r.dateClosed.toISOString().slice(0, 10),
      r.days,
    ]);
  }
  autoWidth(fillSheet);

  const submissionSheet = workbook.addWorksheet("Submission Log");
  const submissionHeader = submissionSheet.addRow([
    "Date",
    "Candidate",
    "Recruiter",
    "Role",
    "Client",
    "Source",
    "Vendor",
    "Current Stage",
    "Interviews",
    "Reason",
    "Notes",
  ]);
  styleHeaderRow(submissionHeader);
  for (const s of submissions) {
    submissionSheet.addRow([
      s.date.toISOString().slice(0, 10),
      s.candidateName,
      s.recruiter.name,
      s.role.title,
      s.role.client ?? "",
      s.sourceType === "INTERNAL" ? "Self-sourced" : "Vendor",
      s.vendor?.name ?? "",
      STAGE_LABEL[s.stage] ?? s.stage,
      s.interviewCount,
      s.reason ?? "",
      s.notes ?? "",
    ]);
  }
  autoWidth(submissionSheet);

  const eventSheet = workbook.addWorksheet("Stage Event Log");
  const eventHeader = eventSheet.addRow(["Date", "Candidate", "Recruiter", "Role", "Event", "Round", "Reason", "Notes"]);
  styleHeaderRow(eventHeader);
  for (const e of stageEvents) {
    eventSheet.addRow([
      e.date.toISOString().slice(0, 10),
      e.submission.candidateName,
      e.submission.recruiter.name,
      e.submission.role.title,
      EVENT_LABEL[e.type] ?? e.type,
      e.round ?? "",
      e.reason ?? "",
      e.notes ?? "",
    ]);
  }
  autoWidth(eventSheet);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LatentBridge-Recruitment-${from}_to_${to}.xlsx"`,
    },
  });
}
