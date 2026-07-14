"use client";

import { useTransition } from "react";
import { updateRoleStatus, deleteRole } from "./actions";
import type { RoleStatus } from "@/generated/prisma/enums";

const statuses: RoleStatus[] = ["OPEN", "ON_HOLD", "FILLED", "CLOSED"];

export function RoleRowActions({ id, status }: { id: string; status: RoleStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-sm">
      <select
        disabled={pending}
        value={status}
        onChange={(e) => startTransition(() => updateRoleStatus(id, e.target.value as RoleStatus))}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Remove this role? If it has entries, it will be marked Closed instead of deleted.")) {
            startTransition(() => deleteRole(id));
          }
        }}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
