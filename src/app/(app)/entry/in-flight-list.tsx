import { prisma } from "@/lib/prisma";
import { InFlightRowActions } from "./in-flight-row-actions";

const STAGE_STYLES: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-600",
  INTERVIEWING: "bg-amber-100 text-amber-700",
  OFFER: "bg-blue-100 text-blue-700",
};

const STAGE_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
};

const INTERVIEW_STAGE_STYLES: Record<string, string> = {
  L1: "bg-amber-100 text-amber-700",
  L2: "bg-orange-100 text-orange-700",
  L3: "bg-orange-200 text-orange-800",
  MANAGER: "bg-indigo-100 text-indigo-700",
  CLIENT: "bg-purple-100 text-purple-700",
  HR: "bg-teal-100 text-teal-700",
  FINAL: "bg-blue-100 text-blue-700",
  OTHER: "bg-slate-100 text-slate-600",
};

const INTERVIEW_STAGE_LABEL: Record<string, string> = {
  L1: "L1",
  L2: "L2",
  L3: "L3",
  MANAGER: "Manager",
  CLIENT: "Client",
  HR: "HR",
  FINAL: "Final",
  OTHER: "Other",
};

function daysSince(date: Date) {
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export async function InFlightList({ date }: { date: string }) {
  const submissions = await prisma.submission.findMany({
    where: { stage: { notIn: ["JOINED", "REJECTED", "DROPOUT"] } },
    include: { recruiter: true, role: true, vendor: true },
    orderBy: [{ needsReview: "desc" }, { stageChangedAt: "asc" }],
  });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">In-flight submissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every candidate not yet joined, rejected, or dropped out — advance them here as they progress.
          </p>
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">{submissions.length} active</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-white/40 text-slate-500 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Candidate</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Recruiter</th>
            <th className="px-4 py-2 font-medium">Source</th>
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-4 py-2 font-medium text-right">Days</th>
            <th className="px-4 py-2 font-medium text-right">Advance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/50">
          {submissions.map((s) => (
            <tr key={s.id} className={s.needsReview ? "bg-amber-50" : undefined}>
              <td className="px-4 py-2.5 text-slate-900">
                {s.candidateName}
                {s.needsReview && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-medium align-middle">
                    Needs review
                  </span>
                )}
                {s.needsReview && s.notes && <p className="text-xs text-amber-700 mt-0.5 max-w-xs">{s.notes}</p>}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{s.role.title}</td>
              <td className="px-4 py-2.5 text-slate-600">{s.recruiter.name}</td>
              <td className="px-4 py-2.5 text-slate-600">
                {s.sourceType === "INTERNAL" ? "Self" : s.vendor?.name ?? "Vendor"}
              </td>
              <td className="px-4 py-2.5">
                {s.stage === "INTERVIEWING" && s.currentInterviewStage ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      INTERVIEW_STAGE_STYLES[s.currentInterviewStage]
                    }`}
                  >
                    Interviewing · {INTERVIEW_STAGE_LABEL[s.currentInterviewStage]}
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      STAGE_STYLES[s.stage] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {STAGE_LABEL[s.stage] ?? s.stage}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-500">{daysSince(s.stageChangedAt)}</td>
              <td className="px-4 py-2.5 text-right">
                <InFlightRowActions submissionId={s.id} date={date} needsReview={s.needsReview} />
              </td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                Nothing in flight — every tracked candidate has joined, been rejected, or dropped out.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
