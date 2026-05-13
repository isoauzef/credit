import { useState } from "react";
import { useAdminApi, type CheckoutSubmission } from "../../hooks/useAdmin";
import { Trash2, RefreshCw, Banknote, ExternalLink, ChevronDown, Star } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  authorized: "bg-blue-500/20 text-blue-400",
  captured: "bg-emerald-500/20 text-emerald-400",
  canceled: "bg-red-500/20 text-red-400",
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export default function CheckoutSubmissions() {
  const { data, loading, reload, mutate } = useAdminApi<CheckoutSubmission[]>(
    "/api/admin/checkout-submissions"
  );
  const [capturing, setCapturing] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this checkout submission?")) return;
    await mutate("DELETE", undefined, `/${id}`);
    reload();
  };

  const handleCapture = async (id: number) => {
    if (!confirm("Capture this payment? This will charge the customer's card.")) return;
    setCapturing(id);
    try {
      await mutate("POST", undefined, `/${id}/capture`);
      reload();
    } catch (e: any) {
      alert(e.message || "Capture failed");
    } finally {
      setCapturing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Checkout Submissions</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data?.length ?? 0} total checkout orders with Stripe payment status.
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {!data?.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    {loading ? "Loading..." : "No checkout submissions yet."}
                  </td>
                </tr>
              ) : (
                data.map((s) => {
                  const isExpanded = expandedId === s.id;
                  const reviews: Array<{ review_id?: string; link?: string | null; rating?: number; date?: string; snippet?: string; userName?: string }> = Array.isArray(s.reviewLinks)
                    ? s.reviewLinks.map((r: any) => (typeof r === "string" ? { link: r } : r))
                    : [];
                  return (
                  <> 
                  <tr key={s.id} className="hover:bg-slate-800/50 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-slate-300">{s.email}</td>
                    <td className="px-4 py-3 text-slate-300">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{s.companyName}</td>
                    <td className="px-4 py-3 text-slate-300">{s.quantity}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      ${(s.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[s.paymentStatus] || "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.paymentStatus === "authorized" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCapture(s.id); }}
                            disabled={capturing === s.id}
                            className="rounded px-2.5 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
                            title="Capture payment"
                          >
                            {capturing === s.id ? "..." : (
                              <span className="flex items-center gap-1">
                                <Banknote size={14} /> Capture
                              </span>
                            )}
                          </button>
                        )}
                        {s.stripeSessionId && (
                          <a
                            href={`https://dashboard.stripe.com/payments/${s.stripePaymentIntentId || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-700"
                            title="View in Stripe"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                          className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ml-1 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="bg-slate-900/50 px-6 py-5">
                        <div className="space-y-5">
                          {/* Selected Reviews */}
                          {reviews.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                                Selected Reviews ({reviews.length})
                              </h4>
                              <div className="space-y-2">
                                {reviews.map((r, i) => (
                                  <div key={r.review_id || i} className="flex items-start gap-3 rounded-md bg-slate-800/60 px-4 py-3 text-sm">
                                    <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                          key={n}
                                          size={12}
                                          className={n <= (r.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-600 fill-slate-600"}
                                        />
                                      ))}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-slate-200 font-medium">{r.userName || "Unknown"}</span>
                                        {r.date && <span className="text-slate-500 text-xs">{r.date}</span>}
                                      </div>
                                      {r.snippet && (
                                        <p className="text-slate-400 mt-1 text-xs leading-relaxed">{r.snippet}</p>
                                      )}
                                      {r.link && (
                                        <a
                                          href={r.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-400 text-xs hover:underline mt-1 inline-block"
                                        >
                                          View on Google →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Details grid */}
                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            {s.reason && (
                              <div className="sm:col-span-2">
                                <p className="text-slate-500 text-xs mb-1">Reason for Removal</p>
                                <p className="text-slate-200 bg-slate-800/60 rounded-md px-4 py-3">{s.reason}</p>
                              </div>
                            )}
                            {s.googleDataId && (
                              <div>
                                <p className="text-slate-500 text-xs mb-1">Google Data ID</p>
                                <p className="text-slate-300 font-mono text-xs">{s.googleDataId}</p>
                              </div>
                            )}
                            {s.stripeSessionId && (
                              <div>
                                <p className="text-slate-500 text-xs mb-1">Stripe Session</p>
                                <p className="text-slate-300 font-mono text-xs truncate">{s.stripeSessionId}</p>
                              </div>
                            )}
                            {s.stripePaymentIntentId && (
                              <div>
                                <p className="text-slate-500 text-xs mb-1">Payment Intent</p>
                                <p className="text-slate-300 font-mono text-xs truncate">{s.stripePaymentIntentId}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
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
