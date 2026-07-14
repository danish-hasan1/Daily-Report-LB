"use client";

import { useRouter } from "next/navigation";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function RangePicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();

  function update(next: { from?: string; to?: string }) {
    const params = new URLSearchParams({ from, to, ...next });
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => update({ from: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <span className="text-slate-400 text-sm">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => update({ to: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <button
        onClick={() => update({ from: firstOfMonth(), to: todayIso() })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        This month
      </button>
      <a
        href={`/api/export?from=${from}&to=${to}`}
        className="ml-auto rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-slate-800"
      >
        Download Excel
      </a>
    </div>
  );
}
