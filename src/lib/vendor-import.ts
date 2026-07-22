import ExcelJS from "exceljs";
import { Readable } from "stream";
import crypto from "crypto";

export type ParsedSheet = {
  headers: string[];
  rows: string[][];
};

function cellToString(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v) return String((v as { text: unknown }).text ?? "");
    if ("result" in v) return String((v as { result: unknown }).result ?? "");
  }
  return String(v).trim();
}

export async function parseWorkbookBuffer(buffer: Buffer, filename: string): Promise<ParsedSheet> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = filename.toLowerCase().endsWith(".csv");

  if (isCsv) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const headers: string[] = [];
  const rows: string[][] = [];

  sheet.eachRow((row, rowNumber) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1).map(cellToString);
    if (rowNumber === 1) {
      headers.push(...values);
    } else if (values.some((v) => v !== "")) {
      rows.push(values);
    }
  });

  return { headers, rows };
}

export type ColumnMapping = {
  candidateName: string;
  role: string;
  date: string;
  status: string;
  externalRef: string;
  notes: string;
  recruiter: string;
};

export type MappedRow = {
  candidateName: string;
  roleText: string;
  date: string;
  status: string;
  externalRef: string;
  notes: string;
  recruiterText: string;
};

function normalizeDate(v: string): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function applyColumnMapping(sheet: ParsedSheet, mapping: ColumnMapping): MappedRow[] {
  const idx = (header: string) => (header ? sheet.headers.indexOf(header) : -1);
  const nameIdx = idx(mapping.candidateName);
  const roleIdx = idx(mapping.role);
  const dateIdx = idx(mapping.date);
  const statusIdx = idx(mapping.status);
  const refIdx = idx(mapping.externalRef);
  const notesIdx = idx(mapping.notes);
  const recruiterIdx = idx(mapping.recruiter);

  const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");

  return sheet.rows
    .map((row) => ({
      candidateName: cell(row, nameIdx),
      roleText: cell(row, roleIdx),
      date: normalizeDate(cell(row, dateIdx)),
      status: cell(row, statusIdx),
      externalRef: cell(row, refIdx),
      notes: cell(row, notesIdx),
      recruiterText: cell(row, recruiterIdx),
    }))
    .filter((r) => r.candidateName);
}

export function distinctStatusValues(rows: { status: string }[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.status) set.add(r.status);
  }
  return Array.from(set).sort();
}

export type RoleOption = { id: string; title: string; client: string | null };

export function matchRole(text: string, roles: RoleOption[]): string | null {
  if (!text) return null;
  const normalized = text.trim().toLowerCase();
  const exact = roles.find((r) => r.title.trim().toLowerCase() === normalized);
  if (exact) return exact.id;
  const partial = roles.find((r) => {
    const title = r.title.trim().toLowerCase();
    return title.length > 3 && (normalized.includes(title) || title.includes(normalized));
  });
  return partial ? partial.id : null;
}

export type RecruiterOption = { id: string; name: string };

export function matchRecruiter(text: string, recruiters: RecruiterOption[]): string | null {
  if (!text) return null;
  const normalized = text.trim().toLowerCase();
  const exact = recruiters.find((r) => r.name.trim().toLowerCase() === normalized);
  return exact ? exact.id : null;
}

export function computeDedupeKey(vendorId: string, candidateName: string, roleId: string, date: string): string {
  const normalized = `${vendorId}::${candidateName.trim().toLowerCase()}::${roleId}::${date}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export type StatusTarget = "INTERVIEW" | "OFFER" | "JOINED" | "REJECTED" | "DROPOUT" | "NONE";
export type StatusMapping = Record<string, StatusTarget>;

export const STATUS_TARGET_OPTIONS: { value: StatusTarget; label: string }[] = [
  { value: "NONE", label: "No change / unrecognized" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "JOINED", label: "Joined" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DROPOUT", label: "Dropout" },
];

export type RowClassification = "NEW" | "UPDATE_STAGE" | "DUPLICATE_SKIP" | "UNMATCHED_ROLE" | "ERROR";

export type ResolvedRow = {
  index: number;
  candidateName: string;
  roleText: string;
  matchedRoleId: string | null;
  recruiterText: string;
  matchedRecruiterId: string | null;
  date: string;
  status: string;
  statusTarget: StatusTarget;
  externalRef: string;
  notes: string;
  dedupeKey: string | null;
  classification: RowClassification;
  existingSubmissionId: string | null;
  error: string | null;
};

export type ExistingSubmissionLookup = Map<string, { id: string }>;

export function classifyRow(
  row: MappedRow,
  index: number,
  vendorId: string,
  roles: RoleOption[],
  recruiters: RecruiterOption[],
  defaultRecruiterId: string | null,
  statusMapping: StatusMapping,
  existingByDedupeKey: ExistingSubmissionLookup
): ResolvedRow {
  const statusTarget = statusMapping[row.status] ?? "NONE";
  const matchedRecruiterId = matchRecruiter(row.recruiterText, recruiters) ?? defaultRecruiterId;

  const base = {
    index,
    candidateName: row.candidateName,
    roleText: row.roleText,
    recruiterText: row.recruiterText,
    matchedRecruiterId,
    date: row.date,
    status: row.status,
    statusTarget,
    externalRef: row.externalRef,
    notes: row.notes,
  };

  if (!row.candidateName || !row.date) {
    return {
      ...base,
      matchedRoleId: null,
      dedupeKey: null,
      classification: "ERROR",
      existingSubmissionId: null,
      error: !row.candidateName ? "Missing candidate name" : "Missing or unparseable date",
    };
  }

  if (!matchedRecruiterId) {
    return {
      ...base,
      matchedRoleId: null,
      dedupeKey: null,
      classification: "ERROR",
      existingSubmissionId: null,
      error: "No recruiter matched and no default recruiter selected",
    };
  }

  const matchedRoleId = matchRole(row.roleText, roles);
  if (!matchedRoleId) {
    return {
      ...base,
      matchedRoleId: null,
      dedupeKey: null,
      classification: "UNMATCHED_ROLE",
      existingSubmissionId: null,
      error: null,
    };
  }

  const dedupeKey = computeDedupeKey(vendorId, row.candidateName, matchedRoleId, row.date);
  const existing = existingByDedupeKey.get(dedupeKey);

  if (existing) {
    return {
      ...base,
      matchedRoleId,
      dedupeKey,
      classification: statusTarget !== "NONE" ? "UPDATE_STAGE" : "DUPLICATE_SKIP",
      existingSubmissionId: existing.id,
      error: null,
    };
  }

  return {
    ...base,
    matchedRoleId,
    dedupeKey,
    classification: "NEW",
    existingSubmissionId: null,
    error: null,
  };
}
