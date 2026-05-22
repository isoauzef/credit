import { useState, useEffect, FormEvent, ChangeEvent, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Shield,
  Clock,
  FileText,
  Mail,
  RefreshCw,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Award,
  Zap,
  BadgeCheck,
  Search,
  Star,
  MapPin,
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Copy,
  X,
  Edit3,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Platforms } from "../components/Platforms";
import SignatureCanvas from "../components/SignatureCanvas";
import svgPaths from "../imports/svg-6ltl2tuh8w";
import emblemBlue from "../assets/df36f4e1f0ac313fd0c673284d92e4bd4202491a.png";
import emblemDark from "../assets/cc179f68e1f2cdec4f23e00b5ae695644333bf02.png";
import emblemTransparent from "../assets/939d05bc0607ad5ec76c880ea7052eade6ac13fe.png";
import { usePageContent } from "../hooks/usePageContent";
import { trackFacebookPurchase } from "../lib/facebookPixel";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

/* ------------------------------------------------------------------ */
/*  Hero Section                                                       */
/* ------------------------------------------------------------------ */
function CheckoutHero() {
  const cms = usePageContent<{
    badge?: string;
    headingLine1?: string;
    headingLine2?: string;
    description?: string;
    ctaText?: string;
    subtext?: string;
    kpiItems?: Array<{ label: string }>;
  }>("checkout", "hero");

  const kpiItems = (cms?.kpiItems ?? [
    { label: "No Upfront Costs" },
    { label: "100% Legal & Compliant" },
    { label: "Success-Based Pricing" },
    { label: "Results in 3 Weeks" },
  ]).map((item, i) => {
    const icons = [Check, Shield, CreditCard, Clock];
    const gradients = ["from-green-400 to-emerald-500", "from-blue-400 to-cyan-500", "from-purple-400 to-pink-500", "from-orange-400 to-amber-500"];
    return { ...item, icon: icons[i % icons.length], gradient: gradients[i % gradients.length] };
  });

  return (
    <section
      className="relative min-h-[600px] lg:min-h-[700px] flex items-center"
      style={{ background: "linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))" }}
    >
      {/* Gradient overlay — same as homepage */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-slate-900/20" />

      {/* SVG Background Emblems — same as homepage */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={emblemBlue} alt="" className="absolute -top-20 -right-20 w-96 h-96 opacity-[0.1]" />
        <img src={emblemDark} alt="" className="absolute -bottom-24 -left-24 w-80 h-80 opacity-[0.1]" />
        <img src={emblemTransparent} alt="" className="absolute top-32 left-16 w-40 h-40 opacity-[0.1]" />
        <img src={emblemBlue} alt="" className="absolute top-1/2 right-16 w-32 h-32 opacity-[0.1]" />
        <img src={emblemTransparent} alt="" className="absolute bottom-32 right-1/4 w-48 h-48 opacity-[0.1]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 lg:pt-40 lg:pb-24 w-full">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          {/* Heading — matches homepage text sizes */}
          <div className="space-y-6">
            <h1 className="text-white leading-tight">
              <span className="block text-4xl lg:text-5xl">{cms?.headingLine1 ?? "Remove Negative Google Reviews"}</span>
              <span className="block text-3xl lg:text-4xl text-cyan-200">
                {cms?.headingLine2 ?? "Flat Fee of $200 Per Review"}
              </span>
            </h1>

            <p className="text-white/90 text-xl lg:text-2xl leading-relaxed max-w-2xl mx-auto">
              {cms?.description ?? "That review isn't going away on its own — every week it sits there, it's pushing real customers straight to your competitors. We handle the full legal and technical removal process."}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <a
              href="#submit"
              className="group inline-flex items-center gap-2.5 bg-white text-gray-900 px-[16px] py-[14px] text-[17px] lg:px-8 lg:py-4 lg:text-lg rounded-full font-semibold shadow-2xl hover:shadow-[0_12px_48px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-all duration-200"
            >
              {cms?.ctaText ?? "Remove My Review — $0 Upfront"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-blue-100/60 text-sm">
              {cms?.subtext ?? "⏱ Most removals begin within 24–48 hours of submission"}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Trust Bar — inside hero so it shares the stacking context */}
      <div className="absolute bottom-0 left-0 right-0 z-20 hidden lg:block translate-y-1/2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4">
            {kpiItems.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                  <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-gray-700 text-sm font-medium leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Mobile — rendered between hero and stats on small screens      */
/* ------------------------------------------------------------------ */
function KPIMobile() {
  const cms = usePageContent<{
    kpiItems?: Array<{ label: string }>;
  }>("checkout", "hero");

  const items = (cms?.kpiItems ?? [
    { label: "No Upfront Costs" },
    { label: "100% Legal & Compliant" },
    { label: "Success-Based Pricing" },
    { label: "Results in 3 Weeks" },
  ]).map((item, i) => {
    const icons = [Check, Shield, CreditCard, Clock];
    const gradients = ["from-green-400 to-emerald-500", "from-blue-400 to-cyan-500", "from-purple-400 to-pink-500", "from-orange-400 to-amber-500"];
    return { ...item, icon: icons[i % icons.length], gradient: gradients[i % gradients.length] };
  });

  return (
    <section className="lg:hidden relative z-20 -mt-6 pb-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-4 flex flex-col items-center text-center"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-2 shadow-md`}>
                <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-gray-700 text-xs font-medium leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/* ------------------------------------------------------------------ */
function StatsBar() {
  const cms = usePageContent<{
    stats?: Array<{ value: string; label: string }>;
  }>("checkout", "statsBar");

  const stats = cms?.stats ?? [
    { value: "1,200+", label: "Reviews Removed" },
    { value: "100+", label: "Businesses Helped" },
    { value: "3 Wks", label: "Avg Removal Time" },
    { value: "$0", label: "If Not Removed" },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f2b3d, #1a3a5c, #2c3e50)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 lg:pt-28 lg:pb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {stats.map((stat, i) => (
            <div key={i} className="relative text-center px-4">
              <div className="text-3xl lg:text-4xl font-extrabold text-white mb-1.5 tracking-tight">
                {stat.value}
              </div>
              <p className="text-cyan-200/70 text-sm font-medium">{stat.label}</p>
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3-Step Process                                                     */
/* ------------------------------------------------------------------ */
function ProcessSteps() {
  const cms = usePageContent<{
    badge?: string;
    heading?: string;
    subheading?: string;
    ctaText?: string;
    steps?: Array<{ title: string; desc: string }>;
  }>("checkout", "processSteps");

  const steps = (cms?.steps ?? [
    {
      title: "Find Your Business",
      desc: "Search for your business by name — we'll pull up your Google listing and all its reviews so you can select the ones you want removed.",
    },
    {
      title: "We Handle the Removal",
      desc: "Using platform-compliant methods and legal procedures, we work to get the review permanently removed — keeping you updated throughout.",
    },
    {
      title: "Pay Only If It Works",
      desc: "Your card is charged only after successful removal. If we can't remove it — you owe nothing.",
    },
  ]).map((s, i) => {
    const icons = [Search, Shield, CreditCard];
    const gradients = ["from-blue-500 to-cyan-500", "from-violet-500 to-indigo-500", "from-emerald-500 to-green-500"];
    return { ...s, icon: icons[i % icons.length], gradient: gradients[i % gradients.length] };
  });

  return (
    <section id="how-it-works" className="relative py-12 lg:py-16 bg-white scroll-mt-20 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.03),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1e5a8a] rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-100">
            <Zap className="w-4 h-4" />
            {cms?.badge ?? "How It Works"}
          </div>
          <h2 className="text-gray-900 text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            {cms?.heading ?? "Our Simple 3-Step Process"}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            {cms?.subheading ?? "Transparent, legally compliant, and built around one thing: getting your review removed."}
          </p>
        </div>

        {/* Horizontal timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-emerald-200" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="group relative flex flex-col items-center text-center">
                  {/* Step number circle */}
                  <div className={`relative z-10 w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${step.gradient} p-[3px] mb-5 shadow-xl shadow-blue-500/15 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-[#1e5a8a]" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">{i + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <a
            href="#submit"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-blue-900/15 hover:shadow-xl hover:shadow-blue-900/20 hover:scale-[1.02] transition-all duration-200"
          >
            {cms?.ctaText ?? "Ready to get started?"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                        */
/* ------------------------------------------------------------------ */
function CheckoutFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const cms = usePageContent<{
    badge?: string;
    heading?: string;
    subheading?: string;
    faqs?: Array<{ q: string; a: string }>;
  }>("checkout", "faq");

  const faqs = cms?.faqs ?? [
    {
      q: "Is this legal? Will I get in trouble with Google?",
      a: "Yes, our methods are 100% legal and compliant with all platform terms of service. We use proper legal channels and policy-based arguments to request removal. You will never be penalized.",
    },
    {
      q: "How long does the removal process take?",
      a: "Most reviews are removed within 2–3 weeks. Some cases resolve faster, while complex situations may take slightly longer. We keep you updated throughout the entire process.",
    },
    {
      q: "What if the review can't be removed? Do I still pay?",
      a: "No. You only pay the $200 fee after the review has been successfully and permanently removed. If we can't get it removed, you owe nothing.",
    },
    {
      q: "Should I keep flagging the review while you're working on it?",
      a: "No. Please do not interact with, flag, or respond to the review while we are actively working on your case. This can interfere with the removal process.",
    },
  ];

  return (
    <section id="faq" className="relative py-12 lg:py-16 scroll-mt-20 overflow-hidden" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-indigo-200/15 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white text-[#1e5a8a] rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-100 shadow-sm">
            <BadgeCheck className="w-4 h-4" />
            {cms?.badge ?? "FAQ"}
          </div>
          <h2 className="text-gray-900 text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            {cms?.heading ?? "Everything You Need to Know"}
          </h2>
          <p className="text-gray-500 text-lg">
            {cms?.subheading ?? "Answers to the most common questions before businesses submit their first removal request."}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 shadow-sm ${
                  isOpen
                    ? "border-[#1e5a8a]/20 bg-white shadow-md"
                    : "border-white/80 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-gray-200 hover:shadow-md"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left"
                >
                  <span className={`pr-4 font-medium ${isOpen ? "text-[#1e5a8a]" : "text-gray-900"}`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                      isOpen ? "rotate-180 text-[#1e5a8a]" : "text-gray-400"
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? '24rem' : '0px', opacity: isOpen ? 1 : 0 }}
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Credit-Repair Checkout Form (3 steps + Stripe SetupIntent)         */
/* ------------------------------------------------------------------ */
interface CreditRepairForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  ssn: string;
}

const blankCreditForm: CreditRepairForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dob: "",
  ssn: "",
};

interface UploadedDoc {
  token: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface PortalCredentials {
  email: string;
  temporaryPassword: string | null;
  loginUrl: string;
  dashboardUrl: string;
  created: boolean;
  passwordReset: boolean;
}

type EmailAvailability = {
  status: "idle" | "checking" | "available" | "exists" | "error";
  checkedEmail?: string;
  message?: string;
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

async function convertHeicIfNeeded(file: File): Promise<File> {
  // iPhone Camera defaults to HEIC. Browsers can't decode HEIC in <canvas>,
  // so convert it to JPEG client-side before any further processing.
  const isHeic =
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  try {
    // Lazy-load — keeps the ~700KB dependency out of the initial bundle.
    const mod = await import("heic2any");
    const heic2any = (mod as { default: (opts: unknown) => Promise<Blob | Blob[]> }).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(out) ? out[0] : out;
    const newName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    throw new Error("Could not read this HEIC image. Please convert it to JPEG first.");
  }
}

async function compressImageIfNeeded(file: File): Promise<File> {
  // Only attempt to compress JPEG/PNG raster images. PDFs are passed through.
  if (!/^image\/(jpeg|png)$/i.test(file.type)) return file;
  // Files under 4MB are kept as-is (already reasonable for KMS-encrypted storage).
  if (file.size <= 4 * 1024 * 1024) return file;
  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not decode image."));
      i.src = dataUrl;
    });
    const MAX_DIM = 2200;
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    const renamed = file.name.replace(/\.(png|jpe?g)$/i, ".jpg");
    return new File([blob], renamed, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function uploadSecureFile(file: File): Promise<UploadedDoc> {
  const decoded = await convertHeicIfNeeded(file);
  const optimized = await compressImageIfNeeded(decoded);
  const fd = new FormData();
  fd.append("file", optimized);
  const resp = await fetch("/api/secure-uploads", { method: "POST", body: fd });
  if (!resp.ok) {
    if (resp.status === 413) {
      throw new Error("File is too large. Please use a smaller image (max ~50MB).");
    }
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.message || `Upload failed (${resp.status})`);
  }
  return await resp.json();
}

function FileDropzone({
  label,
  accept,
  doc,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  accept: string;
  doc: UploadedDoc | null;
  onChange: (doc: UploadedDoc | null) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState(false);
  const inputId = useMemo(() => `file_${Math.random().toString(36).slice(2)}`, []);

  const onFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadSecureFile(file);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (skipped && !doc) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 bg-gray-50/40">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">
            <span className="font-medium">{label}</span>
            <span className="ml-2 text-xs text-gray-400">— skipped</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSkipped(false)}
          className="text-xs text-[#1e5a8a] hover:underline whitespace-nowrap"
        >
          Add it
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm text-gray-700 font-medium mb-1.5">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1.5">({hint})</span>}
      </label>
      <label
        htmlFor={inputId}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition ${
          doc
            ? "border-green-300 bg-green-50/40"
            : "border-gray-300 bg-gray-50/50 hover:border-[#1e5a8a]/50 hover:bg-blue-50/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-[#1e5a8a] animate-spin" />
            <span className="text-sm text-gray-600">Uploading…</span>
          </>
        ) : doc ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-sm text-gray-800 font-medium truncate max-w-full">{doc.originalName}</span>
            <span className="text-xs text-gray-500">{(doc.size / 1024).toFixed(0)} KB · click to replace</span>
          </>
        ) : (
          <>
            <Plus className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-600">Click to upload</span>
            <span className="text-xs text-gray-400">JPG, PNG or PDF · max 10MB</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      <div className="mt-1 flex items-center justify-between">
        <div>
          {doc && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
        {!doc && !uploading && (
          <button
            type="button"
            onClick={() => setSkipped(true)}
            className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
          >
            skip if you don’t have it
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Personal Info", "Authorization", "Add Card"];
  return (
    <div className="flex items-center justify-between gap-2 mb-8">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 ${
                active ? "text-[#1e5a8a]" : done ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  active
                    ? "bg-[#1e5a8a] text-white"
                    : done
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 rounded ${done ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmissionForm() {
  const cms = usePageContent<{
    sectionHeading?: string;
    sectionSubheading?: string;
    successHeading?: string;
    successMessage?: string;
  }>("checkout", "form");

  const [form, setForm] = useState<CreditRepairForm>({ ...blankCreditForm });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [pricingAgreed, setPricingAgreed] = useState(true);

  const [status, setStatus] = useState<"idle" | "submitting" | "card_step" | "saving_card" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Stripe state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [setupIntentId, setSetupIntentId] = useState("");
  const [portalCredentials, setPortalCredentials] = useState<PortalCredentials | null>(null);
  const [copiedPortalField, setCopiedPortalField] = useState<"email" | "password" | null>(null);
  const [emailCheck, setEmailCheck] = useState<EmailAvailability>({ status: "idle" });

  // Scroll-to-top of the form card whenever step (or the card_step status) changes
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);
  const copyFeedbackTimeout = useRef<number | null>(null);
  const purchaseEventTrackedRef = useRef(false);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = formCardRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80; // 80px breathing room above
    window.scrollTo({ top, behavior: "smooth" });
  }, [step, status]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeout.current) window.clearTimeout(copyFeedbackTimeout.current);
    };
  }, []);

  const copyPortalValue = useCallback(async (field: "email" | "password", value?: string | null) => {
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedPortalField(field);
      if (copyFeedbackTimeout.current) window.clearTimeout(copyFeedbackTimeout.current);
      copyFeedbackTimeout.current = window.setTimeout(() => setCopiedPortalField(null), 1600);
    } catch (_) {
      setCopiedPortalField(null);
    }
  }, []);

  useEffect(() => {
    if (status !== "card_step" || stripePromise) return;
    fetch("/api/stripe-publishable-key")
      .then((r) => r.json())
      .then((d) => {
        if (d?.publishableKey) {
          // Diagnostic: surface the Stripe mode + key prefix so a publishable/secret
          // mismatch (e.g. live PK + test client_secret) can be spotted in DevTools.
          console.log(
            "[Stripe] mode=%s keyMode=%s pkPrefix=%s clientSecretPrefix=%s",
            d.mode,
            d.keyMode,
            String(d.publishableKey).slice(0, 12),
            clientSecret ? clientSecret.slice(0, 12) : "(not yet)"
          );
          if (d.mode && d.keyMode && d.mode !== d.keyMode) {
            setErrorMsg(
              `Stripe configuration mismatch: mode is "${d.mode}" but the publishable key looks like "${d.keyMode}". Please re-save your Stripe settings.`
            );
            return;
          }
          setStripePromise(loadStripe(d.publishableKey));
        } else {
          setErrorMsg("Stripe is not configured.");
        }
      })
      .catch(() => setErrorMsg("Could not load payment provider."));
  }, [status, stripePromise, clientSecret]);

  const update = <K extends keyof CreditRepairForm>(key: K, value: CreditRepairForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (key === "email") {
      setEmailCheck({ status: "idle" });
      setErrorMsg("");
    }
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }, []);

  // ── Per-step validation ──
  // Field label map used by the summary banner so error text is human-readable.
  const FIELD_LABELS: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    address: "Home Address",
    dob: "Date of Birth",
    ssn: "Last 4 of SSN",
  };

  const duplicateEmailMessage =
    "An application already exists for this email address. Please log in to your client dashboard or contact support.";

  const checkEmailAvailability = useCallback(async () => {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return "invalid" as const;
    }

    setEmailCheck({ status: "checking", checkedEmail: normalizedEmail });
    try {
      const resp = await fetch(`/api/credit-repair-checkout/email-exists?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.message || "Could not check this email right now.");
      }
      if (data?.exists) {
        setEmailCheck({ status: "exists", checkedEmail: normalizedEmail, message: duplicateEmailMessage });
        setErrorMsg(duplicateEmailMessage);
        return "exists" as const;
      }
      setEmailCheck({ status: "available", checkedEmail: normalizedEmail });
      return "available" as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not check this email right now.";
      setEmailCheck({ status: "error", checkedEmail: normalizedEmail, message });
      setErrorMsg(message);
      return "error" as const;
    }
  }, [form.email]);

  const step1Errors = useMemo(() => {
    const errs: Partial<Record<keyof CreditRepairForm, string>> = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) errs.email = "Enter a valid email";
    else if (emailCheck.checkedEmail === normalizedEmail && emailCheck.status === "checking") errs.email = "Checking email...";
    else if (emailCheck.checkedEmail === normalizedEmail && emailCheck.status === "exists") errs.email = emailCheck.message || duplicateEmailMessage;
    else if (emailCheck.checkedEmail === normalizedEmail && emailCheck.status === "error") errs.email = emailCheck.message || "Could not check this email right now.";
    if (form.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a 10-digit phone number";
    if (!form.address.trim()) errs.address = "Required";
    else if (!/^\d/.test(form.address.trim())) errs.address = "Address must start with a street number (e.g. 123 Main St)";
    else if (form.address.trim().length < 5) errs.address = "Enter your full street address";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) errs.dob = "Required";
    if (form.ssn.replace(/\D/g, "").length !== 4) errs.ssn = "Enter the last 4 digits of your SSN";
    return errs;
  }, [duplicateEmailMessage, emailCheck, form]);

  const [showStep1Errors, setShowStep1Errors] = useState(false);

  const goNext = async () => {
    if (step === 1) {
      let currentStep1Errors = step1Errors;
      const normalizedEmail = form.email.trim().toLowerCase();
      if (
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail) &&
        !(emailCheck.checkedEmail === normalizedEmail && emailCheck.status === "available")
      ) {
        const result = await checkEmailAvailability();
        if (result === "exists" || result === "error") {
          setShowStep1Errors(true);
          return;
        }
        if (result === "available" && currentStep1Errors.email === "Checking email...") {
          currentStep1Errors = { ...currentStep1Errors };
          delete currentStep1Errors.email;
        }
      }
      if (Object.keys(currentStep1Errors).length > 0) {
        setShowStep1Errors(true);
        const list = Object.keys(currentStep1Errors)
          .map((k) => FIELD_LABELS[k] || k)
          .join(", ");
        setErrorMsg(`Please fix: ${list}.`);
        return;
      }
      setShowStep1Errors(false);
      setErrorMsg("");
      setStep(2);
      return;
    }
  };

  const goBack = () => {
    setErrorMsg("");
    if (status === "card_step") {
      setStatus("idle");
      setStep(2);
      return;
    }
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const authLetterText = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim() || "[Your Name]";
    const address = form.address || "[Your Address]";
    const phone = form.phone || "[Your Phone]";
    const dobDisplay = form.dob
      ? new Date(form.dob + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "[Your DOB]";
    const ssnDisplay = form.ssn ? `***-**-${form.ssn.replace(/\D/g, "").slice(-4)}` : "[Last 4 of SSN]";

    return [
      todayStr,
      "",
      "To Whom It May Concern at Equifax, Experian, and TransUnion:",
      "",
      `I, ${name}, hereby authorize the staff of CreditRemovers to act on my behalf in all matters relating to the review and dispute of items on my credit reports.`,
      "",
      "This authorization includes, but is not limited to, the right to:",
      "  • Obtain copies of my credit reports from any of the three major credit bureaus,",
      "  • Initiate disputes and inquiries on items I have identified as inaccurate, outdated, or unverifiable,",
      "  • Communicate with creditors, collection agencies, and other furnishers of information on my behalf,",
      "  • Receive and review correspondence regarding such disputes.",
      "",
      "My identifying information:",
      `  Full Name:        ${name}`,
      `  Date of Birth:    ${dobDisplay}`,
      `  Address:          ${address}`,
      `  Phone:            ${phone}`,
      `  SSN:              ${ssnDisplay}`,
      "",
      "Sincerely,",
      name,
    ].join("\n");
  }, [form, todayStr]);

  const handleSubmitForReview = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle" && status !== "error") return;
    if (Object.keys(step1Errors).length) {
      setErrorMsg("Please complete all previous steps.");
      return;
    }
    if (signatureEmpty || !signatureDataUrl) {
      setErrorMsg("Please draw your signature.");
      return;
    }
    if (!pricingAgreed) {
      setErrorMsg("Please agree to the pricing terms to proceed.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");

    try {
      const resp = await fetch("/api/credit-repair-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          address: form.address.trim(),
          dob: form.dob,
          ssn: form.ssn.replace(/\D/g, ""),
          idDocToken: null,
          utilityDocToken: null,
          creditReportDocToken: null,
          signatureDataUrl,
          authLetterSnapshot: authLetterText,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message || "Submission failed");
      }
      setClientSecret(data.clientSecret);
      setSetupIntentId(data.setupIntentId);
      setStatus("card_step");
      setStep(3);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed.");
    }
  };

  const handleCardSaved = async (intentId: string) => {
    try {
      const resp = await fetch("/api/finalize-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupIntentId: intentId }),
      });
      const data = await resp.json().catch(() => null);
      if (data?.portal) {
        setPortalCredentials(data.portal);
      }
    } catch (_) {
      /* non-blocking */
    }
    if (!purchaseEventTrackedRef.current) {
      trackFacebookPurchase({ value: 200, currency: "USD" });
      purchaseEventTrackedRef.current = true;
    }
    setStatus("success");
  };

  // ── Success screen ──
  const currentNormalizedEmail = form.email.trim().toLowerCase();
  const shouldShowEmailCheck =
    emailCheck.checkedEmail === currentNormalizedEmail &&
    (emailCheck.status === "checking" || emailCheck.status === "exists" || emailCheck.status === "error");
  const emailFieldError = showStep1Errors || shouldShowEmailCheck ? step1Errors.email : undefined;

  if (status === "success") {
    return (
      <section id="submit" className="py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">
            {cms?.successHeading ?? "You're all set!"}
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            {cms?.successMessage ??
              "Your application has been received. We'll review your documents and contact you shortly to begin disputing items on your credit report."}
          </p>
          <p className="text-gray-500 text-sm mt-6">
            A confirmation email is on its way to <span className="font-medium">{form.email}</span>.
          </p>
          {portalCredentials && (
            <div className="mt-8 text-left rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-900/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#1e5a8a]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">Client Dashboard Login</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Use this dashboard to upload missing documents and follow credit repair updates.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 break-words">{portalCredentials.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyPortalValue("email", portalCredentials.email)}
                      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-[#1e5a8a]/30 hover:text-[#1e5a8a] focus:outline-none focus:ring-2 focus:ring-[#1e5a8a]/30"
                      aria-label="Copy client dashboard email"
                      title={copiedPortalField === "email" ? "Copied" : "Copy email"}
                    >
                      {copiedPortalField === "email" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {portalCredentials.temporaryPassword && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Temporary Password</p>
                        <p className="font-mono font-semibold text-gray-900 break-all">{portalCredentials.temporaryPassword}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyPortalValue("password", portalCredentials.temporaryPassword)}
                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-[#1e5a8a]/30 hover:text-[#1e5a8a] focus:outline-none focus:ring-2 focus:ring-[#1e5a8a]/30"
                        aria-label="Copy client dashboard temporary password"
                        title={copiedPortalField === "password" ? "Copied" : "Copy temporary password"}
                      >
                        {copiedPortalField === "password" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <a
                href={portalCredentials.loginUrl || "/client-login"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e5a8a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 hover:bg-[#17466d] transition"
              >
                Open Client Dashboard <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-3">
            {cms?.sectionHeading ?? "Start Your Credit Repair"}
          </h2>
          <p className="text-gray-600 text-lg">
            {cms?.sectionSubheading ??
              "Complete the secure intake below. Your information is encrypted end-to-end."}
          </p>
        </div>

        <div ref={formCardRef} className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-6 sm:p-10 scroll-mt-24">
          <StepIndicator step={step} />

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="firstName" label="First Name" required error={showStep1Errors ? step1Errors.firstName : undefined}>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={`${inputClass} ${showStep1Errors && step1Errors.firstName ? "border-red-300 ring-2 ring-red-100" : ""}`}
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                  />
                </Field>
                <Field id="lastName" label="Last Name" required error={showStep1Errors ? step1Errors.lastName : undefined}>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className={`${inputClass} ${showStep1Errors && step1Errors.lastName ? "border-red-300 ring-2 ring-red-100" : ""}`}
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="email" label="Email" required error={emailFieldError}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`${inputClass} ${emailFieldError ? "border-red-300 ring-2 ring-red-100" : ""}`}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() => { void checkEmailAvailability(); }}
                  />
                </Field>
                <Field id="phone" label="Phone" required error={showStep1Errors ? step1Errors.phone : undefined}>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`${inputClass} ${showStep1Errors && step1Errors.phone ? "border-red-300 ring-2 ring-red-100" : ""}`}
                    value={form.phone}
                    onChange={(e) => update("phone", formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </Field>
              </div>

              <Field id="address" label="Home Address" required hint="street, city, state, zip" error={showStep1Errors ? step1Errors.address : undefined}>
                <input
                  id="address"
                  type="text"
                  inputMode="text"
                  autoComplete="street-address"
                  className={`${inputClass} ${showStep1Errors && step1Errors.address ? "border-red-300 ring-2 ring-red-100" : ""}`}
                  value={form.address}
                  onChange={(e) => {
                    let v = e.target.value;
                    // First non-whitespace character must be a digit (street number).
                    const trimmedStart = v.replace(/^\s+/, "");
                    if (trimmedStart.length > 0 && !/^\d/.test(trimmedStart)) {
                      v = trimmedStart.replace(/^\D+/, "");
                    }
                    update("address", v);
                  }}
                  placeholder="123 Main St, Springfield, IL 62704"
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="dob" label="Date of Birth" required error={showStep1Errors ? step1Errors.dob : undefined}>
                  <input
                    id="dob"
                    type="date"
                    autoComplete="bday"
                    className={`${inputClass} ${showStep1Errors && step1Errors.dob ? "border-red-300 ring-2 ring-red-100" : ""}`}
                    value={form.dob}
                    onChange={(e) => update("dob", e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <Field id="ssn" label="Last 4 of SSN" required error={showStep1Errors ? step1Errors.ssn : undefined}>
                  <div className="relative">
                    <input
                      id="ssn"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className={`${inputClass} pr-10 font-mono tracking-wider ${showStep1Errors && step1Errors.ssn ? "border-red-300 ring-2 ring-red-100" : ""}`}
                      value={form.ssn}
                      onChange={(e) => update("ssn", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="1234"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </Field>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50/40 rounded-lg px-3 py-2">
                <Shield className="w-4 h-4 text-[#1e5a8a] flex-shrink-0" />
                Only the last 4 digits of your SSN are stored for identity verification.
              </div>
            </div>
          )}

          {/* ── Step 2: Authorization & Signature ── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Please review the credit-bureau authorization letter below. By signing, you authorize CreditRemovers to
                act on your behalf with Equifax, Experian, and TransUnion.
              </p>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-4">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed">
{authLetterText}
                </pre>
              </div>

              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1.5">
                  Your Signature <span className="text-red-400 ml-0.5">*</span>
                </label>
                <SignatureCanvas
                  height={170}
                  onChange={(dataUrl, empty) => {
                    setSignatureDataUrl(dataUrl);
                    setSignatureEmpty(empty);
                  }}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={pricingAgreed}
                  onChange={(e) => setPricingAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e5a8a] focus:ring-[#1e5a8a]/30"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to Credit Removers pricing: <strong>$200 one time fee charged only after successful removals.</strong>
                  <span className="text-red-400 ml-0.5">*</span>
                </span>
              </label>
            </div>
          )}

          {/* ── Step 3: Save Card ── */}
          {step === 3 && (status === "card_step" || status === "saving_card") && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Finally, save a card on file. <strong>No charge is made today</strong> — your card is only charged once we confirm the removals.
              </p>
              {stripePromise && clientSecret ? (
                // PaymentElement requires clientSecret in Elements options.
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                  <CardForm
                    clientSecret={clientSecret}
                    onSuccess={handleCardSaved}
                    onError={(m) => setErrorMsg(m)}
                    saving={status === "saving_card"}
                    setSaving={(v) => setStatus(v ? "saving_card" : "card_step")}
                    pricePerReview={0}
                    reviewCount={0}
                  />
                </Elements>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading secure payment form…
                </div>
              )}
            </div>
          )}

          {/* ── Error ── */}
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          {step !== 3 && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || status === "submitting"}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/15 hover:shadow-xl hover:scale-[1.01] transition"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={status === "submitting"}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/15 hover:shadow-xl hover:scale-[1.01] transition disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Add Card <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {step === 3 && status !== "saving_card" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/*  Stripe Card Form (inside Elements provider)                        */
/* ------------------------------------------------------------------ */
function CardForm({
  clientSecret,
  onSuccess,
  onError,
  saving,
  setSaving,
  pricePerReview,
  reviewCount,
  cardTitle,
  cardSubtitle,
  cardButtonText,
  cardSavingText,
  cardSecurityText,
}: {
  clientSecret: string;
  onSuccess: (setupIntentId: string) => void;
  onError: (msg: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  pricePerReview: number;
  reviewCount: number;
  cardTitle?: string;
  cardSubtitle?: string;
  cardButtonText?: string;
  cardSavingText?: string;
  cardSecurityText?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardReady, setCardReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSaveCard = async () => {
    if (!stripe || !elements) {
      setErrorMsg("Payment form is still loading. Please wait a moment.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      // Submit the PaymentElement first (required before confirmSetup).
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error("[Stripe elements.submit error]", submitError);
        setErrorMsg(submitError.message || "Card verification failed.");
        onError(submitError.message || "Card verification failed.");
        setSaving(false);
        return;
      }

      // Confirm the SetupIntent. `redirect: "if_required"` keeps us on-page
      // unless the bank forces 3DS challenge.
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        console.error("[Stripe confirmSetup error]", error);
        // Block prepaid cards after the fact (PaymentElement doesn't expose funding before confirm).
        setErrorMsg(error.message || "Card verification failed.");
        onError(error.message || "Card verification failed.");
        setSaving(false);
      } else if (setupIntent?.status === "succeeded") {
        // Check funding type to reject prepaid cards.
        try {
          const pmId = typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
          if (pmId) {
            const fundingResp = await fetch(`/api/payment-method-funding?id=${encodeURIComponent(pmId)}`);
            if (fundingResp.ok) {
              const data = await fundingResp.json();
              if (data?.funding === "prepaid") {
                setErrorMsg("Prepaid cards are not accepted. Please use a debit or credit card.");
                onError("Prepaid cards are not accepted. Please use a debit or credit card.");
                setSaving(false);
                return;
              }
            }
          }
        } catch {
          // Non-fatal — proceed even if funding lookup fails.
        }
        onSuccess(setupIntent.id);
      } else if (setupIntent?.status === "requires_action") {
        setErrorMsg("Your bank requires additional verification. Please follow the prompts.");
        setSaving(false);
      } else {
        setErrorMsg("Unexpected status. Please try again.");
        setSaving(false);
      }
    } catch (err) {
      console.error("[Stripe handleSaveCard exception]", err);
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMsg(msg);
      onError(msg);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-[#1e5a8a]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{cardTitle ?? "Save Card on File"}</h3>
          <p className="text-sm text-gray-500">{cardSubtitle ?? "Your card will only be charged upon successful removal."}</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50/50 focus-within:border-[#1e5a8a]/40 focus-within:ring-2 focus-within:ring-[#1e5a8a]/20 focus-within:bg-white transition-all">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
            business: { name: "CreditRemovers.com" },
          }}
          onReady={() => setCardReady(true)}
          onChange={(e) => setCardReady(e.complete)}
        />
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={handleSaveCard}
        disabled={!stripe || !cardReady || saving}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-900/15 hover:shadow-xl hover:shadow-blue-900/20 hover:scale-[1.005] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {cardSavingText ?? "Saving Card…"}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {cardButtonText ?? "Save Card on File"}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock className="w-3 h-3" />
        <span>{cardSecurityText ?? "Secured by Stripe. Your card is not charged today."}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable form helpers                                              */
/* ------------------------------------------------------------------ */
const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm bg-gray-50/50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#1e5a8a]/20 focus:border-[#1e5a8a]/40 outline-none transition-all duration-150";

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-700 font-medium mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1.5">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

function CheckboxField({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e5a8a] focus:ring-[#1e5a8a]/30 transition"
      />
      <span className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
        {children} <span className="text-red-400">*</span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Composition                                                   */
/* ------------------------------------------------------------------ */
export default function ReviewRemovalCheckout() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation minimal clientLoginOnly />
      <CheckoutHero />
      <KPIMobile />
      <StatsBar />
      <Platforms showBills showCta={false} />
      <ProcessSteps />
      <CheckoutFAQ />
      <SubmissionForm />
      <Footer svgPaths={svgPaths} />
    </div>
  );
}
