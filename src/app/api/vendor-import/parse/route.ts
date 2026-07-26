import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWorkbookBuffer } from "@/lib/vendor-import";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const vendorId = String(formData.get("vendorId") ?? "");

  if (!(file instanceof File) || !vendorId) {
    return NextResponse.json({ error: "Missing file or vendorId" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sheet = await parseWorkbookBuffer(buffer, file.name);

  return NextResponse.json({
    headers: sheet.headers,
    sampleRows: sheet.rows.slice(0, 20),
    totalRows: sheet.rows.length,
    savedMapping: vendor.columnMapping ?? null,
  });
}
