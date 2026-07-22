"use client";

import { useTransition } from "react";
import { deleteSubmission } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Remove this submission? This deletes its whole stage history.")) {
          startTransition(() => deleteSubmission(id));
        }
      }}
      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
    >
      Remove
    </button>
  );
}
