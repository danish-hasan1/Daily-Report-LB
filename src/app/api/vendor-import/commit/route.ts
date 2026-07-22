import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeDedupeKey, type ResolvedRow } from "@/lib/vendor-import";

type CommitRow = ResolvedRow & { skip?: boolean };

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { vendorId, fileName, mapping, statusMapping, rows, saveMapping } = body as {
    vendorId: string;
    fileName: string;
    mapping: unknown;
    statusMapping: unknown;
    rows: CommitRow[];
    saveMapping?: boolean;
  };

  if (!vendorId || !fileName || !Array.isArray(rows)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let unmatched = 0;
  const createdKeys = new Set<string>();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.vendorImportBatch.create({
      data: { vendorId, fileName, columnMapping: { mapping, statusMapping } as object },
    });

    for (const row of rows) {
      if (row.skip) {
        skipped += 1;
        continue;
      }

      if (row.classification === "DUPLICATE_SKIP") {
        skipped += 1;
        continue;
      }

      if (row.classification === "UPDATE_STAGE" && row.existingSubmissionId) {
        const suggestion = `Vendor sheet (${fileName}, ${row.date}) suggests stage: ${row.statusTarget}`;
        const existing = await tx.submission.findUnique({
          where: { id: row.existingSubmissionId },
          select: { notes: true },
        });
        await tx.submission.update({
          where: { id: row.existingSubmissionId },
          data: {
            needsReview: true,
            notes: existing?.notes ? `${existing.notes}\n${suggestion}` : suggestion,
            importBatchId: batch.id,
          },
        });
        updated += 1;
        continue;
      }

      if (!row.matchedRoleId || !row.matchedRecruiterId || !row.date) {
        unmatched += 1;
        continue;
      }

      const dedupeKey = row.dedupeKey ?? computeDedupeKey(vendorId, row.candidateName, row.matchedRoleId, row.date);
      if (createdKeys.has(dedupeKey)) {
        skipped += 1;
        continue;
      }

      const dateObj = new Date(`${row.date}T00:00:00`);

      await tx.submission.create({
        data: {
          candidateName: row.candidateName,
          date: dateObj,
          sourceType: "VENDOR",
          recruiterId: row.matchedRecruiterId,
          roleId: row.matchedRoleId,
          vendorId,
          externalRef: row.externalRef || null,
          notes: row.notes || null,
          dedupeKey,
          importBatchId: batch.id,
          needsReview: row.statusTarget !== "NONE",
          stageEvents: { create: { type: "SUBMITTED", date: dateObj } },
        },
      });
      createdKeys.add(dedupeKey);
      created += 1;
    }

    await tx.vendorImportBatch.update({
      where: { id: batch.id },
      data: { createdCount: created, updatedCount: updated, skippedCount: skipped, unmatchedCount: unmatched },
    });

    if (saveMapping) {
      await tx.vendor.update({
        where: { id: vendorId },
        data: { columnMapping: { mapping, statusMapping } as object },
      });
    }
  });

  revalidatePath("/entry");
  revalidatePath("/reports");
  revalidatePath("/vendors");
  revalidatePath("/");

  return NextResponse.json({ created, updated, skipped, unmatched });
}
