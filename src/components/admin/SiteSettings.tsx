import { useState, useEffect } from "react";
import { useAdminApi, useAdminUpload } from "../../hooks/useAdmin";
import { Save, Upload, Image } from "lucide-react";

type SiteSettings = Record<string, string>;

export default function SiteSettingsPage() {
  const { data, loading, reload, mutate } = useAdminApi<Record<string, SiteSettings>>(
    "/api/admin/settings"
  );
  const upload = useAdminUpload();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (data?.site) setForm(data.site);
  }, [data]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (key: string, file: File) => {
    try {
      const result = await upload(file);
      updateField(key, result.path);
    } catch {
      alert("Upload failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await mutate("PUT", form);
      setMsg("Site settings saved!");
      reload();
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <div className="h-60 rounded-xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage website title, logo, and favicon.</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
        <h2 className="text-lg font-semibold text-white">Page Titles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: "site_title_homepage", label: "Homepage Title" },
            { key: "site_title_checkout", label: "Checkout Page Title" },
            { key: "site_title_admin", label: "Admin Page Title" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{f.label}</label>
              <input
                value={form[f.key] || ""}
                onChange={(e) => updateField(f.key, e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
        <h2 className="text-lg font-semibold text-white">Branding</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { key: "site_logo", label: "Site Logo" },
            { key: "site_favicon", label: "Site Favicon" },
          ].map((f) => (
            <div key={f.key} className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">{f.label}</label>
              {form[f.key] && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800">
                  <Image size={16} className="text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-300 truncate">{form[f.key]}</span>
                </div>
              )}
              <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-400 transition">
                <Upload size={16} />
                Upload new file
                <input
                  type="file"
                  accept="image/*,.ico,.svg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(f.key, file);
                  }}
                />
              </label>
              <input
                value={form[f.key] || ""}
                onChange={(e) => updateField(f.key, e.target.value)}
                placeholder="Or enter path manually"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Site Settings"}
        </button>
        {msg && (
          <span
            className={`text-sm ${msg.includes("saved") ? "text-emerald-400" : "text-red-400"}`}
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
