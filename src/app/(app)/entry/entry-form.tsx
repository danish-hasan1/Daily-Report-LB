"use client";

import { useRef, useState } from "react";
import { createSubmission } from "./actions";

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
  const [recruiterId, setRecruiterId] = useState("");
  const [sourceType, setSourceType] = useState<"INTERNAL" | "VENDOR">("INTERNAL");
  const candidateNameRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={async (formData) => {
        await createSubmission(formData);
        setSourceType("INTERNAL");
        candidateNameRef.current?.focus();
      }}
      className="glass rounded-2xl p-4 space-y-4"
    >
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="recruiterId" value={recruiterId} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recruiterPicker">
          Recruiter
        </label>
        <select
          id="recruiterPicker"
          required
          value={recruiterId}
          onChange={(e) => setRecruiterId(e.target.value)}
          className="w-full sm:w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Select recruiter…</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          Stays selected so you can log several candidates for the same recruiter in a row.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="candidateName">
            Candidate name
          </label>
          <input
            ref={candidateNameRef}
            id="candidateName"
            name="candidateName"
            required
            autoFocus
            placeholder="e.g. Priya Sharma"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
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
              {s === "INTERNAL" ? "Self-sourced" : "Vendor"}
            </label>
          ))}
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
          placeholder="e.g. profile link, CTC"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={!recruiterId}
        className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add submission
      </button>
    </form>
  );
}
