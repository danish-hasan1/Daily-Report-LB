import { prisma } from "@/lib/prisma";
import { addRole } from "./actions";
import { RoleRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  FILLED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Roles</h1>
        <p className="text-slate-500 text-sm mt-1">
          Open positions that submissions and interviews are tracked against.
        </p>
      </div>

      <form action={addRole} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
            Role title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. AI Architect"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="client">
            Client
          </label>
          <input id="client" name="client" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="priority">
              Priority
            </label>
            <input id="priority" name="priority" placeholder="High / Medium / Low" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Entries</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5 text-slate-900">{r.title}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.client || "—"}</td>
                <td className="px-4 py-2.5 text-slate-500">{r._count.submissions}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[r.status]}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <RoleRowActions id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No roles yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
