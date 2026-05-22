import { FormEvent, Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAdminApi, useAdminAuth, type CheckoutSubmission } from "../../hooks/useAdmin";
import { Trash2, RefreshCw, Banknote, ExternalLink, ChevronDown, Star, FileText, Image as ImageIcon, KeyRound, Upload, Save, PlusCircle, Newspaper } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  authorized: "bg-blue-500/20 text-blue-400",
  captured: "bg-emerald-500/20 text-emerald-400",
  card_saved: "bg-emerald-500/20 text-emerald-400",
  charged: "bg-emerald-500/20 text-emerald-400",
  refunded: "bg-slate-700 text-slate-300",
  canceled: "bg-red-500/20 text-red-400",
};

type AdminBureauReport = {
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
  reportOriginalName: string | null;
  reportUploadedAt: string | null;
  reportParsedAt: string | null;
  reportParseStatus: string | null;
  reportParseError: string | null;
};

type AdminDashboardSnapshot = {
  account: { id: number; email: string; createdAt: string | null };
  client: { name: string; email: string };
  documents: {
    readyToStart: boolean;
    required: Array<{ key: string; label: string; uploaded: boolean; uploadedAt: string | null }>;
    extra: Array<{
      id: number;
      type: string;
      label: string;
      token: string;
      originalName: string | null;
      mimeType: string | null;
      size: number | null;
      uploadedBy: string;
      createdAt: string;
    }>;
  };
  bureauReports: AdminBureauReport[];
  totals: { negativeItems: number; disputes: number; deletions: number };
  updates: Array<{ id: number; title: string; body: string; createdBy: string; disputes: number | null; deletions: number | null; createdAt: string }>;
};

type ClientDashboardAdminResponse = {
  account: AdminDashboardSnapshot["account"] | null;
  dashboard: AdminDashboardSnapshot | null;
  portal?: {
    loginUrl?: string;
    dashboardUrl?: string;
    email?: string;
    temporaryPassword?: string | null;
    created?: boolean;
    passwordReset?: boolean;
  };
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

function dateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function fieldValue(value: unknown) {
  return value == null ? "" : String(value);
}

async function uploadDashboardFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await fetch("/api/secure-uploads", { method: "POST", body: fd });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || "Upload failed");
  return data as { token: string; originalName: string; mimeType: string; size: number };
}

function ClientDashboardAdminPanel({
  submissionId,
  state,
  loading,
  temporaryPassword,
  onCreateAccount,
  onResetPassword,
  onSaveReport,
  onAddUpdate,
  onViewDocument,
  intakeDocuments,
  signature,
  onViewSignature,
}: {
  submissionId: number;
  state?: ClientDashboardAdminResponse;
  loading: boolean;
  temporaryPassword?: string;
  onCreateAccount: (id: number) => void;
  onResetPassword: (id: number) => void;
  onSaveReport: (id: number, bureau: string, form: HTMLFormElement) => void;
  onAddUpdate: (id: number, form: HTMLFormElement) => void;
  onViewDocument: (token: string) => void;
  intakeDocuments: Array<{ key: string; label: string; token: string; icon: "image" | "file" }>;
  signature?: { signatureDataUrl: string | null; signedAt: string | null; authLetterSnapshot: string | null };
  onViewSignature: (signatureDataUrl?: string | null) => void;
}) {
  if (loading && !state) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
        Loading client dashboard...
      </div>
    );
  }

  if (!state?.dashboard) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Client Dashboard</h4>
            <p className="mt-1 text-sm text-slate-400">No client login has been created for this submission yet.</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCreateAccount(submissionId); }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <KeyRound size={14} /> Create Client Login
          </button>
        </div>
      </div>
    );
  }

  const dashboard = state.dashboard;
  const hasSignature = Boolean(signature?.signatureDataUrl);
  const uploadedDocumentCount = intakeDocuments.length + dashboard.documents.extra.length + (hasSignature ? 1 : 0);

  return (
    <div className="space-y-5 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Client Dashboard</h4>
          <p className="mt-1 text-sm text-slate-300">
            Login email: <span className="font-medium text-white">{dashboard.account.email}</span>
          </p>
          {state.portal?.loginUrl && (
            <a
              href={state.portal.loginUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline"
            >
              Open client login <ExternalLink size={12} />
            </a>
          )}
          {temporaryPassword && (
            <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Temporary password: <span className="font-mono font-semibold">{temporaryPassword}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onResetPassword(submissionId); }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
        >
          <KeyRound size={14} /> Reset Password
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {dashboard.documents.required.map((doc) => (
          <div key={doc.key} className="rounded-md bg-slate-900 px-3 py-2 text-xs">
            <p className="font-medium text-slate-200">{doc.label}</p>
            <p className={doc.uploaded ? "text-emerald-400" : "text-red-400"}>
              {doc.uploaded ? `Uploaded ${doc.uploadedAt ? formatDate(doc.uploadedAt) : ""}` : "Missing"}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Uploaded Documents</h5>
          <span className="text-xs text-slate-500">{uploadedDocumentCount} files</span>
        </div>
        {uploadedDocumentCount === 0 ? (
          <p className="text-sm text-slate-500">No client dashboard uploads yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {intakeDocuments.map((doc) => (
              <button
                key={doc.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); onViewDocument(doc.token); }}
                className="min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left hover:border-cyan-500/60"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-100">
                  {doc.icon === "image" ? <ImageIcon size={14} className="shrink-0 text-cyan-300" /> : <FileText size={14} className="shrink-0 text-cyan-300" />}
                  <span className="truncate">{doc.label}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  Checkout intake
                </span>
              </button>
            ))}
            {dashboard.documents.extra.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onViewDocument(doc.token); }}
                className="min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left hover:border-cyan-500/60"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-100">
                  <FileText size={14} className="shrink-0 text-cyan-300" />
                  <span className="truncate">{doc.originalName || doc.label}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {doc.label} - {doc.uploadedBy} - {formatDate(doc.createdAt)}
                </span>
              </button>
            ))}
            {hasSignature && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onViewSignature(signature?.signatureDataUrl); }}
                className="min-w-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left hover:border-cyan-500/60"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-100">
                  <FileText size={14} className="shrink-0 text-cyan-300" />
                  <span className="truncate">Signature</span>
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {signature?.signedAt ? formatDate(signature.signedAt) : "Signed authorization"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Credit Bureau Reports</h5>
        <div className="grid gap-3 xl:grid-cols-3">
          {dashboard.bureauReports.map((report) => (
            <form
              key={`${report.bureau}-${report.score}-${report.scoreDate}-${report.dateGenerated}-${report.reportDocPath || "none"}-${JSON.stringify(report.accountSummary || {})}-${JSON.stringify(report.creditUsage || {})}-${JSON.stringify(report.debtSummary || {})}`}
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                e.stopPropagation();
                onSaveReport(submissionId, report.bureau, e.currentTarget);
              }}
              className="space-y-3 rounded-md border border-slate-800 bg-slate-900/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white">{report.name}</p>
                <span className={report.reportDocPath ? "text-xs text-emerald-400" : "text-xs text-slate-500"}>
                  {report.reportDocPath ? "Report uploaded" : "No report"}
                </span>
              </div>
              {report.reportParseStatus && (
                <div className={`rounded px-2 py-1 text-xs ${report.reportParseStatus === "parsed" ? "bg-emerald-500/10 text-emerald-300" : report.reportParseStatus === "failed" ? "bg-red-500/10 text-red-300" : "bg-slate-800 text-slate-300"}`}>
                  {report.reportParseStatus === "parsed"
                    ? `Parsed ${report.reportParsedAt ? formatDate(report.reportParsedAt) : ""}`
                    : report.reportParseStatus === "failed"
                    ? `PDF parse failed${report.reportParseError ? `: ${report.reportParseError}` : ""}`
                    : "PDF parser pending"}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">
                  Score
                  <input name="score" type="number" min="0" max="850" defaultValue={report.score} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Score Date
                  <input name="scoreDate" type="date" defaultValue={dateInputValue(report.scoreDate)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Date Generated
                  <input name="dateGenerated" type="date" defaultValue={dateInputValue(report.dateGenerated)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Negative
                  <input name="negativeItems" type="number" min="0" defaultValue={report.negativeItems} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Disputes
                  <input name="disputes" type="number" min="0" defaultValue={report.disputes} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Deleted
                  <input name="deletions" type="number" min="0" defaultValue={report.deletions} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                </label>
                <label className="text-xs text-slate-400">
                  Report PDF/Image
                  <input name="reportFile" type="file" accept="image/jpeg,image/png,application/pdf" className="mt-1 block w-full text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:text-slate-100" />
                </label>
              </div>
              {report.reportOriginalName && (
                <p className="text-xs text-slate-500">Current file: {report.reportOriginalName}</p>
              )}

              <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Account Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-400">
                    Open accounts
                    <input name="openAccounts" type="number" min="0" defaultValue={fieldValue(report.accountSummary?.openAccounts)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Self-reported
                    <input name="selfReportedAccounts" type="number" min="0" defaultValue={fieldValue(report.accountSummary?.selfReportedAccounts)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Ever late
                    <input name="accountsEverLate" type="number" min="0" defaultValue={fieldValue(report.accountSummary?.accountsEverLate)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Closed
                    <input name="closedAccounts" type="number" min="0" defaultValue={fieldValue(report.accountSummary?.closedAccounts)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Collections
                    <input name="collections" type="number" min="0" defaultValue={fieldValue(report.accountSummary?.collections)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Average age
                    <input name="averageAccountAge" defaultValue={fieldValue(report.accountSummary?.averageAccountAge)} placeholder="10 yrs 3 mos" className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400 sm:col-span-2">
                    Oldest account
                    <input name="oldestAccount" defaultValue={fieldValue(report.accountSummary?.oldestAccount)} placeholder="19 yrs 6 mos" className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Overall Credit Usage</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-slate-400">
                    Usage %
                    <input name="usagePercent" type="number" min="0" max="100" defaultValue={fieldValue(report.creditUsage?.usagePercent)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Used
                    <input name="creditUsed" type="number" min="0" defaultValue={fieldValue(report.creditUsage?.creditUsed)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Limit
                    <input name="creditLimit" type="number" min="0" defaultValue={fieldValue(report.creditUsage?.creditLimit)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Debt Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-400">
                    Credit card debt
                    <input name="creditCardDebt" type="number" min="0" defaultValue={fieldValue(report.debtSummary?.creditCardDebt)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Self-reported balance
                    <input name="selfReportedBalance" type="number" min="0" defaultValue={fieldValue(report.debtSummary?.selfReportedBalance)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Loan debt
                    <input name="loanDebt" type="number" min="0" defaultValue={fieldValue(report.debtSummary?.loanDebt)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400">
                    Collections debt
                    <input name="collectionsDebt" type="number" min="0" defaultValue={fieldValue(report.debtSummary?.collectionsDebt)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                  <label className="text-xs text-slate-400 sm:col-span-2">
                    Total debt
                    <input name="totalDebt" type="number" min="0" defaultValue={fieldValue(report.debtSummary?.totalDebt)} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
                  </label>
                </div>
              </div>

              <label className="block text-xs text-slate-400">
                Positive History
                <textarea name="positivesNote" defaultValue={report.positivesNote} rows={2} className="mt-1 w-full rounded bg-slate-950 px-2 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
              </label>
              <button type="submit" className="inline-flex items-center gap-2 rounded bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
                <Save size={14} /> Save {report.name}
              </button>
            </form>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          e.stopPropagation();
          onAddUpdate(submissionId, e.currentTarget);
        }}
        className="rounded-md border border-slate-800 bg-slate-900/70 p-3"
      >
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Post Client Update</h5>
        <div className="grid gap-2 sm:grid-cols-4">
          <input name="title" placeholder="Update title" className="rounded bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400 sm:col-span-2" />
          <input name="disputes" type="number" min="0" placeholder="Disputes" className="rounded bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
          <input name="deletions" type="number" min="0" placeholder="Deleted" className="rounded bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400" />
          <textarea name="body" placeholder="What should the client see?" rows={3} className="rounded bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400 sm:col-span-4" />
        </div>
        <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
          <PlusCircle size={14} /> Add Update
        </button>
      </form>

      {dashboard.updates.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recent Client Updates</h5>
          {dashboard.updates.slice(0, 3).map((update) => (
            <div key={update.id} className="rounded-md bg-slate-900 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-100">{update.title}</span>
                <span className="text-xs text-slate-500">{formatDate(update.createdAt)}</span>
              </div>
              <p className="mt-1 text-slate-400">{update.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CheckoutSubmissions() {
  const { data, loading, reload, mutate } = useAdminApi<CheckoutSubmission[]>(
    "/api/admin/checkout-submissions"
  );
  const { token } = useAdminAuth();
  const [capturing, setCapturing] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [signatures, setSignatures] = useState<Record<number, { signatureDataUrl: string | null; signedAt: string | null; authLetterSnapshot: string | null }>>({});
  const [clientDashboards, setClientDashboards] = useState<Record<number, ClientDashboardAdminResponse>>({});
  const [dashboardPasswords, setDashboardPasswords] = useState<Record<number, string>>({});
  const [dashboardLoading, setDashboardLoading] = useState<Record<number, boolean>>({});

  const loadSignature = async (id: number) => {
    if (signatures[id]) return;
    try {
      const resp = await fetch(`/api/admin/checkout-submissions/${id}/signature`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setSignatures((p) => ({ ...p, [id]: data }));
    } catch (_) { /* ignore */ }
  };

  const loadClientDashboard = async (id: number) => {
    if (!token) return;
    setDashboardLoading((p) => ({ ...p, [id]: true }));
    try {
      const resp = await fetch(`/api/admin/checkout-submissions/${id}/client-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Could not load client dashboard");
      setClientDashboards((p) => ({ ...p, [id]: data }));
    } catch (e: any) {
      toast.error(e.message || "Could not load client dashboard");
    } finally {
      setDashboardLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const upsertClientAccount = async (id: number, resetPassword = false) => {
    if (!token) return;
    setDashboardLoading((p) => ({ ...p, [id]: true }));
    try {
      const resp = await fetch(`/api/admin/checkout-submissions/${id}/client-dashboard-account`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Could not create client account");
      setClientDashboards((p) => ({ ...p, [id]: data }));
      if (data?.portal?.temporaryPassword) {
        setDashboardPasswords((p) => ({ ...p, [id]: data.portal.temporaryPassword }));
      }
      toast.success(resetPassword ? "Client login password reset." : data?.portal?.created ? "Client login created." : "Client login updated.");
    } catch (e: any) {
      toast.error(e.message || "Could not update client account");
    } finally {
      setDashboardLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const saveBureauReport = async (id: number, bureau: string, form: HTMLFormElement) => {
    if (!token) return;
    const formData = new FormData(form);
    const file = formData.get("reportFile");
    const payload: Record<string, unknown> = {
      score: formData.get("score"),
      scoreDate: formData.get("scoreDate"),
      dateGenerated: formData.get("dateGenerated"),
      negativeItems: formData.get("negativeItems"),
      disputes: formData.get("disputes"),
      deletions: formData.get("deletions"),
      positivesNote: formData.get("positivesNote"),
      accountSummary: {
        openAccounts: formData.get("openAccounts"),
        selfReportedAccounts: formData.get("selfReportedAccounts"),
        accountsEverLate: formData.get("accountsEverLate"),
        closedAccounts: formData.get("closedAccounts"),
        collections: formData.get("collections"),
        averageAccountAge: formData.get("averageAccountAge"),
        oldestAccount: formData.get("oldestAccount"),
      },
      creditUsage: {
        usagePercent: formData.get("usagePercent"),
        creditUsed: formData.get("creditUsed"),
        creditLimit: formData.get("creditLimit"),
      },
      debtSummary: {
        creditCardDebt: formData.get("creditCardDebt"),
        selfReportedBalance: formData.get("selfReportedBalance"),
        loanDebt: formData.get("loanDebt"),
        collectionsDebt: formData.get("collectionsDebt"),
        totalDebt: formData.get("totalDebt"),
      },
    };

    setDashboardLoading((p) => ({ ...p, [id]: true }));
    try {
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadDashboardFile(file);
        payload.reportDocToken = uploaded.token;
        payload.reportOriginalName = uploaded.originalName;
      }
      const resp = await fetch(`/api/admin/checkout-submissions/${id}/client-dashboard/reports/${bureau}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Could not save report");
      setClientDashboards((p) => ({ ...p, [id]: { ...(p[id] || {}), dashboard: data.dashboard, account: data.dashboard.account } }));
      const savedReport = data.dashboard?.bureauReports?.find((report: AdminBureauReport) => report.bureau === bureau);
      if (savedReport?.reportParseStatus === "failed") {
        toast.error(`${savedReport.name} saved, but PDF parse failed.`);
      } else {
        toast.success(`${savedReport?.name || "Report"} saved.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Could not save report");
    } finally {
      setDashboardLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const addClientUpdate = async (id: number, form: HTMLFormElement) => {
    if (!token) return;
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title"),
      body: formData.get("body"),
      disputes: formData.get("disputes"),
      deletions: formData.get("deletions"),
      createdBy: "Zack",
    };
    setDashboardLoading((p) => ({ ...p, [id]: true }));
    try {
      const resp = await fetch(`/api/admin/checkout-submissions/${id}/client-dashboard/updates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Could not add update");
      setClientDashboards((p) => ({ ...p, [id]: { ...(p[id] || {}), dashboard: data.dashboard, account: data.dashboard.account } }));
      form.reset();
      toast.success("Client update posted.");
    } catch (e: any) {
      toast.error(e.message || "Could not add update");
    } finally {
      setDashboardLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const downloadSecureFile = async (token2: string) => {
    if (!token) return;
    const resp = await fetch(`/api/secure-uploads/${token2}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      toast.error("Could not load file");
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const viewSignature = (signatureDataUrl?: string | null) => {
    if (!signatureDataUrl) {
      toast.error("Signature is not available.");
      return;
    }

    const safeDataUrl = signatureDataUrl.replace(/"/g, "&quot;");
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Signature</title>
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; }
            img { max-width: min(900px, 92vw); max-height: 82vh; background: #fff; border-radius: 8px; padding: 16px; }
          </style>
        </head>
        <body><img src="${safeDataUrl}" alt="Signature" /></body>
      </html>
    `;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this checkout submission?")) return;
    await mutate("DELETE", undefined, `/${id}`);
    reload();
  };

  const handleCapture = async (id: number) => {
    if (!confirm("Capture this payment? This will charge the customer's card.")) return;
    setCapturing(id);
    try {
      await mutate("POST", undefined, `/${id}/charge`);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Capture failed");
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to="/admin/blog"
            className="flex items-center gap-2 rounded-lg border border-blue-500/40 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
          >
            <Newspaper size={16} />
            Blog Manager
          </Link>
          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
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
                  <Fragment key={s.id}>
                  <tr className="hover:bg-slate-800/50 cursor-pointer" onClick={() => { const nextId = isExpanded ? null : s.id; setExpandedId(nextId); if (nextId) { loadSignature(s.id); loadClientDashboard(s.id); } }}>
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
                      <td colSpan={9} className="bg-slate-900/50 px-6 py-5">
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

                          {/* Credit Repair PII section */}
                          {(s.address || s.dob || s.ssnLast4) && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                                Credit Repair Intake
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                {s.address && (
                                  <div className="sm:col-span-2">
                                    <p className="text-slate-500 text-xs mb-1">Address</p>
                                    <p className="text-slate-200">{s.address}</p>
                                  </div>
                                )}
                                {s.dob && (
                                  <div>
                                    <p className="text-slate-500 text-xs mb-1">Date of Birth</p>
                                    <p className="text-slate-200">{s.dob}</p>
                                  </div>
                                )}
                                {s.ssnLast4 && (
                                  <div>
                                    <p className="text-slate-500 text-xs mb-1">SSN Last 4</p>
                                    <p className="text-slate-200 font-mono">***-**-{s.ssnLast4}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <ClientDashboardAdminPanel
                            submissionId={s.id}
                            state={clientDashboards[s.id]}
                            loading={Boolean(dashboardLoading[s.id])}
                            temporaryPassword={dashboardPasswords[s.id]}
                            onCreateAccount={(id) => upsertClientAccount(id)}
                            onResetPassword={(id) => upsertClientAccount(id, true)}
                            onSaveReport={saveBureauReport}
                            onAddUpdate={addClientUpdate}
                            onViewDocument={downloadSecureFile}
                            intakeDocuments={[
                              ...(s.idDocPath ? [{ key: "photo_id", label: "View Photo ID", token: s.idDocPath, icon: "image" as const }] : []),
                              ...(s.utilityDocPath ? [{ key: "utility_bill", label: "View Utility Bill", token: s.utilityDocPath, icon: "file" as const }] : []),
                              ...(s.creditReportDocPath ? [{ key: "credit_report", label: "View Credit Report", token: s.creditReportDocPath, icon: "file" as const }] : []),
                            ]}
                            signature={signatures[s.id]}
                            onViewSignature={viewSignature}
                          />
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
