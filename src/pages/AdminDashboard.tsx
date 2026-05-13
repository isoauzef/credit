import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Submission = {
  name: string;
  phone: string;
  email: string;
  problem: string;
  agreed?: boolean;
  submittedAt: string;
  source?: string;
  metadata?: Record<string, unknown> | null;
};

type SelectedReview = {
  review_id: string;
  link: string | null;
  rating: number;
  date: string;
  snippet: string;
  userName: string;
};

type CheckoutOrder = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  companyName: string;
  googleDataId: string | null;
  reviewLinks: SelectedReview[] | string[];
  reason: string | null;
  quantity: number;
  amount: number;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeSetupIntentId: string | null;
  stripePaymentMethodId: string | null;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

type LoadResult = {
  success: boolean;
  unauthorized?: boolean;
};

type NormalizedSubmissionFields = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyPostalCode?: string;
  businessLocations?: string;
  platform?: string;
  negativeReviewsNeedRemoving?: string;
  budgetPerRemoval?: string;
  legacyOtherPlatforms?: string;
};

const ADMIN_TOKEN_STORAGE_KEY = "adminToken";

function parseProblemToMap(problem: string): Record<string, string> {
  return problem
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [label, ...valueParts] = line.split(":");
      if (!label) {
        return acc;
      }
      const value = valueParts.join(":").trim();
      if (!value) {
        return acc;
      }
      acc[label.trim()] = value;
      return acc;
    }, {});
}

function normalizeSubmissionFields(submission: Submission): NormalizedSubmissionFields {
  const metadataRecord =
    submission.metadata && typeof submission.metadata === "object" && !Array.isArray(submission.metadata)
      ? (submission.metadata as Record<string, unknown>)
      : {};

  const problemMap = parseProblemToMap(submission.problem);

  const metadataValue = (...keys: string[]) => {
    for (const key of keys) {
      const raw = metadataRecord[key];
      if (raw === undefined || raw === null) {
        continue;
      }
      const value = String(raw).trim();
      if (value) {
        return value;
      }
    }
    return undefined;
  };

  const problemValue = (...labels: string[]) => {
    for (const label of labels) {
      const value = problemMap[label];
      if (value && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  };

  const [firstNameFromFull, ...restName] = submission.name?.trim().split(/\s+/) ?? [];
  const lastNameFromFull = restName.length ? restName.join(" ") : undefined;

  return {
    firstName: metadataValue("firstName") || firstNameFromFull || undefined,
    lastName: metadataValue("lastName") || lastNameFromFull || undefined,
    companyName: metadataValue("companyName") || problemValue("Company"),
    companyPostalCode:
      metadataValue("companyAddress", "companyPostalCode", "postalCode") ||
      problemValue("Company Address", "Company Postal Code", "Postal Code"),
    businessLocations: metadataValue("businessLocations") || problemValue("Business Locations"),
    platform: metadataValue("platform") || problemValue("Platform"),
    negativeReviewsNeedRemoving:
      metadataValue("negativeReviewsNeedRemoving", "negativeReviewsToRemove") ||
      problemValue("Negative Reviews Need Removing", "Negative Reviews To Remove"),
    budgetPerRemoval:
      metadataValue("budgetPerRemoval", "pricePerRemoval", "budgetPerRemovalAmount") ||
      problemValue("Budget Per Removal", "Budget / Removal", "Budget Per Review"),
    legacyOtherPlatforms:
      metadataValue("otherPlatforms", "otherSites") || problemValue("Other Platforms", "Other Sites"),
  };
}

function formatCell(value?: string) {
  return value && value.trim() ? value.trim() : "—";
}

function formatDate(isoString: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch (error) {
    return isoString;
  }
}

export default function AdminDashboard() {
  const [tokenInput, setTokenInput] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [checkoutOrders, setCheckoutOrders] = useState<CheckoutOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"contact" | "checkout">("checkout");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedToken = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      return;
    }
    (async () => {
      const result = await loadSubmissions(storedToken);
      if (result.success) {
        setAuthToken(storedToken);
        setIsAuthenticated(true);
      } else if (result.unauthorized) {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    })();
  }, []);

  const loadSubmissions = async (token: string): Promise<LoadResult> => {
    setStatus("loading");
    setStatusMessage("");
    try {
      const [contactRes, checkoutRes] = await Promise.all([
        fetch("/api/contact", { headers: { "x-admin-token": token } }),
        fetch("/api/checkout-submissions", { headers: { "x-admin-token": token } }),
      ]);

      if (contactRes.status === 401 || checkoutRes.status === 401) {
        setStatus("error");
        setStatusMessage("Invalid or missing admin token.");
        setSubmissions([]);
        setCheckoutOrders([]);
        return { success: false, unauthorized: true };
      }

      if (!contactRes.ok) {
        const text = await contactRes.text();
        throw new Error(text || "Unable to load contact submissions.");
      }

      const contactData = (await contactRes.json()) as Submission[];
      setSubmissions(contactData);

      if (checkoutRes.ok) {
        const checkoutData = (await checkoutRes.json()) as CheckoutOrder[];
        setCheckoutOrders(checkoutData);
      }

      setStatus("success");
      return { success: true };
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to load submissions.");
      return { success: false };
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedToken = tokenInput.trim();

    if (!trimmedToken) {
      setStatus("error");
      setStatusMessage("Enter the admin token to continue.");
      return;
    }

    const result = await loadSubmissions(trimmedToken);
    if (result.success) {
      setAuthToken(trimmedToken);
      setIsAuthenticated(true);
      setTokenInput("");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, trimmedToken);
      }
    } else if (result.unauthorized) {
      setAuthToken(null);
      setIsAuthenticated(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      }
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setSubmissions([]);
    setStatus("idle");
    setStatusMessage("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  };

  const handleRefresh = async () => {
    if (!authToken) {
      setStatus("error");
      setStatusMessage("Missing admin token. Please log in again.");
      setIsAuthenticated(false);
      return;
    }
    const result = await loadSubmissions(authToken);
    if (result.unauthorized) {
      handleLogout();
    }
  };

  const totalSubmissions = useMemo(() => submissions.length, [submissions]);
  const normalizedRows = useMemo(
    () =>
      submissions.map(submission => ({
        submission,
        fields: normalizeSubmissionFields(submission),
      })),
    [submissions]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
            <p className="text-sm text-slate-600">Enter the admin token to access contact form submissions.</p>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label htmlFor="admin-token" className="text-sm font-medium text-slate-700">
                Admin Token
              </label>
              <input
                id="admin-token"
                type="password"
                value={tokenInput}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setTokenInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="********"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-black shadow-md transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              Sign In
            </button>
          </form>
          {status === "error" && statusMessage && (
            <p className="text-sm text-red-600 text-center">{statusMessage}</p>
          )}
          <div className="text-center text-sm">
            <Link to="/" className="text-indigo-600 hover:text-indigo-500">
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300",
      card_saved: "bg-blue-500/20 text-blue-300",
      charged: "bg-green-500/20 text-green-300",
      succeeded: "bg-green-500/20 text-green-300",
      canceled: "bg-slate-500/20 text-slate-400",
      refunded: "bg-red-500/20 text-red-300",
      failed: "bg-red-500/20 text-red-300",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[s] || "bg-slate-700 text-slate-300"}`}>
        {s}
      </span>
    );
  };

  const [chargingId, setChargingId] = useState<number | null>(null);
  const [chargeMsg, setChargeMsg] = useState<Record<number, string>>({});

  const handleCharge = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to charge this customer?")) return;
    setChargingId(orderId);
    setChargeMsg((prev) => ({ ...prev, [orderId]: "" }));
    try {
      const res = await fetch(`/api/admin/checkout-submissions/${orderId}/charge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Charge failed");
      setChargeMsg((prev) => ({ ...prev, [orderId]: `Charged! ($${(data.amount / 100).toFixed(2)})` }));
      handleRefresh();
    } catch (err: any) {
      setChargeMsg((prev) => ({ ...prev, [orderId]: err.message || "Charge failed" }));
    } finally {
      setChargingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">Manage submissions and checkout orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              View site
            </Link>
            <button
              onClick={handleRefresh}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Stats cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-900 p-6 shadow">
            <p className="text-sm text-slate-400">Contact Submissions</p>
            <p className="mt-2 text-3xl font-semibold text-white">{submissions.length}</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-6 shadow">
            <p className="text-sm text-slate-400">Checkout Orders</p>
            <p className="mt-2 text-3xl font-semibold text-white">{checkoutOrders.length}</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-6 shadow">
            <p className="text-sm text-slate-400">Total Revenue</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              ${checkoutOrders
                .filter((o) => o.paymentStatus === "charged" || o.paymentStatus === "succeeded")
                .reduce((sum, o) => sum + o.amount, 0) / 100}
            </p>
          </div>
        </section>

        {status === "error" && statusMessage && (
          <div className="rounded-md border border-red-500 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {statusMessage}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("checkout")}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-md transition ${
              activeTab === "checkout"
                ? "bg-slate-900 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Checkout Orders ({checkoutOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-md transition ${
              activeTab === "contact"
                ? "bg-slate-900 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Contact Submissions ({submissions.length})
          </button>
        </div>

        {/* ────────── CHECKOUT ORDERS TAB ────────── */}
        {activeTab === "checkout" && (
          <div className="space-y-3">
            {checkoutOrders.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-12 text-center text-slate-400">
                No checkout orders yet.
              </div>
            ) : (
              checkoutOrders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const reviews: SelectedReview[] = Array.isArray(order.reviewLinks)
                  ? order.reviewLinks.map((r) =>
                      typeof r === "string" ? { review_id: r, link: r, rating: 0, date: "", snippet: "", userName: "" } : r
                    )
                  : [];
                return (
                  <div key={order.id} className="rounded-lg border border-slate-800 bg-slate-900 shadow overflow-hidden">
                    {/* Summary row */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-800/50 transition"
                    >
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">Date</p>
                          <p className="text-slate-200">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Name</p>
                          <p className="text-slate-200">{order.name}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Email</p>
                          <p className="text-slate-200 truncate">{order.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Phone</p>
                          <p className="text-slate-200 truncate">{order.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Company</p>
                          <p className="text-slate-200 truncate">{order.companyName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Reviews</p>
                          <p className="text-slate-200">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Amount</p>
                          <p className="text-white font-medium">${order.amount / 100}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Status</p>
                          {statusBadge(order.paymentStatus)}
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 px-5 py-5 space-y-5 bg-slate-900/50">
                        {/* Review links */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                            Selected Reviews ({reviews.length})
                          </h4>
                          <div className="space-y-2">
                            {reviews.map((r, i) => (
                              <div key={r.review_id || i} className="flex items-start gap-3 rounded-md bg-slate-800/60 px-4 py-3 text-sm">
                                <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <svg
                                      key={s}
                                      className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600 fill-slate-600"}`}
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
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

                        {/* Details grid */}
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          {order.reason && (
                            <div className="sm:col-span-2">
                              <p className="text-slate-500 text-xs mb-1">Reason for Removal</p>
                              <p className="text-slate-200 bg-slate-800/60 rounded-md px-4 py-3">{order.reason}</p>
                            </div>
                          )}
                          {order.googleDataId && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Google Data ID</p>
                              <p className="text-slate-300 font-mono text-xs">{order.googleDataId}</p>
                            </div>
                          )}
                          {order.stripeSessionId && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Stripe Session</p>
                              <p className="text-slate-300 font-mono text-xs truncate">{order.stripeSessionId}</p>
                            </div>
                          )}
                          {order.stripePaymentIntentId && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Payment Intent</p>
                              <p className="text-slate-300 font-mono text-xs truncate">{order.stripePaymentIntentId}</p>
                            </div>
                          )}
                          {order.stripeCustomerId && (
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Stripe Customer</p>
                              <p className="text-slate-300 font-mono text-xs truncate">{order.stripeCustomerId}</p>
                            </div>
                          )}
                        </div>

                        {/* Charge action */}
                        {order.paymentStatus === "card_saved" && order.stripePaymentMethodId && (
                          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4">
                            <button
                              onClick={() => handleCharge(order.id)}
                              disabled={chargingId === order.id}
                              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition flex items-center gap-2"
                            >
                              {chargingId === order.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Charging…
                                </>
                              ) : (
                                <>Charge ${((order.amount || 0) / 100).toFixed(0)}</>
                              )}
                            </button>
                            <span className="text-xs text-slate-400">
                              {order.quantity} review{order.quantity !== 1 ? "s" : ""} × ${((order.amount || 0) / order.quantity / 100).toFixed(0)} each
                            </span>
                            {chargeMsg[order.id] && (
                              <span className={`text-xs ${chargeMsg[order.id].startsWith("Charged") ? "text-emerald-400" : "text-red-400"}`}>
                                {chargeMsg[order.id]}
                              </span>
                            )}
                          </div>
                        )}
                        {order.paymentStatus === "charged" && (
                          <div className="mt-4 pt-4 border-t border-slate-800">
                            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                              ✓ Charged ${((order.amount || 0) / 100).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ────────── CONTACT SUBMISSIONS TAB ────────── */}
        {activeTab === "contact" && (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 shadow">
            <table className="min-w-[1360px] divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Submitted</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">First Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Last Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Company Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Company Postal Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Business Locations</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Platform</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Negative Reviews</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Budget / Removal</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Legacy Other Platforms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {normalizedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-6 text-center text-slate-400">
                      No submissions yet.
                    </td>
                  </tr>
                ) : (
                  normalizedRows.map(({ submission, fields }, index) => (
                    <tr key={`${submission.email}-${submission.submittedAt}-${index}`} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 text-slate-300">{formatDate(submission.submittedAt)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.firstName)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.lastName)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(submission.email)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(submission.phone)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.companyName)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.companyPostalCode)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.businessLocations)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.platform)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.negativeReviewsNeedRemoving)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.budgetPerRemoval)}</td>
                      <td className="px-4 py-3 text-slate-200">{formatCell(fields.legacyOtherPlatforms)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
