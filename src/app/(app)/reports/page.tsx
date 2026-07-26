import {
  getFunnelDataInRange,
  summarize,
  byRecruiter,
  byVendor,
  byRole,
  rejectionBreakdown,
  timeToFillInRange,
} from "@/lib/reports";
import { RangePicker } from "./range-picker";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-2xl p-4">
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

  const { submissions, stageEvents } = await getFunnelDataInRange({ from, to });
  const summary = summarize(submissions, stageEvents);
  const recruiterRows = byRecruiter(submissions, stageEvents);
  const vendorRows = byVendor(submissions, stageEvents);
  const roleRows = byRole(submissions, stageEvents);
  const { rows: rejectionRows, total: rejectionTotal } = rejectionBreakdown(stageEvents);
  const { rows: fillRows, avgDays } = await timeToFillInRange({ from, to });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Stats for management — filter by date range and download a formatted Excel report.
        </p>
      </div>

      <RangePicker from={from} to={to} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={summary.totalSubmissions} />
        <StatCard label="Self-sourced" value={summary.internalSubmissions} />
        <StatCard label="Vendor" value={summary.vendorSubmissions} />
        <StatCard label="Interviews" value={summary.totalInterviews} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Offers" value={summary.totalOffers} />
        <StatCard label="Joins" value={summary.totalJoins} />
        <StatCard label="Rejected / Dropout" value={summary.totalRejected + summary.totalDropout} />
        <StatCard label="Avg. Time to Fill" value={fillRows.length ? `${avgDays}d` : "—"} />
      </div>

      <section className="glass rounded-2xl overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">Funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/50">
          {[
            { label: "Submitted", value: summary.totalSubmissions },
            { label: "Interviewed", value: summary.totalInterviews },
            { label: "Offered", value: summary.totalOffers },
            { label: "Joined", value: summary.totalJoins },
          ].map((step) => (
            <div key={step.label} className="px-4 py-3 text-center">
              <p className="text-xs text-slate-500">{step.label}</p>
              <p className="text-xl font-semibold text-slate-900 mt-1">{step.value}</p>
            </div>
          ))}
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Conversion</p>
            <p className="text-xs text-slate-600 mt-1 leading-5">
              Sub→Int {summary.submissionToInterviewRate}%
              <br />
              Int→Offer {summary.interviewToOfferRate}%
              <br />
              Offer→Join {summary.offerToJoinRate}%
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">
            By Recruiter
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-white/40 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Recruiter</th>
                <th className="px-4 py-2 font-medium text-right">Subs</th>
                <th className="px-4 py-2 font-medium text-right">Self</th>
                <th className="px-4 py-2 font-medium text-right">Vendor</th>
                <th className="px-4 py-2 font-medium text-right">Int.</th>
                <th className="px-4 py-2 font-medium text-right">Offers</th>
                <th className="px-4 py-2 font-medium text-right">Joins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {recruiterRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-900">{r.name}</td>
                  <td className="px-4 py-2 text-right">{r.submissions}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.internal}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{r.vendor}</td>
                  <td className="px-4 py-2 text-right">{r.interviews}</td>
                  <td className="px-4 py-2 text-right">{r.offers}</td>
                  <td className="px-4 py-2 text-right">{r.joins}</td>
                </tr>
              ))}
              {recruiterRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No data in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="glass rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">
            By Vendor
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-white/40 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium text-right">Subs</th>
                <th className="px-4 py-2 font-medium text-right">Int.</th>
                <th className="px-4 py-2 font-medium text-right">Offers</th>
                <th className="px-4 py-2 font-medium text-right">Joins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {vendorRows.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-slate-900">{v.name}</td>
                  <td className="px-4 py-2 text-right">{v.submissions}</td>
                  <td className="px-4 py-2 text-right">{v.interviews}</td>
                  <td className="px-4 py-2 text-right">{v.offers}</td>
                  <td className="px-4 py-2 text-right">{v.joins}</td>
                </tr>
              ))}
              {vendorRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No vendor submissions in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">
            Rejection / Dropout Reasons
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-white/40 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium text-right">Count</th>
                <th className="px-4 py-2 font-medium text-right">% of total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {rejectionRows.map((r) => (
                <tr key={`${r.type}-${r.reason}`}>
                  <td className="px-4 py-2 text-slate-900">{r.reason}</td>
                  <td className="px-4 py-2 text-slate-500">{r.type === "REJECTED" ? "Rejected" : "Dropout"}</td>
                  <td className="px-4 py-2 text-right">{r.count}</td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {rejectionTotal ? Math.round((r.count / rejectionTotal) * 100) : 0}%
                  </td>
                </tr>
              ))}
              {rejectionRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No rejections or dropouts in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="glass rounded-2xl overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">
            Time to Fill (roles closed in range)
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-white/40 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium text-right">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {fillRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-900">{r.title}</td>
                  <td className="px-4 py-2 text-slate-500">{r.client || "—"}</td>
                  <td className="px-4 py-2 text-right">{r.days}</td>
                </tr>
              ))}
              {fillRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No roles closed in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="glass rounded-2xl overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-4 py-3 border-b border-white/50">
          By Role
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-white/40 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium text-right">Subs</th>
              <th className="px-4 py-2 font-medium text-right">Int.</th>
              <th className="px-4 py-2 font-medium text-right">Offers</th>
              <th className="px-4 py-2 font-medium text-right">Joins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50">
            {roleRows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 text-slate-900">{r.title}</td>
                <td className="px-4 py-2 text-slate-500">{r.client || "—"}</td>
                <td className="px-4 py-2 text-right">{r.submissions}</td>
                <td className="px-4 py-2 text-right">{r.interviews}</td>
                <td className="px-4 py-2 text-right">{r.offers}</td>
                <td className="px-4 py-2 text-right">{r.joins}</td>
              </tr>
            ))}
            {roleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No data in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
