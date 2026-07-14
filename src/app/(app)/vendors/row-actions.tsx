"use client";

import { useTransition } from "react";
import { toggleVendorActive, deleteVendor } from "./actions";

export function VendorRowActions({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        disabled={pending}
        onClick={() => startTransition(() => toggleVendorActive(id, !active))}
        className="text-slate-600 hover:text-slate-900 disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Remove this vendor? If they have entries, they will be deactivated instead of deleted.")) {
            startTransition(() => deleteVendor(id));
          }
        }}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
