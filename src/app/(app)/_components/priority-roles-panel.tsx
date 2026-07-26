"use client";

import { useState, useTransition } from "react";
import { GlassPanel } from "@/components/glass";
import { PriorityRoleModal } from "./priority-role-modal";
import { setPriorityRoleActive } from "../priority-roles/actions";
import type { getActivePriorityRoles } from "@/lib/dashboard";

type Option = { id: string; name: string };
type PriorityRoleRow = Awaited<ReturnType<typeof getActivePriorityRoles>>[number];

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function PriorityRolesPanel({
  priorityRoles,
  roles,
  recruiters,
}: {
  priorityRoles: PriorityRoleRow[];
  roles: Option[];
  recruiters: Option[];
}) {
  const [modalFor, setModalFor] = useState<"new" | PriorityRoleRow | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <GlassPanel
        title="Priority roles"
        description="Discussed every morning — stays visible while active."
        action={
          <button
            onClick={() => setModalFor("new")}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 glass rounded-full px-3 py-1"
          >
            + Add
          </button>
        }
      >
        {priorityRoles.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No active priority roles right now.</p>
        ) : (
          <div className="divide-y divide-white/50">
            {priorityRoles.map((pr) => (
              <div key={pr.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">{pr.role.title}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        PRIORITY_STYLES[pr.priority]
                      }`}
                    >
                      {PRIORITY_LABEL[pr.priority]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{pr.recruiter.name}</p>
                  {pr.notes && <p className="text-xs text-slate-600 mt-1">{pr.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 text-xs">
                  <button onClick={() => setModalFor(pr)} className="text-slate-500 hover:text-slate-900">
                    Edit
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => startTransition(() => setPriorityRoleActive(pr.id, false))}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {modalFor && (
        <PriorityRoleModal
          roles={roles}
          recruiters={recruiters}
          existing={
            modalFor === "new"
              ? undefined
              : {
                  id: modalFor.id,
                  roleId: modalFor.roleId,
                  recruiterId: modalFor.recruiterId,
                  priority: modalFor.priority,
                  notes: modalFor.notes,
                }
          }
          onClose={() => setModalFor(null)}
        />
      )}
    </>
  );
}
