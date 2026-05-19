import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  LogOut,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";
import { CLIENT_EMAIL_KEY, CLIENT_TOKEN_KEY } from "./ClientLogin";
import { useSiteSettings } from "../hooks/useSiteSettings";

type RequiredDocument = {
  key: string;
  label: string;
  uploaded: boolean;
  uploadedAt: string | null;
};

type ExtraDocument = {
  id: number;
  type: string;
  label: string;
  originalName: string | null;
  uploadedBy: string;
  createdAt: string;
};

type BureauReport = {
  bureau: string;
  name: string;
  score: number;
  scoreDate: string | null;
  dateGenerated: string | null;
  negativeItems: number;
  disputes: number;
  deletions: number;
  positivesNote: string;
  accountSummary: {
    openAccounts?: number;
    selfReportedAccounts?: number;
    accountsEverLate?: number;
    closedAccounts?: number;
    collections?: number;
    averageAccountAge?: string;
    oldestAccount?: string;
  } | null;
  creditUsage: {
    usagePercent?: number;
    creditUsed?: number;
    creditLimit?: number;
  } | null;
  debtSummary: {
    creditCardDebt?: number;
    selfReportedBalance?: number;
    loanDebt?: number;
    collectionsDebt?: number;
    totalDebt?: number;
  } | null;
  reportDocPath: string | null;
  reportUploadedAt: string | null;
};

type DashboardUpdate = {
  id: number;
  title: string;
  body: string;
  createdBy: string;
  disputes: number | null;
  deletions: number | null;
  createdAt: string;
};

type DashboardData = {
  account: { id: number; email: string; status: string };
  client: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    createdAt: string;
    paymentStatus: string;
  };
  agent: { name: string; role: string; referral: string };
  documents: {
    readyToStart: boolean;
    required: RequiredDocument[];
    extra: ExtraDocument[];
  };
  bureauReports: BureauReport[];
  totals: { negativeItems: number; disputes: number; deletions: number };
  updates: DashboardUpdate[];
};

const bureauStyles: Record<string, { text: string; ring: string; chip: string }> = {
  equifax: { text: "text-rose-600", ring: "#ef4444", chip: "bg-rose-50 text-rose-700" },
  experian: { text: "text-violet-600", ring: "#7c3aed", chip: "bg-violet-50 text-violet-700" },
  transunion: { text: "text-cyan-600", ring: "#0891b2", chip: "bg-cyan-50 text-cyan-700" },
};

const bureauLogoPaths: Record<string, string> = {
  equifax: "/bureau-logos/equifax-logo.svg",
  experian: "/bureau-logos/experian-logo.svg",
  transunion: "/bureau-logos/transunion-logo.svg",
};

function formatDate(value?: string | null) {
  if (!value) return "Not added";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function SummaryRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="min-w-0 text-slate-600">{label}</dt>
      <dd className="shrink-0 text-right font-semibold text-slate-900">{value ?? "0"}</dd>
    </div>
  );
}

function MiniSummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="mb-3 text-base font-bold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function CreditUsageDonut({ percent = 0 }: { percent?: number }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div
      className="mx-auto grid h-24 w-24 place-items-center rounded-full"
      style={{ background: `conic-gradient(#fb7c1d ${safePercent * 3.6}deg, #e5e7eb 0deg)` }}
      aria-label={`Credit usage ${safePercent}%`}
    >
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white">
        <span className="text-lg font-bold text-slate-950">{safePercent}%</span>
      </div>
    </div>
  );
}

function UploadButton({
  label,
  type,
  onUploaded,
}: {
  label: string;
  type: "photo_id" | "utility_bill" | "additional_utility_bill" | "other";
  onUploaded: (payload: DashboardData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(CLIENT_TOKEN_KEY);
      const formData = new FormData();
      formData.append("file", file);
      const uploadResp = await fetch("/api/secure-uploads", { method: "POST", body: formData });
      const upload = await uploadResp.json();
      if (!uploadResp.ok) throw new Error(upload?.message || "Upload failed.");

      const attachResp = await fetch("/api/client/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          label,
          token: upload.token,
          originalName: upload.originalName,
          mimeType: upload.mimeType,
          size: upload.size,
        }),
      });
      const attached = await attachResp.json();
      if (!attachResp.ok) throw new Error(attached?.message || "Could not save document.");
      onUploaded(attached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{loading ? "Uploading..." : label}</span>
        <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={handleUpload} disabled={loading} />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function BureauCard({ report }: { report: BureauReport }) {
  const style = bureauStyles[report.bureau] || bureauStyles.equifax;
  const logoSrc = bureauLogoPaths[report.bureau];
  const score = Math.max(0, Math.min(report.score || 0, 850));
  const percent = score > 0 ? Math.max(0.05, Math.min(1, (score - 300) / 550)) : 0;
  const accountSummary = report.accountSummary || {};
  const creditUsage = report.creditUsage || {};
  const debtSummary = report.debtSummary || {};

  return (
    <article className="min-w-0 space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex h-9 max-w-[160px] items-center">
              {logoSrc ? (
                <img src={logoSrc} alt={report.name} className="max-h-8 max-w-full object-contain" />
              ) : (
                <p className={`truncate text-lg font-extrabold tracking-wide ${style.text}`}>{report.name}</p>
              )}
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-slate-400">
              <p className="truncate">Score date: {formatDate(report.scoreDate)}</p>
              <p className="truncate">Date generated: {formatDate(report.dateGenerated)}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${report.reportDocPath ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {report.reportDocPath ? "Uploaded" : "No report"}
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          <div
            className="mx-auto grid h-28 w-28 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${style.ring} ${percent * 360}deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
              <span className="text-3xl font-bold text-slate-950">{score}</span>
            </div>
          </div>
          <dl className="grid min-w-0 grid-cols-3 gap-2 text-center">
            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-slate-500">Negative</dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">{report.negativeItems}</dd>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-slate-500">Disputes</dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">{report.disputes}</dd>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-slate-500">Deleted</dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">{report.deletions}</dd>
            </div>
          </dl>
        </div>
      </section>

      <MiniSummaryCard title="Account Summary">
        <dl className="space-y-2">
          <SummaryRow label="Open accounts" value={accountSummary.openAccounts} />
          {accountSummary.selfReportedAccounts != null && (
            <SummaryRow label="Self-reported accounts" value={accountSummary.selfReportedAccounts} />
          )}
          <SummaryRow label="Accounts ever late" value={accountSummary.accountsEverLate} />
          <SummaryRow label="Closed accounts" value={accountSummary.closedAccounts} />
          <SummaryRow label="Collections" value={accountSummary.collections} />
          <SummaryRow label="Average account age" value={accountSummary.averageAccountAge || "Not added"} />
          <SummaryRow label="Oldest account" value={accountSummary.oldestAccount || "Not added"} />
        </dl>
      </MiniSummaryCard>

      <MiniSummaryCard title="Overall Credit Usage">
        <CreditUsageDonut percent={creditUsage.usagePercent} />
        <dl className="mt-3 space-y-2 text-center">
          <div className="text-sm text-slate-600">
            Credit used: <span className="font-semibold text-slate-900">{formatCurrency(creditUsage.creditUsed)}</span>
          </div>
          <div className="text-sm text-slate-600">
            Credit limit: <span className="font-semibold text-slate-900">{formatCurrency(creditUsage.creditLimit)}</span>
          </div>
        </dl>
      </MiniSummaryCard>

      <MiniSummaryCard title="Debt Summary">
        <dl className="space-y-2">
          <SummaryRow label="Credit card and credit line debt" value={formatCurrency(debtSummary.creditCardDebt)} />
          {debtSummary.selfReportedBalance != null && (
            <SummaryRow label="Self-reported account balance" value={formatCurrency(debtSummary.selfReportedBalance)} />
          )}
          <SummaryRow label="Loan debt" value={formatCurrency(debtSummary.loanDebt)} />
          <SummaryRow label="Collections debt" value={formatCurrency(debtSummary.collectionsDebt)} />
          <SummaryRow label="Total debt" value={formatCurrency(debtSummary.totalDebt)} />
        </dl>
      </MiniSummaryCard>
    </article>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const logoSrc = settings.site_logo || "/logo.svg";

  const logout = useCallback(() => {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_EMAIL_KEY);
    navigate("/client-login", { replace: true });
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem(CLIENT_TOKEN_KEY);
    if (!token) {
      navigate("/client-login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/client/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.status === 401 || resp.status === 404) {
        localStorage.removeItem(CLIENT_TOKEN_KEY);
        navigate("/client-login", { replace: true });
        return;
      }
      if (!resp.ok) throw new Error(data?.message || "Could not load dashboard.");
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const missingRequired = useMemo(
    () => dashboard?.documents.required.filter((item) => !item.uploaded) || [],
    [dashboard]
  );

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f8fb] text-slate-600">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f8fb] px-4">
        <div className="max-w-md rounded-xl border border-red-100 bg-white p-6 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="text-slate-700">{error || "Dashboard not found."}</p>
          <button onClick={loadDashboard} className="mt-4 rounded-lg bg-[#1e5a8a] px-4 py-2 text-sm font-semibold text-white">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-slate-950">
      <header
        className="shadow-lg shadow-slate-900/10"
        style={{ background: "linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))" }}
      >
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex min-w-0 items-center" aria-label="Credit Removers home">
            <img src={logoSrc} alt="Credit Removers" className="h-10 w-auto max-w-[210px] object-contain drop-shadow-sm" />
          </a>
          <div className="ml-auto flex min-w-0 items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Logged in user</p>
              <h1 className="truncate text-base font-semibold text-white sm:text-xl">{dashboard.client.name}</h1>
            </div>
          <button
            onClick={logout}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-medium text-white shadow-sm backdrop-blur hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section
          className={`mb-6 rounded-xl border px-4 py-4 sm:px-5 ${
            dashboard.documents.readyToStart
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {dashboard.documents.readyToStart ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              )}
              <div>
                <h2 className="font-semibold">
                  {dashboard.documents.readyToStart ? "Documents received - ready to start" : "Documents needed before we can start"}
                </h2>
                {!dashboard.documents.readyToStart && (
                  <p className="mt-1 text-sm">
                    We cannot start the process without: {missingRequired.map((item) => item.label).join(", ")}.
                  </p>
                )}
              </div>
            </div>
            {!dashboard.documents.readyToStart && (
              <div className="flex flex-wrap gap-2">
                <UploadButton label="Upload ID" type="photo_id" onUploaded={setDashboard} />
                <UploadButton label="Upload Utility Bill" type="utility_bill" onUploaded={setDashboard} />
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Negative Items</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.totals.negativeItems}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Disputes Filed</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.totals.disputes}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Deleted Items</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.totals.deletions}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Credit Bureau Scores</h2>
                <span className="text-sm text-slate-500">Scores show 0 until reports are uploaded.</span>
              </div>
              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.bureauReports.map((report) => (
                  <BureauCard key={report.bureau} report={report} />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Worker Updates</h2>
                <span className="text-sm text-slate-500">{dashboard.updates.length} updates</span>
              </div>
              {dashboard.updates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No updates posted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.updates.map((update) => (
                    <article key={update.id} className="border-l-4 border-[#1e5a8a] pl-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{update.title}</h3>
                        <span className="text-xs text-slate-400">{formatDate(update.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{update.body}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">By {update.createdBy}</span>
                        {update.disputes != null && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{update.disputes} disputes</span>}
                        {update.deletions != null && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{update.deletions} deleted</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Positive History</h2>
              <div className="mt-4 min-h-24 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Required Documents</h2>
              <div className="mt-4 space-y-3">
                {dashboard.documents.required.map((doc) => (
                  <div key={doc.key} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="flex items-start gap-2">
                      {doc.uploaded ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.label}</p>
                        <p className={`text-xs ${doc.uploaded ? "text-emerald-600" : "text-red-500"}`}>
                          {doc.uploaded ? `Uploaded ${formatDate(doc.uploadedAt)}` : "Not uploaded"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <UploadButton label="More Utility Bills" type="additional_utility_bill" onUploaded={setDashboard} />
                <UploadButton label="Other Docs" type="other" onUploaded={setDashboard} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Uploaded Documents</h2>
              <div className="mt-4 space-y-3">
                {dashboard.documents.extra.length === 0 ? (
                  <p className="text-sm text-slate-500">No additional documents yet.</p>
                ) : (
                  dashboard.documents.extra.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-3">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e5a8a]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{doc.originalName || doc.label}</p>
                        <p className="text-xs text-slate-400">{doc.label} - {formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Your Agent</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1e5a8a] text-white">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{dashboard.agent.name}</p>
                  <p className="text-sm text-slate-500">{dashboard.agent.role}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
                Referral: <span className="font-medium text-slate-900">{dashboard.agent.referral}</span>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Contact Info</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="break-words font-medium text-slate-800">{dashboard.client.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Phone</dt>
                  <dd className="font-medium text-slate-800">{dashboard.client.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Address</dt>
                  <dd className="font-medium text-slate-800">{dashboard.client.address || "Not provided"}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
