import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary diagnostic endpoint. Runs one simple query and returns the real
// database error text (which Vercel otherwise hides behind a generic page),
// so connection / missing-table / auth issues can be identified quickly.
// This route is behind the same password gate as the rest of the app.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [recruiters, submissions] = await Promise.all([
      prisma.recruiter.count(),
      prisma.submission.count(),
    ]);
    return NextResponse.json({ ok: true, recruiters, submissions });
  } catch (e) {
    const err = e as { name?: string; message?: string; code?: string };
    return NextResponse.json(
      {
        ok: false,
        name: err.name ?? null,
        code: err.code ?? null,
        message: err.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
