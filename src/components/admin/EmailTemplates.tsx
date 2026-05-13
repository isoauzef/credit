import { useState, useEffect, useCallback } from "react";
import { useAdminApi, type EmailTemplate } from "../../hooks/useAdmin";
import { Save, ToggleLeft, ToggleRight, Plus, Trash2 } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────── */
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

type Content = Record<string, any>;

function parseContent(tpl: EmailTemplate): Content {
  if (!tpl.content) return {};
  return typeof tpl.content === "string" ? JSON.parse(tpl.content) : deepClone(tpl.content);
}

/* ── main component ──────────────────────────────────────────── */
export default function EmailTemplates() {
  const { data, loading, reload, mutate } = useAdminApi<EmailTemplate[]>(
    "/api/admin/email-templates"
  );
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState<Content>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (selected) {
      setSubject(selected.subject);
      setPreviewText(selected.previewText || "");
      setContent(parseContent(selected));
      setMsg("");
    }
  }, [selected]);

  useEffect(() => {
    if (data?.length && !selected) setSelected(data[0]);
  }, [data]); // eslint-disable-line

  const set = useCallback((path: string, value: any) => {
    setContent((prev) => {
      const next = deepClone(prev);
      const keys = path.split(".");
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg("");
    try {
      await mutate("PUT", { subject, previewText, content }, `/${selected.slug}`);
      setMsg("Saved!");
      reload();
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tpl: EmailTemplate) => {
    try {
      await mutate("PUT", { enabled: !tpl.enabled }, `/${tpl.slug}`);
      reload();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Templates</h1>
        <p className="text-sm text-slate-400 mt-1">
          Edit structured template data — each field is individually editable.
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-slate-800 animate-pulse" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Template list */}
          <div className="space-y-2">
            {data?.map((t) => (
              <button
                key={t.slug}
                onClick={() => setSelected(t)}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  selected?.slug === t.slug
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(t);
                    }}
                    title={t.enabled ? "Disable" : "Enable"}
                  >
                    {t.enabled ? (
                      <ToggleRight size={22} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={22} className="text-slate-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t.slug}</p>
              </button>
            ))}
          </div>

          {/* Structured editor */}
          {selected && (
            <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-y-auto max-h-[calc(100vh-180px)]">
              {/* Subject + preview */}
              <Sec title="Subject & Preview">
                <F label="Subject" value={subject} onChange={setSubject} />
                <F label="Preview Text" value={previewText} onChange={setPreviewText} />
              </Sec>

              {/* Hero */}
              {content.hero && (
                <Sec title="Hero / Greeting">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <F label="Heading" value={content.hero.heading || ""} onChange={(v) => set("hero.heading", v)} />
                    <F label="Subheading" value={content.hero.subheading || ""} onChange={(v) => set("hero.subheading", v)} />
                    <F label="Greeting Prefix" value={content.hero.greetingPrefix || ""} onChange={(v) => set("hero.greetingPrefix", v)} />
                  </div>
                  <StringList label="Intro Paragraphs" items={content.hero.introParagraphs || []} onChange={(v) => set("hero.introParagraphs", v)} multiline />
                  <FA label="Callout" value={content.hero.callout || ""} onChange={(v) => set("hero.callout", v)} />
                </Sec>
              )}

              {/* Rep */}
              {content.rep && (
                <Sec title="Sales Rep">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <F label="First Name" value={content.rep.firstName || ""} onChange={(v) => set("rep.firstName", v)} />
                    <F label="Full Name" value={content.rep.fullName || ""} onChange={(v) => set("rep.fullName", v)} />
                    <F label="Title" value={content.rep.title || ""} onChange={(v) => set("rep.title", v)} />
                    <F label="Direct Phone" value={content.rep.directPhone || ""} onChange={(v) => set("rep.directPhone", v)} />
                    <F label="Email" value={content.rep.email || ""} onChange={(v) => set("rep.email", v)} />
                    <F label="Hours" value={content.rep.hours || ""} onChange={(v) => set("rep.hours", v)} />
                  </div>
                </Sec>
              )}

              {/* Service Assurances */}
              {content.serviceAssurances && (
                <Sec title="Service Assurances">
                  <StringList label="" items={content.serviceAssurances} onChange={(v) => set("serviceAssurances", v)} multiline />
                </Sec>
              )}

              {/* FAQs */}
              {content.faqs && (
                <Sec title="FAQs">
                  <FaqList items={content.faqs} onChange={(v) => set("faqs", v)} qKey="question" aKey="answer" />
                </Sec>
              )}

              {/* Proof Points */}
              {content.proofPoints && (
                <Sec title="Proof Points">
                  <StringList label="" items={content.proofPoints} onChange={(v) => set("proofPoints", v)} multiline />
                </Sec>
              )}

              {/* Signature */}
              {content.signature !== undefined && (
                <Sec title="Signature">
                  <F label="Signature" value={content.signature || ""} onChange={(v) => set("signature", v)} />
                </Sec>
              )}

              {/* Footer */}
              {content.footer && (
                <Sec title="Footer">
                  <FA label="Disclaimer" value={content.footer.disclaimer || ""} onChange={(v) => set("footer.disclaimer", v)} />
                  <F label="Address" value={content.footer.address || ""} onChange={(v) => set("footer.address", v)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <F label="Unsubscribe Text" value={content.footer.unsubscribeText || ""} onChange={(v) => set("footer.unsubscribeText", v)} />
                    <F label="Unsubscribe URL" value={content.footer.unsubscribeUrl || ""} onChange={(v) => set("footer.unsubscribeUrl", v)} />
                  </div>
                </Sec>
              )}

              {/* Social Links */}
              <Sec title="Social Links">
                <KVList items={content.socialLinks || []} onChange={(v) => set("socialLinks", v)} lKey="label" vKey="href" lLabel="Platform" vLabel="URL" />
              </Sec>

              {/* Save */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Template"}
                </button>
                {msg && (
                  <span className={`text-sm ${msg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>
                    {msg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Reusable sub-components
   ═══════════════════════════════════════════════════════════════ */

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-1">{title}</h3>
      {children}
    </div>
  );
}

function F({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>}
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function FA({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={inputCls + " resize-y"} />
    </div>
  );
}

function StringList({ label, items, onChange, multiline }: { label: string; items: string[]; onChange: (v: string[]) => void; multiline?: boolean }) {
  const upd = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-slate-400">{label}</label>}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-xs text-slate-600 mt-2.5 w-5 shrink-0 text-right">{i + 1}.</span>
          {multiline ? (
            <textarea value={item} onChange={(e) => upd(i, e.target.value)} rows={2} className={inputCls + " flex-1 resize-y"} />
          ) : (
            <input value={item} onChange={(e) => upd(i, e.target.value)} className={inputCls + " flex-1"} />
          )}
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="mt-1.5 text-red-400 hover:text-red-300 shrink-0">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
        <Plus size={14} /> Add item
      </button>
    </div>
  );
}

function FaqList({ items, onChange, qKey, aKey }: { items: Array<Record<string, string>>; onChange: (v: Array<Record<string, string>>) => void; qKey: string; aKey: string }) {
  const upd = (i: number, k: string, v: string) => { const n = items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)); onChange(n); };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">FAQ #{i + 1}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
          <input value={item[qKey] || ""} onChange={(e) => upd(i, qKey, e.target.value)} placeholder="Question" className={inputCls} />
          <textarea value={item[aKey] || ""} onChange={(e) => upd(i, aKey, e.target.value)} placeholder="Answer" rows={2} className={inputCls + " resize-y"} />
        </div>
      ))}
      <button onClick={() => onChange([...items, { [qKey]: "", [aKey]: "" }])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
        <Plus size={14} /> Add FAQ
      </button>
    </div>
  );
}

function KVList({ items, onChange, lKey, vKey, lLabel, vLabel }: { items: Array<Record<string, string>>; onChange: (v: Array<Record<string, string>>) => void; lKey: string; vKey: string; lLabel: string; vLabel: string }) {
  const upd = (i: number, k: string, v: string) => { const n = items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)); onChange(n); };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={item[lKey] || ""} onChange={(e) => upd(i, lKey, e.target.value)} placeholder={lLabel} className={inputCls + " flex-1"} />
          <input value={item[vKey] || ""} onChange={(e) => upd(i, vKey, e.target.value)} placeholder={vLabel} className={inputCls + " flex-1"} />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { [lKey]: "", [vKey]: "" }])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
        <Plus size={14} /> Add
      </button>
    </div>
  );
}
