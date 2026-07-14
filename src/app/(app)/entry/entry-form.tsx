"use client";

import { useState } from "react";
import { addActivity } from "./actions";

type Option = { id: string; name: string };

export function EntryForm({
  date,
  recruiters,
  vendors,
  roles,
}: {
  date: string;
  recruiters: Option[];
  vendors: Option[];
  roles: Option[];
}) {
  const [sourceType, setSourceType] = useState<"INTERNAL" | "VENDOR">("INTERNAL");
  const [type, setType] = useState<"SUBMISSION" | "INTERVIEW">("SUBMISSION");

  return (
    <form
      action={async (formData) => {
        await addActivity(formData);
        setSourceType("INTERNAL");
        setType("SUBMISSION");
      }}
      className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
    >
      <input type="hidden" name="date" value={date} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recruiterId">
            Recruiter
          </label>
          <select
            id="recruiterId"
            name="recruiterId"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="roleId">
            Role
          </label>
          <select
            id="roleId"
            name="roleId"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">Type</span>
          <div className="flex rounded-md border border-slate-300 overflow-hidden w-fit">
            {(["SUBMISSION", "INTERVIEW"] as const).map((t) => (
              <label
                key={t}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  type === t ? "bg-slate-900 text-white" : "bg-white text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="sr-only"
                />
                {t === "SUBMISSION" ? "Submission" : "Interview"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">Source</span>
          <div className="flex rounded-md border border-slate-300 overflow-hidden w-fit">
            {(["INTERNAL", "VENDOR"] as const).map((s) => (
              <label
                key={s}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  sourceType === s ? "bg-slate-900 text-white" : "bg-white text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="sourceType"
                  value={s}
                  checked={sourceType === s}
                  onChange={() => setSourceType(s)}
                  className="sr-only"
                />
                {s === "INTERNAL" ? "Internal" : "Vendor"}
              </label>
            ))}
          </div>
        </div>
      </div>

      {sourceType === "VENDOR" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="vendorId">
            Vendor
          </label>
          <select
            id="vendorId"
            name="vendorId"
            required={sourceType === "VENDOR"}
            className="w-full sm:w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select vendor…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">
          Notes (optional)
        </label>
        <input
          id="notes"
          name="notes"
          placeholder="e.g. candidate name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
      >
        Add entry
      </button>
    </form>
  );
}
