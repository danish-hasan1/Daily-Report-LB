"use client";

import { useState, useTransition } from "react";
import { advanceStage, dismissReview } from "./actions";
import type { ReasonCategory } from "@/generated/prisma/enums";

const REASONS: { value: ReasonCategory; label: string }[] = [
  { value: "CLIENT_REJECTED", label: "Client Rejected" },
  { value: "CANDIDATE_DECLINED", label: "Candidate Declined" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "SALARY_MISMATCH", label: "Salary Mismatch" },
  { value: "POSITION_ON_HOLD", label: "Position On Hold" },
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
  const [expanded, setExpanded] = useState<"REJECTED" | "DROPOUT" | null>(null);
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory | "">("");
  const [reason, setReason] = useState("");

  function advance(type: "INTERVIEW" | "OFFER" | "JOINED") {
    startTransition(() => advanceStage(submissionId, { type, date }));
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
      <button disabled={pending} onClick={() => advance("INTERVIEW")} className="text-slate-600 hover:text-slate-900 disabled:opacity-50">
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
