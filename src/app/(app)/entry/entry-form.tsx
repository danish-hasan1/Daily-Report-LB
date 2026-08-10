"use client";

import { useState, useTransition } from "react";
import { addActivities } from "./actions";

type Option = { id: string; name: string };

type DraftEntry = {
  key: string;
  type: "SUBMISSION" | "INTERVIEW";
  roleId: string;
  sourceType: "INTERNAL" | "VENDOR";
  vendorId: string | null;
  notes: string;
};

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
  const [rows, setRows] = useState<DraftEntry[]>([]);
  const [type, setType] = useState<"SUBMISSION" | "INTERVIEW">("SUBMISSION");
  const [sourceType, setSourceType] = useState<"INTERNAL" | "VENDOR">("INTERNAL");
  const [roleId, setRoleId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");

  const recruiterName = recruiters.find((r) => r.id === recruiterId)?.name ?? "";
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "";
  const vendorName = (id: string | null) => (id ? vendors.find((v) => v.id === id)?.name ?? "" : "");

  function addRow() {
    if (!roleId) return;
    if (sourceType === "VENDOR" && !vendorId) return;
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        type,
        roleId,
        sourceType,
        vendorId: sourceType === "VENDOR" ? vendorId : null,
        notes: notes.trim(),
      },
    ]);
    setRoleId("");
    setVendorId("");
    setNotes("");
    setSavedMessage("");
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function resetRowFields() {
    setRows([]);
    setRoleId("");
    setVendorId("");
    setNotes("");
    setType("SUBMISSION");
    setSourceType("INTERNAL");
  }

  function handleRecruiterChange(newId: string) {
    if (rows.length > 0 && newId !== recruiterId) {
      resetRowFields();
    }
    setRecruiterId(newId);
    setSavedMessage("");
  }

  function saveAll() {
    if (rows.length === 0 || !recruiterId) return;
    const savedCount = rows.length;
    const savedFor = recruiterName;
    startTransition(async () => {
      await addActivities(
        rows.map((r) => ({
          date,
          recruiterId,
          type: r.type,
          roleId: r.roleId,
          sourceType: r.sourceType,
          vendorId: r.vendorId,
          notes: r.notes || null,
        }))
      );
      resetRowFields();
      setSavedMessage(`Saved ${savedCount} ${savedCount === 1 ? "entry" : "entries"} for ${savedFor}.`);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recruiterId">
          Recruiter
        </label>
        <select
          id="recruiterId"
          value={recruiterId}
          onChange={(e) => handleRecruiterChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Select recruiter…</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {recruiterId && (
          <p className="text-xs text-slate-400 mt-1">
            Stays selected for the next entries — pick a different recruiter above anytime.
          </p>
        )}
      </div>

      {recruiterId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="roleId">
                Role
              </label>
              <select
                id="roleId"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">
                Notes (optional)
              </label>
              <input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. candidate name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
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
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
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

          <button
            type="button"
            onClick={addRow}
            disabled={!roleId || (sourceType === "VENDOR" && !vendorId)}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 disabled:opacity-50"
          >
            + Add another entry
          </button>

          {rows.length > 0 && (
            <div className="border border-slate-100 rounded-md divide-y divide-slate-100">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-600">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                        r.type === "SUBMISSION" ? "bg-blue-500" : "bg-amber-500"
                      }`}
                    />
                    {r.type === "SUBMISSION" ? "Submission" : "Interview"} · {roleName(r.roleId)}
                    {" — "}
                    {r.sourceType === "INTERNAL" ? "Internal" : vendorName(r.vendorId)}
                    {r.notes ? ` (${r.notes})` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    className="text-slate-400 hover:text-red-600 text-xs shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={saveAll}
            disabled={rows.length === 0 || pending}
            className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {pending
              ? "Saving..."
              : rows.length === 0
                ? "Add at least one entry to save"
                : `Save ${rows.length} ${rows.length === 1 ? "entry" : "entries"} for ${recruiterName}`}
          </button>
        </>
      )}

      {savedMessage && <p className="text-sm text-green-600">{savedMessage}</p>}
    </div>
  );
}
