"use client";

import { useState, useTransition } from "react";
import { GlassModal } from "@/components/glass";
import { upsertPriorityRole } from "../priority-roles/actions";
import type { PriorityLevel } from "@/generated/prisma/enums";

type Option = { id: string; name: string };

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export function PriorityRoleModal({
  roles,
  recruiters,
  existing,
  onClose,
}: {
  roles: Option[];
  recruiters: Option[];
  existing?: { id: string; roleId: string; recruiterId: string; priority: PriorityLevel; notes: string | null };
  onClose: () => void;
}) {
  const [roleId, setRoleId] = useState(existing?.roleId ?? "");
  const [recruiterId, setRecruiterId] = useState(existing?.recruiterId ?? "");
  const [priority, setPriority] = useState<PriorityLevel>(existing?.priority ?? "HIGH");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pending, startTransition] = useTransition();

  const canSubmit = roleId && recruiterId && priority;

  function submit() {
    startTransition(async () => {
      await upsertPriorityRole({ id: existing?.id, roleId, recruiterId, priority, notes });
      onClose();
    });
  }

  return (
    <GlassModal title={existing ? "Edit priority role" : "Add priority role"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="pr-role">
            Role
          </label>
          <select
            id="pr-role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="pr-recruiter">
            Recruiter
          </label>
          <select
            id="pr-recruiter"
            value={recruiterId}
            onChange={(e) => setRecruiterId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select recruiter…</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">Priority</span>
          <div className="flex rounded-md border border-slate-300 overflow-hidden w-fit">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`px-3 py-2 text-sm ${
                  priority === p.value ? "bg-slate-900 text-white" : "bg-white/70 text-slate-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="pr-notes">
            Notes (discussed this morning)
          </label>
          <textarea
            id="pr-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. client wants 3 more candidates by Friday"
            className="w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <button
          disabled={!canSubmit || pending}
          onClick={submit}
          className="w-full rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : existing ? "Save changes" : "Add to priority list"}
        </button>
      </div>
    </GlassModal>
  );
}
