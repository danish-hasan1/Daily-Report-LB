import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { getActivitiesInRange, summarize, byRecruiter, byVendor, byRole, byDay } from "@/lib/reports";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = isoDate(searchParams.get("from"), firstOfMonth());
  const to = isoDate(searchParams.get("to"), todayIso());

  const activities = await getActivitiesInRange({ from, to });
  const summary = summarize(activities);
  const recruiterRows = byRecruiter(activities);
  const vendorRows = byVendor(activities);
  const roleRows = byRole(activities);
  const dayRows = byDay(activities);

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
  summarySheet.addRow(["Internal Submissions", summary.internalSubmissions]);
  summarySheet.addRow(["Vendor Submissions", summary.vendorSubmissions]);
  summarySheet.addRow(["Total Interviews", summary.totalInterviews]);
  autoWidth(summarySheet);

  const recruiterSheet = workbook.addWorksheet("By Recruiter");
  const recruiterHeader = recruiterSheet.addRow([
    "Recruiter",
    "Submissions",
    "Internal",
    "Vendor",
    "Interviews",
  ]);
  styleHeaderRow(recruiterHeader);
  for (const r of recruiterRows) {
    recruiterSheet.addRow([r.name, r.submissions, r.internal, r.vendor, r.interviews]);
  }
  autoWidth(recruiterSheet);

  const vendorSheet = workbook.addWorksheet("By Vendor");
  const vendorHeader = vendorSheet.addRow(["Vendor", "Submissions", "Interviews"]);
  styleHeaderRow(vendorHeader);
  for (const v of vendorRows) {
    vendorSheet.addRow([v.name, v.submissions, v.interviews]);
  }
  autoWidth(vendorSheet);

  const roleSheet = workbook.addWorksheet("By Role");
  const roleHeader = roleSheet.addRow(["Role", "Client", "Submissions", "Interviews"]);
  styleHeaderRow(roleHeader);
  for (const r of roleRows) {
    roleSheet.addRow([r.title, r.client ?? "", r.submissions, r.interviews]);
  }
  autoWidth(roleSheet);

  const daySheet = workbook.addWorksheet("By Day");
  const dayHeader = daySheet.addRow(["Date", "Submissions", "Interviews"]);
  styleHeaderRow(dayHeader);
  for (const d of dayRows) {
    daySheet.addRow([d.date, d.submissions, d.interviews]);
  }
  autoWidth(daySheet);

  const logSheet = workbook.addWorksheet("Daily Log");
  const logHeader = logSheet.addRow([
    "Date",
    "Recruiter",
    "Type",
    "Role",
    "Client",
    "Source",
    "Vendor",
    "Notes",
  ]);
  styleHeaderRow(logHeader);
  for (const a of activities) {
    logSheet.addRow([
      a.date.toISOString().slice(0, 10),
      a.recruiter.name,
      a.type === "SUBMISSION" ? "Submission" : "Interview",
      a.role.title,
      a.role.client ?? "",
      a.sourceType === "INTERNAL" ? "Internal" : "Vendor",
      a.vendor?.name ?? "",
      a.notes ?? "",
    ]);
  }
  autoWidth(logSheet);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="LatentBridge-Recruitment-${from}_to_${to}.xlsx"`,
    },
  });
}
