import { useState } from "react";
import { useAdminAuth } from "../../hooks/useAdmin";
import { Save, KeyRound, Mail } from "lucide-react";

export default function AccountSettings() {
  const { token, adminEmail, updateToken } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSave = async () => {
    if (!currentPassword) {
      setMsg({ type: "err", text: "Current password is required." });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMsg({ type: "err", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setMsg({ type: "err", text: "New passwords don't match." });
      return;
    }
    if (!newEmail.trim() && !newPassword) {
      setMsg({ type: "err", text: "Enter a new email or password to update." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          ...(newEmail.trim() && { newEmail: newEmail.trim() }),
          ...(newPassword && { newPassword }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.message || "Update failed." });
        return;
      }
      // Update JWT and email in context
      if (data.token && data.email) {
        updateToken(data.token, data.email);
      }
      setMsg({ type: "ok", text: "Account updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewEmail("");
    } catch {
      setMsg({ type: "err", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Change your admin email and password.</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Current info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-base font-semibold text-white mb-3">Current Account</h2>
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-slate-500" />
            <span className="text-slate-300">{adminEmail || "—"}</span>
          </div>
        </div>

        {/* Change form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">Update Credentials</h2>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Current Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>

          <hr className="border-slate-800" />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              New Email <span className="text-slate-600">(leave blank to keep current)</span>
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={adminEmail || "admin@example.com"}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              New Password <span className="text-slate-600">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              autoComplete="new-password"
            />
          </div>

          {newPassword && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                autoComplete="new-password"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Update Account"}
            </button>
            {msg && (
              <span className={`text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
