import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../../hooks/useAdmin";
import { Save, RefreshCw, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

/* ── types ────────────────────────────────────────────────────── */
type SectionData = Record<string, any>;
type PageDataMap = Record<string, SectionData>;

/* ── page / section list ─────────────────────────────────────── */
const PAGES = [
  {
    page: "homepage",
    label: "Homepage",
    sections: ["hero", "statistics", "platforms", "features", "establishment", "reviews", "testimonials", "faq", "caseStudies", "footer"],
  },
  {
    page: "checkout",
    label: "Checkout Page",
    sections: ["hero", "statsBar", "processSteps", "faq", "submissionForm"],
  },
];

/* ── field schema registry ───────────────────────────────────── */
type FT = "text" | "textarea" | "number" | "string-list" | "obj-list";
type FieldDef = { type: FT; label: string; fields?: Record<string, { type: "text" | "textarea" | "number"; label: string }>; itemLabel?: string };
type Schema = Record<string, FieldDef>;

const t = (label: string): FieldDef => ({ type: "text", label });
const ta = (label: string): FieldDef => ({ type: "textarea", label });
const n = (label: string): FieldDef => ({ type: "number", label });
const sl = (label: string): FieldDef => ({ type: "string-list", label });
const ol = (label: string, itemLabel: string, fields: Record<string, { type: "text" | "textarea" | "number"; label: string }>): FieldDef => ({
  type: "obj-list",
  label,
  itemLabel,
  fields,
});

const SCHEMAS: Record<string, Schema> = {
  "homepage/hero": {
    badge: t("Badge"),
    headingLine1: t("Heading Line 1"),
    headingLine2: t("Heading Line 2"),
    description: ta("Description"),
    formTitle: t("Form Title"),
    formSubtitle: t("Form Subtitle"),
    kpiStats: ol("KPI Stats", "Stat", { value: { type: "text", label: "Value" }, label: { type: "text", label: "Label" } }),
  },
  "homepage/statistics": {
    stats: ol("Statistics", "Stat", { percentage: { type: "text", label: "Percentage" }, label: { type: "text", label: "Label" }, description: { type: "text", label: "Description" } }),
  },
  "homepage/platforms": {
    heading: t("Heading"),
    subheading: ta("Subheading"),
    platformList: sl("Platforms"),
  },
  "homepage/features": {
    heading: t("Heading"),
    subheading: ta("Subheading"),
    features: ol("Features", "Feature", { title: { type: "text", label: "Title" }, description: { type: "textarea", label: "Description" } }),
  },
  "homepage/establishment": {
    headingLine1: t("Heading Line 1"),
    headingLine2: t("Heading Line 2"),
    description: ta("Description"),
    benefits: sl("Benefits"),
    platformsHeading: t("Platforms Heading"),
    platforms: sl("Platforms"),
  },
  "homepage/reviews": {
    headingLine1: t("Heading Line 1"),
    headingLine2: t("Heading Line 2"),
    description: ta("Description"),
    benefits: sl("Benefits"),
    stats: ol("Stats", "Stat", { value: { type: "text", label: "Value" }, label: { type: "text", label: "Label" } }),
  },
  "homepage/testimonials": {
    heading: t("Heading"),
    subheading: ta("Subheading"),
    testimonials: ol("Testimonials", "Testimonial", { name: { type: "text", label: "Name" }, role: { type: "text", label: "Role" }, rating: { type: "number", label: "Rating" }, text: { type: "textarea", label: "Review Text" } }),
  },
  "homepage/faq": {
    heading: t("Heading"),
    subheading: ta("Subheading"),
    faqs: ol("FAQs", "FAQ", { question: { type: "text", label: "Question" }, answer: { type: "textarea", label: "Answer" } }),
    ctaHeading: t("CTA Heading"),
    ctaText: ta("CTA Text"),
  },
  "homepage/caseStudies": {
    heading: t("Section Heading"),
    subheading: ta("Section Subheading"),
    title: t("Title"),
    description: sl("Description Paragraphs"),
    stats: { type: "obj-list", label: "Stats", itemLabel: "Stat", fields: { text: { type: "text", label: "Text (comma-separated lines)" } } },
  },
  "homepage/footer": {
    description: ta("Description"),
    contactEmail: t("Contact Email"),
    contactLocation: t("Contact Location"),
    services: sl("Services"),
    copyrightText: t("Copyright Text (use {year} for current year)"),
  },
  "checkout/hero": {
    badge: t("Badge"),
    headingLine1: t("Heading Line 1"),
    headingLine2: t("Heading Line 2"),
    description: ta("Description"),
    ctaText: t("CTA Text"),
    subtext: t("Subtext"),
    kpiItems: ol("KPI Items", "KPI", { label: { type: "text", label: "Label" }, gradient: { type: "text", label: "Gradient (Tailwind)" } }),
  },
  "checkout/statsBar": {
    stats: ol("Stats", "Stat", { value: { type: "text", label: "Value" }, label: { type: "text", label: "Label" } }),
  },
  "checkout/processSteps": {
    badge: t("Badge"),
    heading: t("Heading"),
    subheading: ta("Subheading"),
    ctaText: t("CTA Text"),
    steps: ol("Steps", "Step", { title: { type: "text", label: "Title" }, desc: { type: "textarea", label: "Description" } }),
  },
  "checkout/faq": {
    badge: t("Badge"),
    heading: t("Heading"),
    subheading: ta("Subheading"),
    faqs: ol("FAQs", "FAQ", { q: { type: "text", label: "Question" }, a: { type: "textarea", label: "Answer" } }),
  },
  "checkout/submissionForm": {
    badge: t("Badge"),
    heading: t("Heading"),
    subheading: ta("Subheading"),
    searchTitle: t("Search Step Title"),
    searchSubtitle: t("Search Step Subtitle"),
    buttonText: t("Submit Button Text"),
    buttonSubtext: t("Submit Button Subtext"),
    disclaimer: ta("Disclaimer"),
    pricePerReview: n("Price Per Review ($)"),
    // Step labels
    step1Label: t("Step 1 Label"),
    step2Label: t("Step 2 Label"),
    step3Label: t("Step 3 Label"),
    continueText: t("Continue Button Text"),
    // Step 2 — Reviews
    reviewsTitle: t("Reviews Step Title"),
    reviewsSubtitle: t("Reviews Step Subtitle"),
    pricingInfo: t("Pricing Info Text"),
    selectAllText: t("Select All Text"),
    loadMoreText: t("Load More Text"),
    // Step 3 — Manual entry
    manualEntryLink: t("Manual Entry Link Text"),
    manualEntryTitle: t("Manual Entry Title"),
    // Step 3 — Form
    selectedReviewsLabel: t("Selected Reviews Label"),
    contactInfoLabel: t("Contact Info Label"),
    agreement1: ta("Agreement Checkbox 1 (use {price} for price)"),
    agreement2: ta("Agreement Checkbox 2 (use {price} for price)"),
    // Card step
    cardTitle: t("Card Step Title"),
    cardSubtitle: t("Card Step Subtitle"),
    cardButtonText: t("Card Button Text"),
    cardSavingText: t("Card Saving Text"),
    cardSecurityText: t("Card Security Text"),
    // Success
    successTitle: t("Success Title"),
    successMessage: ta("Success Message"),
  },
};

/* ── main component ──────────────────────────────────────────── */
export default function ContentManager() {
  const { token } = useAdminAuth();
  const [pageData, setPageData] = useState<Record<string, PageDataMap>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editData, setEditData] = useState<SectionData>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const results: Record<string, PageDataMap> = {};
      for (const p of PAGES) {
        const res = await fetch(`/api/admin/page-content/${p.page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) results[p.page] = await res.json();
      }
      setPageData(results);
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectSection = (page: string, section: string) => {
    const key = `${page}/${section}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    const content = pageData[page]?.[section];
    setEditData(content && typeof content === "object" ? JSON.parse(JSON.stringify(content)) : {});
    setMsg("");
  };

  const set = useCallback((path: string, value: any) => {
    setEditData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
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
    if (!expanded || !token) return;
    const [page, section] = expanded.split("/");
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-content/${page}/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editData }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Saved!");
      loadAll();
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Edit section content for all pages — each field is individually editable.</p>
        </div>
        <button onClick={loadAll} disabled={loading} className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-slate-800 animate-pulse" />
      ) : (
        <div className="space-y-4">
          {PAGES.map((p) => (
            <div key={p.page} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80">
                <h2 className="text-base font-semibold text-white">{p.label}</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {p.sections.map((section) => {
                  const key = `${p.page}/${section}`;
                  const isOpen = expanded === key;
                  const schema = SCHEMAS[key];
                  return (
                    <div key={section}>
                      <button onClick={() => selectSection(p.page, section)} className="flex w-full items-center justify-between px-5 py-3 text-sm text-left hover:bg-slate-800/50 transition">
                        <span className="font-medium text-slate-200">{section}</span>
                        {isOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 space-y-4">
                          {schema ? (
                            Object.entries(schema).map(([fieldKey, fieldDef]) => (
                              <FieldRenderer key={fieldKey} fieldKey={fieldKey} def={fieldDef} data={editData} set={set} />
                            ))
                          ) : (
                            <FallbackEditor data={editData} onChange={setEditData} />
                          )}
                          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                              <Save size={16} /> {saving ? "Saving..." : "Save Section"}
                            </button>
                            {msg && <span className={`text-sm ${msg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>{msg}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Field renderers
   ═══════════════════════════════════════════════════════════════ */

const inputCls = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

function FieldRenderer({ fieldKey, def, data, set }: { fieldKey: string; def: FieldDef; data: SectionData; set: (path: string, val: any) => void }) {
  const value = data[fieldKey];

  if (def.type === "text") {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{def.label}</label>
        <input value={value ?? ""} onChange={(e) => set(fieldKey, e.target.value)} className={inputCls} />
      </div>
    );
  }

  if (def.type === "textarea") {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{def.label}</label>
        <textarea value={value ?? ""} onChange={(e) => set(fieldKey, e.target.value)} rows={3} className={inputCls + " resize-y"} />
      </div>
    );
  }

  if (def.type === "number") {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{def.label}</label>
        <input type="number" value={value ?? 0} onChange={(e) => set(fieldKey, Number(e.target.value))} className={inputCls + " max-w-xs"} />
      </div>
    );
  }

  if (def.type === "string-list") {
    const items: string[] = Array.isArray(value) ? value : [];
    const upd = (i: number, v: string) => { const n = [...items]; n[i] = v; set(fieldKey, n); };
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-400">{def.label}</label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-xs text-slate-600 mt-2.5 w-5 shrink-0 text-right">{i + 1}.</span>
            <input value={item} onChange={(e) => upd(i, e.target.value)} className={inputCls + " flex-1"} />
            <button onClick={() => set(fieldKey, items.filter((_, idx) => idx !== i))} className="mt-1.5 text-red-400 hover:text-red-300 shrink-0"><Trash2 size={15} /></button>
          </div>
        ))}
        <button onClick={() => set(fieldKey, [...items, ""])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus size={14} /> Add item</button>
      </div>
    );
  }

  if (def.type === "obj-list" && def.fields) {
    const items: any[] = Array.isArray(value) ? value : [];
    const fieldEntries = Object.entries(def.fields);

    // Case studies stats have a `text` field that's actually an array
    const isCaseStudyStats = fieldEntries.length === 1 && fieldEntries[0][0] === "text";

    const upd = (i: number, k: string, v: any) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it));
      set(fieldKey, next);
    };

    const emptyItem = () => {
      const obj: Record<string, any> = {};
      for (const [k, fd] of fieldEntries) {
        if (isCaseStudyStats && k === "text") obj[k] = [];
        else if (fd.type === "number") obj[k] = 0;
        else obj[k] = "";
      }
      return obj;
    };

    return (
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-400">{def.label}</label>
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{def.itemLabel} #{i + 1}</span>
              <button onClick={() => set(fieldKey, items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
            </div>
            {isCaseStudyStats ? (
              <CaseStudyStatLines lines={Array.isArray(item.text) ? item.text : []} onChange={(lines) => upd(i, "text", lines)} />
            ) : (
              fieldEntries.map(([k, fd]) => (
                <div key={k}>
                  <label className="block text-xs text-slate-500 mb-0.5">{fd.label}</label>
                  {fd.type === "textarea" ? (
                    <textarea value={item[k] ?? ""} onChange={(e) => upd(i, k, e.target.value)} rows={2} className={inputCls + " resize-y"} />
                  ) : fd.type === "number" ? (
                    <input type="number" value={item[k] ?? 0} onChange={(e) => upd(i, k, Number(e.target.value))} className={inputCls + " max-w-xs"} />
                  ) : (
                    <input value={item[k] ?? ""} onChange={(e) => upd(i, k, e.target.value)} className={inputCls} />
                  )}
                </div>
              ))
            )}
          </div>
        ))}
        <button onClick={() => set(fieldKey, [...items, emptyItem()])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
          <Plus size={14} /> Add {def.itemLabel}
        </button>
      </div>
    );
  }

  return null;
}

/* Case study stats have text as string[] */
function CaseStudyStatLines({ lines, onChange }: { lines: string[]; onChange: (v: string[]) => void }) {
  const upd = (i: number, v: string) => { const n = [...lines]; n[i] = v; onChange(n); };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-slate-500">Text Lines</label>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={line} onChange={(e) => upd(i, e.target.value)} className={inputCls + " flex-1"} />
          <button onClick={() => onChange(lines.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...lines, ""])} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus size={14} /> Add line</button>
    </div>
  );
}

/* Fallback for sections with no schema */
function FallbackEditor({ data, onChange }: { data: SectionData; onChange: (v: SectionData) => void }) {
  const [raw, setRaw] = useState(JSON.stringify(data, null, 2));
  useEffect(() => { setRaw(JSON.stringify(data, null, 2)); }, [data]);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">Raw JSON (no schema available)</label>
      <textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          try { onChange(JSON.parse(e.target.value)); } catch {}
        }}
        rows={14}
        className={inputCls + " font-mono resize-y"}
      />
    </div>
  );
}
