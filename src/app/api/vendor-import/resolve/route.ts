import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseWorkbookBuffer,
  applyColumnMapping,
  classifyRow,
  type ColumnMapping,
  type StatusMapping,
} from "@/lib/vendor-import";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const vendorId = String(formData.get("vendorId") ?? "");
  const mappingRaw = String(formData.get("mapping") ?? "");
  const statusMappingRaw = String(formData.get("statusMapping") ?? "");
  const defaultRecruiterId = String(formData.get("defaultRecruiterId") ?? "") || null;

  if (!(file instanceof File) || !vendorId || !mappingRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let mapping: ColumnMapping;
  let statusMapping: StatusMapping;
  try {
    mapping = JSON.parse(mappingRaw);
    statusMapping = statusMappingRaw ? JSON.parse(statusMappingRaw) : {};
  } catch {
    return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }

  const [roles, recruiters] = await Promise.all([
    prisma.role.findMany({ select: { id: true, title: true, client: true } }),
    prisma.recruiter.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const buffer = Buffer.from(await file.arrayBuffer());
  const sheet = await parseWorkbookBuffer(buffer, file.name);
  const mappedRows = applyColumnMapping(sheet, mapping);

  const existingSubmissions = await prisma.submission.findMany({
    where: { vendorId, dedupeKey: { not: null } },
    select: { id: true, dedupeKey: true },
  });
  const existingByDedupeKey = new Map(
    existingSubmissions.filter((s) => s.dedupeKey).map((s) => [s.dedupeKey as string, { id: s.id }])
  );

  const rows = mappedRows.map((row, i) =>
    classifyRow(row, i, vendorId, roles, recruiters, defaultRecruiterId, statusMapping, existingByDedupeKey)
  );

  return NextResponse.json({ rows });
}
