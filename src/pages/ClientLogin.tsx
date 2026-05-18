import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { Navigation } from "../components/Navigation";

const CLIENT_TOKEN_KEY = "clientPortalJwt";
const CLIENT_EMAIL_KEY = "clientPortalEmail";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || localStorage.getItem(CLIENT_EMAIL_KEY) || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CLIENT_TOKEN_KEY)) {
      navigate("/client-dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Login failed.");

      localStorage.setItem(CLIENT_TOKEN_KEY, data.token);
      localStorage.setItem(CLIENT_EMAIL_KEY, data.email);
      navigate("/client-dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fb]">
      <Navigation minimal />
      <main className="min-h-screen px-4 pt-28 pb-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e5a8a] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-950">Client Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to view document status, bureau scores, dispute progress, and updates from Zack.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#1e5a8a]/50 focus:bg-white focus:ring-2 focus:ring-[#1e5a8a]/15"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-[#1e5a8a]/50 focus:bg-white focus:ring-2 focus:ring-[#1e5a8a]/15"
                  placeholder="Temporary password"
                />
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e5a8a] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#17466d] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export { CLIENT_TOKEN_KEY, CLIENT_EMAIL_KEY };
