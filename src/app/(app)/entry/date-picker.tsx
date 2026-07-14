"use client";

import { useRouter } from "next/navigation";

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DatePicker({ date }: { date: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`/entry?date=${shiftDate(date, -1)}`)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        aria-label="Previous day"
      >
        ←
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => router.push(`/entry?date=${e.target.value}`)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <button
        onClick={() => router.push(`/entry?date=${shiftDate(date, 1)}`)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        aria-label="Next day"
      >
        →
      </button>
      <button
        onClick={() => router.push(`/entry?date=${new Date().toISOString().slice(0, 10)}`)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        Today
      </button>
    </div>
  );
}
