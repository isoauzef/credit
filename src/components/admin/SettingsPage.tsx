import { useState, useEffect } from "react";
import { useAdminApi, type Settings as SettingsType } from "../../hooks/useAdmin";
import { Save, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { data, loading, reload, mutate } = useAdminApi<SettingsType>("/api/admin/settings");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data) {
      const flat: Record<string, string> = {};
      for (const group of Object.values(data)) {
        for (const [k, v] of Object.entries(group)) flat[k] = v;
      }
      setForm(flat);
    }
  }, [data]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await mutate("PUT", form);
      setMsg("Settings saved!");
      reload();
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const SECRET_KEYS = [
    "stripe_test_secret_key",
    "stripe_live_secret_key",
    "stripe_test_webhook_secret",
    "stripe_live_webhook_secret",
    "smtp_pass",
    "serpapi_api_key",
    "google_places_api_key",
    "crm_api_key",
  ];

  const isSecret = (key: string) => SECRET_KEYS.includes(key);

  const GROUPS = [
    {
      title: "Stripe Configuration",
      desc: "Payment gateway keys and mode settings.",
      keys: [
        { key: "stripe_mode", label: "Mode", type: "select", options: ["test", "live"] },
        { key: "stripe_price_per_review", label: "Price Per Review (cents)", hint: "e.g. 40000 = $400" },
        { key: "stripe_price_tier2_threshold", label: "Tier 2 Threshold (quantity)", hint: "e.g. 10 — applies to 10+ reviews" },
        { key: "stripe_price_tier2", label: "Tier 2 Price Per Review (cents)", hint: "e.g. 30000 = $300" },
        { key: "stripe_price_tier3_threshold", label: "Tier 3 Threshold (quantity)", hint: "e.g. 20 — applies to 20+ reviews" },
        { key: "stripe_price_tier3", label: "Tier 3 Price Per Review (cents)", hint: "e.g. 20000 = $200" },
        { key: "stripe_test_publishable_key", label: "Test Publishable Key" },
        { key: "stripe_test_secret_key", label: "Test Secret Key" },
        { key: "stripe_test_webhook_secret", label: "Test Webhook Secret" },
        { key: "stripe_live_publishable_key", label: "Live Publishable Key" },
        { key: "stripe_live_secret_key", label: "Live Secret Key" },
        { key: "stripe_live_webhook_secret", label: "Live Webhook Secret" },
      ],
    },
    {
      title: "SMTP / Email",
      desc: "Outgoing mail server configuration.",
      keys: [
        { key: "smtp_host", label: "SMTP Host" },
        { key: "smtp_port", label: "Port" },
        { key: "smtp_secure", label: "Secure (TLS)", type: "select", options: ["true", "false"] },
        { key: "smtp_user", label: "Username" },
        { key: "smtp_pass", label: "Password" },
        { key: "smtp_from", label: "From Address" },
        { key: "smtp_reply_to", label: "Reply-To" },
      ],
    },
    {
      title: "Email Toggles",
      desc: "Enable or disable automated emails.",
      keys: [
        { key: "email_quote_enabled", label: "Quote Auto-Response", type: "select", options: ["true", "false"] },
        { key: "email_checkout_enabled", label: "Checkout Success Email", type: "select", options: ["true", "false"] },
      ],
    },
    {
      title: "Google & Search APIs",
      desc: "API keys for business search and review fetching.",
      keys: [
        { key: "google_places_api_key", label: "Google Places API Key" },
        { key: "serpapi_api_key", label: "SerpAPI Key" },
      ],
    },
    {
      title: "CRM Integration",
      desc: "ReviewCleaners CRM (lead sync). Leave API key blank to disable.",
      keys: [
        { key: "crm_api_key", label: "CRM API Key" },
        { key: "crm_base_url", label: "CRM Base URL", hint: "Default: https://crm.reviewcleaners.com" },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="h-60 rounded-xl bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage Stripe, SMTP, and email notification settings.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section
          key={group.title}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">{group.title}</h2>
            <p className="text-xs text-slate-500">{group.desc}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.keys.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {field.label}
                  {(field as any).hint && <span className="text-slate-600 font-normal ml-1">— {(field as any).hint}</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={form[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {field.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type={isSecret(field.key) && !showSecrets[field.key] ? "password" : "text"}
                      value={form[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none pr-9"
                    />
                    {isSecret(field.key) && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecrets((p) => ({ ...p, [field.key]: !p[field.key] }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showSecrets[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save All Settings"}
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
