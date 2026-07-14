import { prisma } from "@/lib/prisma";
import { addVendor } from "./actions";
import { VendorRowActions } from "./row-actions";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Vendors</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage vendor/staffing partners who submit candidates against your roles.
        </p>
      </div>

      <form action={addVendor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="name">
            Vendor name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Kraftask"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="contact">
            Contact person
          </label>
          <input id="contact" name="contact" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">
              Phone
            </label>
            <input id="phone" name="phone" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
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
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2.5 text-slate-900">{v.name}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {[v.contact, v.email, v.phone].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {v.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <VendorRowActions id={v.id} active={v.active} />
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No vendors yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
