"use client";

import { useState, useTransition } from "react";
import { advanceStage, dismissReview } from "./actions";
import type { ReasonCategory, InterviewStage } from "@/generated/prisma/enums";

const REASONS: { value: ReasonCategory; label: string }[] = [
  { value: "CLIENT_REJECTED", label: "Client Rejected" },
  { value: "CANDIDATE_DECLINED", label: "Candidate Declined" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "SALARY_MISMATCH", label: "Salary Mismatch" },
  { value: "POSITION_ON_HOLD", label: "Position On Hold" },
  { value: "OTHER", label: "Other" },
];

const INTERVIEW_STAGES: { value: InterviewStage; label: string }[] = [
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
  { value: "MANAGER", label: "Manager" },
  { value: "CLIENT", label: "Client" },
  { value: "HR", label: "HR" },
  { value: "FINAL", label: "Final" },
  { value: "OTHER", label: "Other" },
];

export function InFlightRowActions({
  submissionId,
  date,
  needsReview,
}: {
  submissionId: string;
  date: string;
  needsReview?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<"REJECTED" | "DROPOUT" | "INTERVIEW" | null>(null);
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory | "">("");
  const [reason, setReason] = useState("");
  const [interviewStage, setInterviewStage] = useState<InterviewStage>("L1");

  function advance(type: "OFFER" | "JOINED") {
    startTransition(() => advanceStage(submissionId, { type, date }));
  }

  function submitInterview() {
    startTransition(async () => {
      await advanceStage(submissionId, { type: "INTERVIEW", date, stage: interviewStage });
      setExpanded(null);
    });
  }

  function submitTerminal(type: "REJECTED" | "DROPOUT") {
    if (!reasonCategory) return;
    if (reasonCategory === "OTHER" && !reason.trim()) return;
    startTransition(async () => {
      await advanceStage(submissionId, { type, date, reasonCategory, reason: reason.trim() || undefined });
      setExpanded(null);
      setReasonCategory("");
      setReason("");
    });
  }

  function cancel() {
    setExpanded(null);
    setReasonCategory("");
    setReason("");
  }

  if (expanded === "INTERVIEW") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
        <select
          value={interviewStage}
          onChange={(e) => setInterviewStage(e.target.value as InterviewStage)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {INTERVIEW_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button disabled={pending} onClick={submitInterview} className="text-slate-900 hover:text-slate-700 disabled:opacity-50 font-medium">
          Confirm
        </button>
        <button disabled={pending} onClick={cancel} className="text-slate-500 hover:text-slate-700">
          Cancel
        </button>
      </div>
    );
  }

  if (expanded) {
    const confirmDisabled = pending || !reasonCategory || (reasonCategory === "OTHER" && !reason.trim());
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
        <select
          value={reasonCategory}
          onChange={(e) => setReasonCategory(e.target.value as ReasonCategory)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Reason…</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {reasonCategory === "OTHER" && (
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify…"
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        )}
        <button
          disabled={confirmDisabled}
          onClick={() => submitTerminal(expanded)}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
        >
          Confirm
        </button>
        <button disabled={pending} onClick={cancel} className="text-slate-500 hover:text-slate-700">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      {needsReview && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => dismissReview(submissionId))}
          className="text-amber-700 hover:text-amber-900 disabled:opacity-50"
        >
          Dismiss
        </button>
      )}
      <button disabled={pending} onClick={() => setExpanded("INTERVIEW")} className="text-slate-600 hover:text-slate-900 disabled:opacity-50">
        Interview
      </button>
      <button disabled={pending} onClick={() => advance("OFFER")} className="text-slate-600 hover:text-slate-900 disabled:opacity-50">
        Offer
      </button>
      <button disabled={pending} onClick={() => advance("JOINED")} className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50">
        Join
      </button>
      <button disabled={pending} onClick={() => setExpanded("REJECTED")} className="text-red-600 hover:text-red-800 disabled:opacity-50">
        Reject
      </button>
      <button disabled={pending} onClick={() => setExpanded("DROPOUT")} className="text-amber-600 hover:text-amber-800 disabled:opacity-50">
        Dropout
      </button>
    </div>
  );
}
