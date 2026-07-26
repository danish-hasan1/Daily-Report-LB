import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFunnelDataInRange, summarize, byRecruiter } from "@/lib/reports";
import { getActivePriorityRoles, getAllInFlight } from "@/lib/dashboard";
import { GlassCard, GlassPanel } from "@/components/glass";
import { QuickAddButton } from "./_components/quick-add-button";
import { PriorityRolesPanel } from "./_components/priority-roles-panel";

// Always render on demand — this view reflects live database state and must
// not be prerendered (which would also require a DB connection at build time).
export const dynamic = "force-dynamic";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </GlassCard>
  );
}

export default async function DashboardPage() {
  const today = todayIso();
  const monthStart = firstOfMonth();

  const [
    todayData,
    monthData,
    openRoles,
    activeRecruiters,
    recruiters,
    roles,
    vendors,
    priorityRoles,
    inFlight,
  ] = await Promise.all([
    getFunnelDataInRange({ from: today, to: today }),
    getFunnelDataInRange({ from: monthStart, to: today }),
    prisma.role.count({ where: { status: "OPEN" } }),
    prisma.recruiter.count({ where: { active: true } }),
    prisma.recruiter.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { status: { in: ["OPEN", "ON_HOLD"] } }, orderBy: { title: "asc" } }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getActivePriorityRoles(),
    getAllInFlight(),
  ]);

  const todaySummary = summarize(todayData.submissions, todayData.stageEvents);
  const monthSummary = summarize(monthData.submissions, monthData.stageEvents);
  const monthByRecruiter = byRecruiter(monthData.submissions, monthData.stageEvents);

  const recruiterOptions = recruiters.map((r) => ({ id: r.id, name: r.name }));
  const roleOptions = roles.map((r) => ({ id: r.id, name: r.client ? `${r.title} — ${r.client}` : r.title }));
  const vendorOptions = vendors.map((v) => ({ id: v.id, name: v.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <QuickAddButton
          date={today}
          recruiters={recruiterOptions}
          roles={roleOptions}
          vendors={vendorOptions}
          inFlight={inFlight.map((s) => ({
            id: s.id,
            candidateName: s.candidateName,
            recruiterId: s.recruiterId,
            role: { title: s.role.title },
          }))}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Submissions" value={todaySummary.totalSubmissions} />
          <StatCard label="Internal" value={todaySummary.internalSubmissions} />
          <StatCard label="Vendor" value={todaySummary.vendorSubmissions} />
          <StatCard label="Interviews" value={todaySummary.totalInterviews} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Month to date</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Submissions" value={monthSummary.totalSubmissions} />
          <StatCard label="Open Roles" value={openRoles} />
          <StatCard label="Interviews" value={monthSummary.totalInterviews} />
          <StatCard label="Active Recruiters" value={activeRecruiters} />
        </div>
      </div>

      <PriorityRolesPanel priorityRoles={priorityRoles} roles={roleOptions} recruiters={recruiterOptions} />

      <GlassPanel
        title="Month to date by recruiter"
        action={
          <Link href="/reports" className="text-xs text-slate-500 hover:text-slate-900">
            Full reports →
          </Link>
        }
      >
        <table className="w-full text-sm">
          <thead className="bg-white/40 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Recruiter</th>
              <th className="px-4 py-2 font-medium text-right">Subs</th>
              <th className="px-4 py-2 font-medium text-right">Internal</th>
              <th className="px-4 py-2 font-medium text-right">Vendor</th>
              <th className="px-4 py-2 font-medium text-right">Interviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50">
            {monthByRecruiter.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-slate-900">{r.name}</td>
                <td className="px-4 py-2 text-right">{r.submissions}</td>
                <td className="px-4 py-2 text-right text-slate-500">{r.internal}</td>
                <td className="px-4 py-2 text-right text-slate-500">{r.vendor}</td>
                <td className="px-4 py-2 text-right">{r.interviews}</td>
              </tr>
            ))}
            {monthByRecruiter.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No entries yet this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
