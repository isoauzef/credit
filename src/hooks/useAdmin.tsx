import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────
export type ContactSubmission = {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone: string;
  companyName?: string | null;
  companyAddress?: string | null;
  businessLocations?: string | null;
  platform?: string | null;
  negativeReviewsNeedRemoving?: string | null;
  budgetPerRemoval?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CheckoutSubmission = {
  id: number;
  name: string;
  email: string;
  companyName: string;
  googleDataId?: string | null;
  reviewLinks: any[];
  reason?: string | null;
  quantity: number;
  amount: number;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  paymentStatus: string;
  createdAt: string;
};

export type EmailTemplate = {
  id: number;
  slug: string;
  name: string;
  subject: string;
  previewText?: string | null;
  content: unknown;
  enabled: boolean;
};

export type Settings = Record<string, Record<string, string>>;

export type DashboardStats = {
  totalContacts: number;
  totalCheckouts: number;
  authorized: number;
  captured: number;
  revenue: number;
};

// ── Auth context ─────────────────────────────────────────────────
const TOKEN_KEY = "adminJwt";
const EMAIL_KEY = "adminEmail";

type AdminAuthCtx = {
  token: string | null;
  adminEmail: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateToken: (token: string, email: string) => void;
};

const AuthContext = createContext<AdminAuthCtx>({
  token: null,
  adminEmail: null,
  isAuthenticated: false,
  login: async () => ({ ok: false }),
  logout: () => {},
  updateToken: () => {},
});

export function useAdminAuth() {
  return useContext(AuthContext);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  );
  const [adminEmail, setAdminEmail] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(EMAIL_KEY) : null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  // verify stored JWT on mount
  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    adminFetch("/api/admin/me", token)
      .then((user: any) => {
        setAdminEmail(user.email);
        setIsAuthenticated(true);
        setChecked(true);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        setToken(null);
        setAdminEmail(null);
        setChecked(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || "Login failed" };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(EMAIL_KEY, data.email);
      setToken(data.token);
      setAdminEmail(data.email);
      setIsAuthenticated(true);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
  }, []);

  const updateToken = useCallback((newToken: string, newEmail: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(EMAIL_KEY, newEmail);
    setToken(newToken);
    setAdminEmail(newEmail);
  }, []);

  if (!checked) return null;

  return (
    <AuthContext.Provider value={{ token, adminEmail, isAuthenticated, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Fetch helper ─────────────────────────────────────────────────
async function adminFetch(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(!init?.body || typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────────
export function useAdminApi<T>(path: string) {
  const { token } = useAdminAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const d = await adminFetch(path, token);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback(
    async (method: string, body?: unknown, subPath = "") => {
      if (!token) throw new Error("Not authenticated");
      const url = subPath ? `${path}${subPath}` : path;
      return adminFetch(url, token, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
    [path, token]
  );

  return { data, loading, error, reload: load, mutate };
}

// For file uploads
export function useAdminUpload() {
  const { token } = useAdminAuth();

  return useCallback(
    async (file: File): Promise<{ path: string; filename: string }> => {
      if (!token) throw new Error("Not authenticated");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    [token]
  );
}
