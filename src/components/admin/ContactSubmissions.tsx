import { Fragment, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAdminApi, type ApiVendor, type ContactSubmission } from "../../hooks/useAdmin";
import { ChevronDown, ChevronUp, Copy, KeyRound, Plus, Power, RefreshCw, Trash2 } from "lucide-react";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const CREDIT_SCORE_LABELS: Record<string, string> = {
  "400-500": "400 - 500",
  "501-600": "501 - 600",
  "601-700": "601 - 700",
  "701-800+": "701 - 800+",
  unknown: "Unknown",
};

const NEGATIVE_ITEM_LABELS: Record<string, string> = {
  "1-5": "1 - 5",
  "6-9": "6 - 9",
  "10+": "10+",
  unknown: "Unknown",
};

const HAS_REPORT_LABELS: Record<string, string> = {
  yes: "Yes",
  no: "No",
};

function getMeta(s: ContactSubmission, key: string): string {
  const m = s.metadata as Record<string, unknown> | null | undefined;
  const v = m && typeof m === "object" ? m[key] : undefined;
  return typeof v === "string" ? v : "";
}

export default function ContactSubmissions() {
  const { data, loading, reload, mutate } = useAdminApi<ContactSubmission[]>("/api/admin/contact-submissions");
  const vendors = useAdminApi<ApiVendor[]>("/api/admin/api-vendors");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [vendorForm, setVendorForm] = useState({ name: "", contactEmail: "", notes: "" });
  const [newApiKey, setNewApiKey] = useState("");

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this submission?")) return;
    await mutate("DELETE", undefined, `/${id}`);
    reload();
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied.");
    } catch {
      toast.error("Copy failed. Select and copy it manually.");
    }
  };

  const handleCreateVendor = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const created = await vendors.mutate("POST", { ...vendorForm, active: true });
      setNewApiKey(created.apiKey || "");
      setVendorForm({ name: "", contactEmail: "", notes: "" });
      vendors.reload();
      toast.success("API vendor created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vendor could not be created.");
    }
  };

  const updateVendor = async (vendor: ApiVendor, updates: Partial<ApiVendor>) => {
    try {
      await vendors.mutate(
        "PUT",
        {
          name: updates.name ?? vendor.name,
          contactEmail: updates.contactEmail ?? vendor.contactEmail ?? "",
          notes: updates.notes ?? vendor.notes ?? "",
          active: updates.active ?? vendor.active,
          sortOrder: updates.sortOrder ?? vendor.sortOrder,
        },
        `/${vendor.id}`
      );
      vendors.reload();
      reload();
      toast.success("Vendor updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vendor update failed.");
    }
  };

  const rotateVendorKey = async (vendor: ApiVendor) => {
    if (!confirm(`Rotate API key for ${vendor.name}? The old key will stop working.`)) return;
    try {
      const updated = await vendors.mutate("POST", undefined, `/${vendor.id}/rotate-key`);
      setNewApiKey(updated.apiKey || "");
      vendors.reload();
      toast.success("API key rotated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Key rotation failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
          <p className="mt-1 text-sm text-slate-400">{data?.length ?? 0} total submissions from the homepage quote form.</p>
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

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Lead API Vendors</h2>
            <p className="text-sm text-slate-400">Active vendors receive new homepage leads in round-robin order.</p>
          </div>
          <button
            onClick={vendors.reload}
            disabled={vendors.loading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50 sm:mt-0"
          >
            <RefreshCw size={15} className={vendors.loading ? "animate-spin" : ""} />
            Refresh Vendors
          </button>
        </div>

        {newApiKey && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm font-semibold text-amber-200">Copy this API key now. It will not be shown again.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded bg-slate-950 px-3 py-2 text-sm text-amber-100">{newApiKey}</code>
              <button
                type="button"
                onClick={() => copyText(newApiKey)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Copy size={15} /> Copy
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateVendor} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
          <input
            value={vendorForm.name}
            onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Vendor name"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            required
          />
          <input
            value={vendorForm.contactEmail}
            onChange={(event) => setVendorForm((current) => ({ ...current, contactEmail: event.target.value }))}
            placeholder="Contact email"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <input
            value={vendorForm.notes}
            onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Internal notes"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus size={15} /> Add Vendor
          </button>
        </form>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {vendors.data?.length ? (
            vendors.data.map((vendor) => (
              <div key={vendor.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{vendor.name}</p>
                    <p className="text-xs text-slate-500">{vendor.contactEmail || "No contact email"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vendor.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                    {vendor.active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Metric label="Pending" value={vendor.pendingLeadCount} />
                  <Metric label="Delivered" value={vendor.deliveredLeadCount} />
                  <Metric label="Assigned" value={vendor.assignedLeadCount} />
                </div>
                <div className="mt-3 rounded bg-slate-900 px-3 py-2 text-xs text-slate-400">
                  Key: <span className="font-mono text-slate-200">{vendor.keyPreview}</span>
                  {vendor.lastUsedAt && <span className="ml-2">Last used: {formatDate(vendor.lastUsedAt)}</span>}
                </div>
                {vendor.notes && <p className="mt-2 text-xs text-slate-500">{vendor.notes}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateVendor(vendor, { active: !vendor.active })}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-blue-500"
                  >
                    <Power size={13} /> {vendor.active ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateVendorKey(vendor)}
                    className="inline-flex items-center gap-1 rounded border border-amber-500/50 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10"
                  >
                    <KeyRound size={13} /> Rotate Key
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
              No API vendors yet. Add a vendor to start round-robin lead assignment.
            </div>
          )}
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Credit Score</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">API Vendor</th>
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
                data.map((s) => {
                  const creditScore = getMeta(s, "creditScore");
                  const negativeItems = getMeta(s, "negativeItems");
                  const hasReport = getMeta(s, "hasCreditReport");
                  return (
                    <Fragment key={s.id}>
                      <tr
                        className="cursor-pointer hover:bg-slate-800/50"
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {s.firstName || ""} {s.lastName || s.name}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{s.email}</td>
                        <td className="px-4 py-3 text-slate-300">{s.phone}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {creditScore ? CREDIT_SCORE_LABELS[creditScore] || creditScore : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {s.assignedVendor ? (
                            <div>
                              <p className="font-medium text-slate-200">{s.assignedVendor.name}</p>
                              <p className={s.vendorDeliveredAt ? "text-xs text-emerald-300" : "text-xs text-amber-300"}>
                                {s.vendorDeliveredAt ? `Fetched ${formatDate(s.vendorDeliveredAt)}` : "Assigned, not fetched"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {expandedId === s.id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
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
                          <td colSpan={7} className="bg-slate-800/30 px-6 py-4">
                            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                              {creditScore && <Detail label="Credit Score" value={CREDIT_SCORE_LABELS[creditScore] || creditScore} />}
                              {negativeItems && <Detail label="Negative Items" value={NEGATIVE_ITEM_LABELS[negativeItems] || negativeItems} />}
                              {hasReport && <Detail label="Has Credit Report" value={HAS_REPORT_LABELS[hasReport] || hasReport} />}
                              {s.source && <Detail label="Source" value={s.source} />}
                              {s.assignedVendor && (
                                <Detail
                                  label="Lead API Vendor"
                                  value={`${s.assignedVendor.name}${s.vendorDeliveredAt ? " (fetched)" : " (not fetched yet)"}`}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
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
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-slate-200">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-slate-900 px-2 py-2 text-center">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}
