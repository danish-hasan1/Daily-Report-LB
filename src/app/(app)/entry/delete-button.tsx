"use client";

import { useTransition } from "react";
import { deleteActivity } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteActivity(id))}
      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
    >
      Remove
    </button>
  );
}
