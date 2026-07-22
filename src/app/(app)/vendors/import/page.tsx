import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportWizard } from "./import-wizard";

export const dynamic = "force-dynamic";

export default async function VendorImportPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  const { vendorId } = await searchParams;

  const [vendors, recruiters, roles] = await Promise.all([
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.recruiter.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ orderBy: { title: "asc" } }),
  ]);

  const initialVendorId = vendorId && vendors.some((v) => v.id === vendorId) ? vendorId : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Import Vendor Sheet</h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload a weekly candidate-level sheet to bulk-log vendor submissions instead of typing them in one by
            one.
          </p>
        </div>
        <Link href="/vendors" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to vendors
        </Link>
      </div>

      <ImportWizard
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        recruiters={recruiters.map((r) => ({ id: r.id, name: r.name }))}
        roles={roles.map((r) => ({ id: r.id, name: r.client ? `${r.title} — ${r.client}` : r.title }))}
        initialVendorId={initialVendorId}
      />
    </div>
  );
}
