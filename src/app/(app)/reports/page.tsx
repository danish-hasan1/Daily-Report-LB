import { getActivitiesInRange, summarize, byRecruiter, byVendor, byRole, byDay } from "@/lib/reports";
import { RangePicker } from "./range-picker";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : firstOfMonth();
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : todayIso();

  const activities = await getActivitiesInRange({ from, to });
  const summary = summarize(activities);
  const recruiterRows = byRecruiter(activities);
  const vendorRows = byVendor(activities);
  const roleRows = byRole(activities);
  const dayRows = byDay(activities);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review the data on screen, adjust the date range if needed, then download a formatted Excel report.
        </p>
      </div>

      <RangePicker from={from} to={to} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={summary.totalSubmissions} />
        <StatCard label="Internal" value={summary.internalSubmissions} />
        <StatCard label="Vendor" value={summary.vendorSubmissions} />
        <StatCard label="Interviews" value={summary.totalInterviews} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-slate-100">
            By Recruiter
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Recruiter</th>
                <th className="px-4 py-2 font-medium text-right">Subs</th>
                <th className="px-4 py-2 font-medium text-right">Internal</th>
                <th className="px-4 py-2 font-medium text-right">Vendor</th>
                <th className="px-4 py-2 font-medium text-right">Interviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recruiterRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-900">{r.name}</td>
                  <td className="px-4 py-2 text-right">{r.submissions}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.internal}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.vendor}</td>
                  <td className="px-4 py-2 text-right">{r.interviews}</td>
                </tr>
              ))}
              {recruiterRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No data in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-slate-100">
            By Vendor
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium text-right">Submissions</th>
                <th className="px-4 py-2 font-medium text-right">Interviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorRows.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-slate-900">{v.name}</td>
                  <td className="px-4 py-2 text-right">{v.submissions}</td>
                  <td className="px-4 py-2 text-right">{v.interviews}</td>
                </tr>
              ))}
              {vendorRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No vendor submissions in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-slate-100">
          By Role
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium text-right">Submissions</th>
              <th className="px-4 py-2 font-medium text-right">Interviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roleRows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-slate-900">{r.title}</td>
                <td className="px-4 py-2 text-slate-500">{r.client || "—"}</td>
                <td className="px-4 py-2 text-right">{r.submissions}</td>
                <td className="px-4 py-2 text-right">{r.interviews}</td>
              </tr>
            ))}
            {roleRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No data in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-slate-100">
          By Day
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium text-right">Submissions</th>
              <th className="px-4 py-2 font-medium text-right">Interviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dayRows.map((d) => (
              <tr key={d.date}>
                <td className="px-4 py-2 text-slate-900">
                  {new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-2 text-right">{d.submissions}</td>
                <td className="px-4 py-2 text-right">{d.interviews}</td>
              </tr>
            ))}
            {dayRows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No data in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-slate-100">
          Daily Log
        </h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Recruiter</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                    {a.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2 text-slate-900">{a.recruiter.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        a.type === "SUBMISSION" ? "bg-blue-500" : "bg-amber-500"
                      }`}
                    />
                    {a.type === "SUBMISSION" ? "Submission" : "Interview"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {a.role.title}
                    {a.role.client ? ` — ${a.role.client}` : ""}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {a.sourceType === "INTERNAL" ? "Internal" : a.vendor?.name ?? "Vendor"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{a.notes ?? "—"}</td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No entries in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
