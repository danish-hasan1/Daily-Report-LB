"use client";

import { useMemo, useState } from "react";
import {
  distinctStatusValues,
  STATUS_TARGET_OPTIONS,
  type ColumnMapping,
  type StatusMapping,
  type StatusTarget,
  type ResolvedRow,
} from "@/lib/vendor-import";

type Option = { id: string; name: string };

type Step = "upload" | "map" | "preview" | "done";

const EMPTY_MAPPING: ColumnMapping = {
  candidateName: "",
  role: "",
  date: "",
  status: "",
  externalRef: "",
  notes: "",
  recruiter: "",
};

const CLASSIFICATION_LABEL: Record<ResolvedRow["classification"], string> = {
  NEW: "New submission",
  UPDATE_STAGE: "Update — stage suggestion",
  DUPLICATE_SKIP: "Already logged (no change)",
  UNMATCHED_ROLE: "Role not matched",
  ERROR: "Needs attention",
};

const CLASSIFICATION_STYLE: Record<ResolvedRow["classification"], string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  UPDATE_STAGE: "bg-blue-100 text-blue-700",
  DUPLICATE_SKIP: "bg-slate-100 text-slate-500",
  UNMATCHED_ROLE: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

export function ImportWizard({
  vendors,
  recruiters,
  roles,
  initialVendorId,
}: {
  vendors: Option[];
  recruiters: Option[];
  roles: Option[];
  initialVendorId: string;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [vendorId, setVendorId] = useState(initialVendorId);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);
  const [statusMapping, setStatusMapping] = useState<StatusMapping>({});
  const [defaultRecruiterId, setDefaultRecruiterId] = useState("");
  const [saveMapping, setSaveMapping] = useState(true);

  const [resolvedRows, setResolvedRows] = useState<ResolvedRow[]>([]);
  const [overrides, setOverrides] = useState<Record<number, { roleId?: string; recruiterId?: string; skip?: boolean }>>({});
  const [commitResult, setCommitResult] = useState<{ created: number; updated: number; skipped: number; unmatched: number } | null>(
    null
  );

  const distinctStatuses = useMemo(() => {
    if (!mapping.status) return [];
    const idx = headers.indexOf(mapping.status);
    if (idx < 0) return [];
    return distinctStatusValues(sampleRows.map((r) => ({ status: (r[idx] ?? "").trim() })));
  }, [headers, sampleRows, mapping.status]);

  async function handleParse() {
    if (!file || !vendorId) {
      setError("Choose a vendor and a file first.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("vendorId", vendorId);
      const res = await fetch("/api/vendor-import/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse file");

      setHeaders(data.headers);
      setSampleRows(data.sampleRows);
      setTotalRows(data.totalRows);

      const saved = data.savedMapping as { mapping?: ColumnMapping; statusMapping?: StatusMapping } | null;
      if (saved?.mapping) {
        const restored: ColumnMapping = { ...EMPTY_MAPPING };
        for (const key of Object.keys(EMPTY_MAPPING) as (keyof ColumnMapping)[]) {
          const val = saved.mapping[key];
          if (val && data.headers.includes(val)) restored[key] = val;
        }
        setMapping(restored);
        if (saved.statusMapping) setStatusMapping(saved.statusMapping);
      } else {
        setMapping(EMPTY_MAPPING);
      }
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setPending(false);
    }
  }

  async function handleResolve() {
    if (!file) return;
    if (!mapping.candidateName || !mapping.role || !mapping.date) {
      setError("Candidate name, role, and date columns are required.");
      return;
    }
    if (!mapping.recruiter && !defaultRecruiterId) {
      setError("Map a recruiter column, or choose a default recruiter for this import.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("vendorId", vendorId);
      fd.append("mapping", JSON.stringify(mapping));
      fd.append("statusMapping", JSON.stringify(statusMapping));
      fd.append("defaultRecruiterId", defaultRecruiterId);
      const res = await fetch("/api/vendor-import/resolve", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resolve rows");
      setResolvedRows(data.rows);
      setOverrides({});
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve rows");
    } finally {
      setPending(false);
    }
  }

  async function handleCommit() {
    setPending(true);
    setError(null);
    try {
      const rows = resolvedRows.map((r) => {
        const ov = overrides[r.index] ?? {};
        return {
          ...r,
          matchedRoleId: ov.roleId ?? r.matchedRoleId,
          matchedRecruiterId: ov.recruiterId ?? r.matchedRecruiterId,
          skip: ov.skip ?? false,
        };
      });
      const res = await fetch("/api/vendor-import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          fileName: file?.name ?? "upload",
          mapping,
          statusMapping,
          rows,
          saveMapping,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to commit import");
      setCommitResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to commit import");
    } finally {
      setPending(false);
    }
  }

  function setOverride(index: number, patch: { roleId?: string; recruiterId?: string; skip?: boolean }) {
    setOverrides((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } }));
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of resolvedRows) c[r.classification] = (c[r.classification] ?? 0) + 1;
    return c;
  }, [resolvedRows]);

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      {step === "upload" && (
        <div className="glass rounded-2xl p-4 space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="file">
              Sheet (.xlsx or .csv)
            </label>
            <input
              id="file"
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600"
            />
          </div>
          <button
            disabled={pending || !file || !vendorId}
            onClick={handleParse}
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Reading…" : "Continue"}
          </button>
        </div>
      )}

      {step === "map" && (
        <div className="glass rounded-2xl p-4 space-y-5">
          <p className="text-sm text-slate-500">{totalRows} data rows detected. Map the sheet&apos;s columns below.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                ["candidateName", "Candidate name *"],
                ["role", "Role *"],
                ["date", "Submission date *"],
                ["recruiter", "Recruiter (optional column)"],
                ["status", "Status (optional)"],
                ["externalRef", "External / vendor ID (optional)"],
                ["notes", "Notes (optional)"],
              ] as [keyof ColumnMapping, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <select
                  value={mapping[key]}
                  onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">— none —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default recruiter{mapping.recruiter ? " (fallback if a row's recruiter text doesn't match anyone)" : ""}
            </label>
            <select
              value={defaultRecruiterId}
              onChange={(e) => setDefaultRecruiterId(e.target.value)}
              className="w-full sm:w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Select recruiter…</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {mapping.status && distinctStatuses.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Map status values seen in the first {sampleRows.length} rows to a stage. Anything left as
                &quot;No change&quot; is imported as a plain submission and flagged for your review instead of being
                advanced automatically.
              </p>
              <div className="space-y-2">
                {distinctStatuses.map((status) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-48 truncate" title={status}>
                      {status}
                    </span>
                    <select
                      value={statusMapping[status] ?? "NONE"}
                      onChange={(e) =>
                        setStatusMapping((m) => ({ ...m, [status]: e.target.value as StatusTarget }))
                      }
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {STATUS_TARGET_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={saveMapping} onChange={(e) => setSaveMapping(e.target.checked)} />
            Save this mapping as the default for this vendor
          </label>

          <div className="flex items-center gap-3">
            <button
              disabled={pending}
              onClick={handleResolve}
              className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Matching…" : "Preview import"}
            </button>
            <button onClick={() => setStep("upload")} className="text-sm text-slate-500 hover:text-slate-900">
              Back
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(counts).map(([classification, count]) => (
              <span
                key={classification}
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                  CLASSIFICATION_STYLE[classification as ResolvedRow["classification"]]
                }`}
              >
                {count} {CLASSIFICATION_LABEL[classification as ResolvedRow["classification"]]}
              </span>
            ))}
          </div>

          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/40 text-slate-500 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Candidate</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Recruiter</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status → Stage</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium text-right">Skip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {resolvedRows.map((r) => {
                  const ov = overrides[r.index] ?? {};
                  const skip = ov.skip ?? false;
                  return (
                    <tr key={r.index} className={skip ? "opacity-50" : ""}>
                      <td className="px-3 py-2 text-slate-900 whitespace-nowrap">{r.candidateName}</td>
                      <td className="px-3 py-2">
                        {r.matchedRoleId || ov.roleId ? (
                          roles.find((role) => role.id === (ov.roleId ?? r.matchedRoleId!))?.name ?? "Matched"
                        ) : (
                          <select
                            value={ov.roleId ?? ""}
                            onChange={(e) => setOverride(r.index, { roleId: e.target.value || undefined })}
                            className="rounded-md border border-amber-300 px-2 py-1 text-xs"
                          >
                            <option value="">{r.roleText || "— pick role —"}</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.matchedRecruiterId || ov.recruiterId ? (
                          recruiters.find((rec) => rec.id === (ov.recruiterId ?? r.matchedRecruiterId!))?.name ?? "Matched"
                        ) : (
                          <select
                            value={ov.recruiterId ?? ""}
                            onChange={(e) => setOverride(r.index, { recruiterId: e.target.value || undefined })}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs"
                          >
                            <option value="">— pick recruiter —</option>
                            {recruiters.map((rec) => (
                              <option key={rec.id} value={rec.id}>
                                {rec.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.date || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                        {r.status || "—"}
                        {r.statusTarget !== "NONE" ? ` → ${r.statusTarget}` : ""}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[r.classification]}`}
                        >
                          {CLASSIFICATION_LABEL[r.classification]}
                        </span>
                        {r.error && <p className="text-xs text-red-600 mt-0.5">{r.error}</p>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="checkbox"
                          checked={skip}
                          onChange={(e) => setOverride(r.index, { skip: e.target.checked })}
                        />
                      </td>
                    </tr>
                  );
                })}
                {resolvedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                      No rows found with the current mapping.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={pending || resolvedRows.length === 0}
              onClick={handleCommit}
              className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Importing…" : "Commit import"}
            </button>
            <button onClick={() => setStep("map")} className="text-sm text-slate-500 hover:text-slate-900">
              Back
            </button>
          </div>
        </div>
      )}

      {step === "done" && commitResult && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Import complete</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-xl font-semibold text-slate-900">{commitResult.created}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Flagged for review</p>
              <p className="text-xl font-semibold text-slate-900">{commitResult.updated}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Skipped (duplicate)</p>
              <p className="text-xl font-semibold text-slate-900">{commitResult.skipped}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unresolved</p>
              <p className="text-xl font-semibold text-slate-900">{commitResult.unmatched}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            New submissions and stage-update suggestions are flagged for review — check the in-flight list on the
            Daily Entry page to confirm any progress the sheet suggested.
          </p>
          <button
            onClick={() => {
              setStep("upload");
              setFile(null);
              setHeaders([]);
              setSampleRows([]);
              setResolvedRows([]);
              setOverrides({});
              setCommitResult(null);
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Import another sheet
          </button>
        </div>
      )}
    </div>
  );
}
