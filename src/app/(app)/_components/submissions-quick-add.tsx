"use client";

import { useState, useTransition } from "react";
import { createBulkSubmissions, type BulkSubmissionRow } from "../entry/actions";

type Option = { id: string; name: string };

type Row = { candidateName: string; roleId: string; sourceType: "INTERNAL" | "VENDOR"; vendorId: string };

const emptyRow = (): Row => ({ candidateName: "", roleId: "", sourceType: "INTERNAL", vendorId: "" });

export function SubmissionsQuickAdd({
  date,
  recruiters,
  roles,
  vendors,
  onDone,
}: {
  date: string;
  recruiters: Option[];
  roles: Option[];
  vendors: Option[];
  onDone: () => void;
}) {
  const [recruiterId, setRecruiterId] = useState("");
  const [count, setCount] = useState(1);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [pending, startTransition] = useTransition();

  function setRowCount(n: number) {
    const clamped = Math.min(Math.max(n, 1), 20);
    setCount(clamped);
    setRows((prev) => {
      const next = prev.slice(0, clamped);
      while (next.length < clamped) next.push(emptyRow());
      return next;
    });
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const canSubmit =
    recruiterId &&
    rows.every((r) => r.candidateName.trim() && r.roleId && (r.sourceType === "INTERNAL" || r.vendorId));

  function submit() {
    const payload: BulkSubmissionRow[] = rows.map((r) => ({
      candidateName: r.candidateName,
      roleId: r.roleId,
      sourceType: r.sourceType,
      vendorId: r.sourceType === "VENDOR" ? r.vendorId : null,
    }));
    startTransition(async () => {
      await createBulkSubmissions(recruiterId, date, payload);
      onDone();
    });
  }

  if (!recruiterId) {
    return (
      <div>
        <p className="text-sm text-slate-600 mb-3">Who&apos;s submitting?</p>
        <div className="grid grid-cols-2 gap-2">
          {recruiters.map((r) => (
            <button
              key={r.id}
              onClick={() => setRecruiterId(r.id)}
              className="glass rounded-lg px-3 py-2 text-sm text-left text-slate-800 hover:bg-white/70 transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
        {recruiters.length === 0 && <p className="text-sm text-slate-400">No active recruiters yet.</p>}
      </div>
    );
  }

  const recruiterName = recruiters.find((r) => r.id === recruiterId)?.name;

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
        <label className="text-sm text-slate-700" htmlFor="count">
          Number of submissions
        </label>
        <input
          id="count"
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setRowCount(Number(e.target.value) || 1)}
          className="w-16 rounded-md border border-slate-300 bg-white/70 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <div key={i} className="glass rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">Candidate #{i + 1}</div>
            <input
              placeholder="Candidate name"
              value={row.candidateName}
              onChange={(e) => updateRow(i, { candidateName: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={row.roleId}
                onChange={(e) => updateRow(i, { roleId: e.target.value })}
                className="flex-1 min-w-[10rem] rounded-md border border-slate-300 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="flex rounded-md border border-slate-300 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => updateRow(i, { sourceType: "INTERNAL", vendorId: "" })}
                  className={`px-2 py-1.5 ${
                    row.sourceType === "INTERNAL" ? "bg-slate-900 text-white" : "bg-white/70 text-slate-600"
                  }`}
                >
                  🧑 Self
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(i, { sourceType: "VENDOR" })}
                  className={`px-2 py-1.5 ${
                    row.sourceType === "VENDOR" ? "bg-slate-900 text-white" : "bg-white/70 text-slate-600"
                  }`}
                >
                  🏷️ Vendor
                </button>
              </div>

              {row.sourceType === "VENDOR" && (
                <select
                  value={row.vendorId}
                  onChange={(e) => updateRow(i, { vendorId: e.target.value })}
                  className="flex-1 min-w-[8rem] rounded-md border border-slate-300 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!canSubmit || pending}
        onClick={submit}
        className="w-full rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : `Save ${rows.length} submission${rows.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
