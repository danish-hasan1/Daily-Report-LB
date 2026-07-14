import { prisma } from "@/lib/prisma";
import { addRecruiter } from "./actions";
import { RecruiterRowActions } from "./row-actions";

export default async function RecruitersPage() {
  const recruiters = await prisma.recruiter.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Recruiters</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage the roster of recruiters who log daily submissions and interviews.
        </p>
      </div>

      <form action={addRecruiter} className="flex items-end gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="name">
            Recruiter name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Dinesh"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          Add recruiter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recruiters.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-slate-900">{r.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <RecruiterRowActions id={r.id} active={r.active} />
                </td>
              </tr>
            ))}
            {recruiters.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No recruiters yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
