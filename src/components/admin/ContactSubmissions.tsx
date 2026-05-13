import { useState } from "react";
import { useAdminApi, type ContactSubmission } from "../../hooks/useAdmin";
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export default function ContactSubmissions() {
  const { data, loading, reload, mutate } = useAdminApi<ContactSubmission[]>(
    "/api/admin/contact-submissions"
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this submission?")) return;
    await mutate("DELETE", undefined, `/${id}`);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data?.length ?? 0} total submissions from the homepage quote form.
          </p>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Company</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Platform</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {!data?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {loading ? "Loading..." : "No submissions yet."}
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {s.firstName || ""} {s.lastName || s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.email}</td>
                      <td className="px-4 py-3 text-slate-300">{s.phone}</td>
                      <td className="px-4 py-3 text-slate-300">{s.companyName || "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{s.platform || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {expandedId === s.id ? (
                            <ChevronUp size={16} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-500" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s.id);
                            }}
                            className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={7} className="px-6 py-4 bg-slate-800/30">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                            {s.businessLocations && (
                              <Detail label="Business Locations" value={s.businessLocations} />
                            )}
                            {s.negativeReviewsNeedRemoving && (
                              <Detail
                                label="Reviews to Remove"
                                value={s.negativeReviewsNeedRemoving}
                              />
                            )}
                            {s.budgetPerRemoval && (
                              <Detail label="Budget / Removal" value={s.budgetPerRemoval} />
                            )}
                            {s.companyAddress && (
                              <Detail label="Address" value={s.companyAddress} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}
