"use client";

import { useState, useTransition } from "react";
import { logBulkInterviews, type BulkInterviewRow } from "../entry/actions";
import type { InterviewStage } from "@/generated/prisma/enums";

type Option = { id: string; name: string };
type InFlightSubmission = { id: string; candidateName: string; recruiterId: string; role: { title: string } };

const STAGE_OPTIONS: { value: InterviewStage; label: string }[] = [
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
  { value: "MANAGER", label: "Manager" },
  { value: "CLIENT", label: "Client" },
  { value: "HR", label: "HR" },
  { value: "FINAL", label: "Final" },
  { value: "OTHER", label: "Other" },
];

type Row = { submissionId: string; stage: InterviewStage };

const emptyRow = (): Row => ({ submissionId: "", stage: "L1" });

export function InterviewsQuickAdd({
  date,
  recruiters,
  inFlight,
  onDone,
}: {
  date: string;
  recruiters: Option[];
  inFlight: InFlightSubmission[];
  onDone: () => void;
}) {
  const [recruiterId, setRecruiterId] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [pending, startTransition] = useTransition();

  const candidates = inFlight.filter((s) => s.recruiterId === recruiterId);

  function setRowCount(n: number) {
    const clamped = Math.min(Math.max(n, 1), 20);
    setRows((prev) => {
      const next = prev.slice(0, clamped);
      while (next.length < clamped) next.push(emptyRow());
      return next;
    });
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const canSubmit = recruiterId && rows.every((r) => r.submissionId && r.stage);

  function submit() {
    const payload: BulkInterviewRow[] = rows.map((r) => ({ submissionId: r.submissionId, stage: r.stage }));
    startTransition(async () => {
      await logBulkInterviews(date, payload);
      onDone();
    });
  }

  if (!recruiterId) {
    return (
      <div>
        <p className="text-sm text-slate-600 mb-3">Whose interviews are these?</p>
        <div className="grid grid-cols-2 gap-2">
          {recruiters.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRecruiterId(r.id);
                setRows([emptyRow()]);
              }}
              className="glass rounded-lg px-3 py-2 text-sm text-left text-slate-800 hover:bg-white/70 transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const recruiterName = recruiters.find((r) => r.id === recruiterId)?.name;

  if (candidates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Recruiter: <span className="font-medium text-slate-900">{recruiterName}</span>
          </span>
          <button onClick={() => setRecruiterId("")} className="text-xs text-slate-500 hover:text-slate-900">
            Change
          </button>
        </div>
        <p className="text-sm text-slate-400 py-4 text-center">
          No in-flight candidates for this recruiter yet — log a submission first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Recruiter: <span className="font-medium text-slate-900">{recruiterName}</span>
        </span>
        <button onClick={() => setRecruiterId("")} className="text-xs text-slate-500 hover:text-slate-900">
          Change
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-700" htmlFor="interview-count">
          Number of interviews
        </label>
        <input
          id="interview-count"
          type="number"
          min={1}
          max={20}
          value={rows.length}
          onChange={(e) => setRowCount(Number(e.target.value) || 1)}
          className="w-16 rounded-md border border-slate-300 bg-white/70 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <div key={i} className="glass rounded-lg p-3 flex flex-wrap items-center gap-2">
            <select
              value={row.submissionId}
              onChange={(e) => updateRow(i, { submissionId: e.target.value })}
              className="flex-1 min-w-[12rem] rounded-md border border-slate-300 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Candidate…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidateName} — {c.role.title}
                </option>
              ))}
            </select>
            <select
              value={row.stage}
              onChange={(e) => updateRow(i, { stage: e.target.value as InterviewStage })}
              className="rounded-md border border-slate-300 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        disabled={!canSubmit || pending}
        onClick={submit}
        className="w-full rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : `Save ${rows.length} interview${rows.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
