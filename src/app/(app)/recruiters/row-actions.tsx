"use client";

import { useTransition } from "react";
import { toggleRecruiterActive, deleteRecruiter } from "./actions";

export function RecruiterRowActions({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        disabled={pending}
        onClick={() => startTransition(() => toggleRecruiterActive(id, !active))}
        className="text-slate-600 hover:text-slate-900 disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Remove this recruiter? If they have entries, they will be deactivated instead of deleted.")) {
            startTransition(() => deleteRecruiter(id));
          }
        }}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
