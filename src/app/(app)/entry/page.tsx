import { prisma } from "@/lib/prisma";
import { DatePicker } from "./date-picker";
import { EntryForm } from "./entry-form";
import { DeleteButton } from "./delete-button";
import { InFlightList } from "./in-flight-list";

const STAGE_LABEL: Record<string, string> = {
  SUBMITTED: "Submission",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  JOINED: "Joined",
  REJECTED: "Rejected",
  DROPOUT: "Dropout",
};

const STAGE_DOT: Record<string, string> = {
  SUBMITTED: "bg-blue-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-purple-500",
  JOINED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  DROPOUT: "bg-slate-400",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayIso();

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const [recruiters, vendors, roles, stageEvents] = await Promise.all([
    prisma.recruiter.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.role.findMany({
      where: { status: { in: ["OPEN", "ON_HOLD"] } },
      orderBy: { title: "asc" },
    }),
    prisma.stageEvent.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      include: { submission: { include: { recruiter: true, role: true, vendor: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byRecruiter = new Map<string, { name: string; entries: typeof stageEvents }>();
  for (const e of stageEvents) {
    const key = e.submission.recruiterId;
    if (!byRecruiter.has(key)) byRecruiter.set(key, { name: e.submission.recruiter.name, entries: [] });
    byRecruiter.get(key)!.entries.push(e);
  }

  const teamSubmissions = stageEvents.filter((e) => e.type === "SUBMITTED").length;
  const teamInterviews = stageEvents.filter((e) => e.type === "INTERVIEW").length;
  const teamOffers = stageEvents.filter((e) => e.type === "OFFER").length;
  const teamJoins = stageEvents.filter((e) => e.type === "JOINED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Daily Entry</h1>
          <p className="text-slate-500 text-sm mt-1">
            Log new submissions and advance existing candidates during the evening summary.
          </p>
        </div>
        <DatePicker date={date} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntryForm
          date={date}
          recruiters={recruiters.map((r) => ({ id: r.id, name: r.name }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          roles={roles.map((r) => ({ id: r.id, name: r.client ? `${r.title} — ${r.client}` : r.title }))}
        />

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {new Date(dayStart).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <span className="text-xs text-slate-500">
              {teamSubmissions} submissions · {teamInterviews} interviews · {teamOffers} offers · {teamJoins} joins
            </span>
          </div>

          {byRecruiter.size === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">No entries logged for this date yet.</p>
          )}

          <div className="space-y-4">
            {Array.from(byRecruiter.entries()).map(([recruiterId, group]) => {
              const subs = group.entries.filter((e) => e.type === "SUBMITTED");
              const others = group.entries.filter((e) => e.type !== "SUBMITTED");
              const internalSubs = subs.filter((e) => e.submission.sourceType === "INTERNAL").length;
              const vendorSubs = subs.filter((e) => e.submission.sourceType === "VENDOR").length;

              return (
                <div key={recruiterId} className="border border-slate-100 rounded-md p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-slate-900 text-sm">{group.name}</span>
                    <span className="text-xs text-slate-500">
                      {subs.length} submissions ({internalSubs} self, {vendorSubs} vendor)
                      {others.length > 0 ? ` · ${others.length} stage update${others.length === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {group.entries.map((e) => (
                      <li key={e.id} className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${STAGE_DOT[e.type]}`} />
                          {STAGE_LABEL[e.type]} · {e.submission.candidateName} — {e.submission.role.title}
                          {" ("}
                          {e.submission.sourceType === "INTERNAL" ? "Self" : e.submission.vendor?.name ?? "Vendor"}
                          {")"}
                          {e.type === "SUBMITTED" && e.submission.notes ? ` — ${e.submission.notes}` : ""}
                        </span>
                        {e.type === "SUBMITTED" && <DeleteButton id={e.submission.id} />}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <InFlightList date={date} />
    </div>
  );
}
