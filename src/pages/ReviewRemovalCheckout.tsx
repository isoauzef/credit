import { useState, useEffect, FormEvent, ChangeEvent, useCallback, useMemo } from "react";
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
  X,
  Edit3,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import svgPaths from "../imports/svg-6ltl2tuh8w";
import emblemBlue from "../assets/df36f4e1f0ac313fd0c673284d92e4bd4202491a.png";
import emblemDark from "../assets/cc179f68e1f2cdec4f23e00b5ae695644333bf02.png";
import emblemTransparent from "../assets/939d05bc0607ad5ec76c880ea7052eade6ac13fe.png";
import { usePageContent } from "../hooks/usePageContent";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
                {cms?.headingLine2 ?? "Flat Fee of $400 Per Review"}
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
      a: "No. You only pay the $400 fee after the review has been successfully and permanently removed. If we can't get it removed, you owe nothing.",
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
/*  Submission / Checkout Form                                         */
/* ------------------------------------------------------------------ */
interface BusinessResult {
  data_id?: string;
  place_id: string;
  title: string;
  address: string;
  rating: number;
  reviews: number;
  type: string;
  thumbnail: string | null;
  googleMapsUri?: string | null;
}

interface SelectedReview {
  review_id: string;
  link: string;
  rating: number;
  date: string;
  snippet: string;
  userName: string;
  userThumbnail: string | null;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  selectedReviews: SelectedReview[];
  agreedTerms: boolean;
  agreedHold: boolean;
}

const blankForm: FormState = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  selectedReviews: [],
  agreedTerms: true,
  agreedHold: true,
};

function SubmissionForm() {
  const [form, setForm] = useState<FormState>({ ...blankForm });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "card_step" | "saving_card" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Stripe Elements state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState({
    base: 40000,
    tier2Threshold: 10,
    tier2Price: 30000,
    tier3Threshold: 20,
    tier3Price: 20000,
  });

  // Multi-step flow state
  const [step, setStep] = useState<"search" | "reviews" | "form">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BusinessResult[]>([]);
  const [searchLocation, setSearchLocation] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResult | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [fetchedReviews, setFetchedReviews] = useState<SelectedReview[]>([]);
  const [reviewsError, setReviewsError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Manual entry mode
  const [manualMode, setManualMode] = useState(false);
  const [manualBusinessName, setManualBusinessName] = useState("");
  const [manualLinks, setManualLinks] = useState<string[]>([""]);

  // Load Stripe publishable key and price on mount
  useEffect(() => {
    fetch("/api/stripe-publishable-key")
      .then((r) => r.json())
      .then((d) => { if (d.publishableKey) setStripePromise(loadStripe(d.publishableKey)); })
      .catch(() => {});
    fetch("/api/stripe-price")
      .then((r) => r.json())
      .then((d) => {
        if (d.pricePerReview) setPricingTiers({
          base: d.pricePerReview,
          tier2Threshold: d.tier2Threshold || 10,
          tier2Price: d.tier2Price || 30000,
          tier3Threshold: d.tier3Threshold || 20,
          tier3Price: d.tier3Price || 20000,
        });
      })
      .catch(() => {});
  }, []);

  const getUnitPriceCents = (count: number) => {
    if (count >= pricingTiers.tier3Threshold) return pricingTiers.tier3Price;
    if (count >= pricingTiers.tier2Threshold) return pricingTiers.tier2Price;
    return pricingTiers.base;
  };
  const getUnitPrice = (count: number) => getUnitPriceCents(count) / 100;

  const cms = usePageContent<{
    badge?: string;
    heading?: string;
    subheading?: string;
    buttonText?: string;
    buttonSubtext?: string;
    disclaimer?: string;
    pricePerReview?: number;
    searchTitle?: string;
    searchSubtitle?: string;
    // Step labels
    step1Label?: string;
    step2Label?: string;
    step3Label?: string;
    continueText?: string;
    // Reviews step
    reviewsTitle?: string;
    reviewsSubtitle?: string;
    pricingInfo?: string;
    selectAllText?: string;
    loadMoreText?: string;
    // Manual entry
    manualEntryLink?: string;
    manualEntryTitle?: string;
    // Form step
    selectedReviewsLabel?: string;
    contactInfoLabel?: string;
    agreement1?: string;
    agreement2?: string;
    // Card step
    cardTitle?: string;
    cardSubtitle?: string;
    cardButtonText?: string;
    cardSavingText?: string;
    cardSecurityText?: string;
    // Success
    successTitle?: string;
    successMessage?: string;
  }>("checkout", "submissionForm");

  const phoneDigits = form.phone.replace(/\D/g, "");
  const validNANP = phoneDigits.length === 10 && /^[2-9]/.test(phoneDigits);

  const canSubmit =
    form.name.trim() &&
    form.email.trim() &&
    validNANP &&
    form.companyName.trim() &&
    form.selectedReviews.length > 0 &&
    form.agreedTerms &&
    form.agreedHold;

  const formatPhone = (raw: string) => {
    // Strip everything except digits
    let digits = raw.replace(/\D/g, "");
    // Remove leading country code 1 (NANP area codes start with 2-9)
    if (digits.startsWith("1")) digits = digits.slice(1);
    // Cap at 10 digits
    digits = digits.slice(0, 10);
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // ── Search businesses ──
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    setSearchLocation(null);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/google/search-business?${params}`);
      if (!res.ok) throw new Error((await res.json()).message || "Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
      setSearchLocation(data.location || null);
      if ((data.results || []).length === 0) setSearchError("No businesses found. Try a different search term.");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // ── Manual entry submit ──
  const handleManualSubmit = useCallback(() => {
    const name = manualBusinessName.trim();
    if (!name) return;
    const validLinks = manualLinks.map((l) => l.trim()).filter(Boolean);
    if (validLinks.length === 0) return;
    const reviews: SelectedReview[] = validLinks.map((link, i) => ({
      review_id: `manual-${Date.now()}-${i}`,
      link,
      rating: 1,
      date: "",
      snippet: "",
      userName: `Review ${i + 1}`,
      userThumbnail: null,
    }));
    setForm((prev) => ({ ...prev, companyName: name, selectedReviews: reviews }));
    setSelectedBusiness({
      data_id: "manual",
      place_id: "manual",
      title: name,
      address: "Manually entered",
      rating: 0,
      reviews: 0,
      type: "",
      thumbnail: null,
    });
    setStep("form");
    setTimeout(() => document.getElementById("submit")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [manualBusinessName, manualLinks]);

  // ── Select business & fetch reviews ──
  const handleSelectBusiness = useCallback(async (biz: BusinessResult) => {
    setSelectedBusiness(biz);
    setForm((prev) => ({ ...prev, companyName: biz.title }));
    setStep("reviews");
    setReviewsLoading(true);
    setReviewsError("");
    setFetchedReviews([]);
    setNextPageToken(null);
    try {
      const reviewId = biz.data_id || biz.place_id;
      const res = await fetch(`/api/google/reviews/${encodeURIComponent(reviewId)}`);
      if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch reviews");
      const data = await res.json();
      setFetchedReviews(data.reviews || []);
      setNextPageToken(data.nextPageToken || null);
      if ((data.reviews || []).length === 0) {
        setReviewsError("No 1-2 star reviews found for this business.");
      }
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : "Failed to fetch reviews");
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // ── Load more reviews ──
  const handleLoadMore = useCallback(async () => {
    if (!selectedBusiness || !nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const reviewId = selectedBusiness.data_id || selectedBusiness.place_id;
      const params = new URLSearchParams({ nextPageToken });
      const res = await fetch(
        `/api/google/reviews/${encodeURIComponent(reviewId)}?${params}`
      );
      if (!res.ok) throw new Error("Failed to load more reviews");
      const data = await res.json();
      const newReviews: SelectedReview[] = data.reviews || [];
      setFetchedReviews((prev) => {
        const ids = new Set(prev.map((r) => r.review_id));
        return [...prev, ...newReviews.filter((r) => !ids.has(r.review_id))];
      });
      setNextPageToken(data.nextPageToken || null);
    } catch {
      // silently fail pagination
    } finally {
      setLoadingMore(false);
    }
  }, [selectedBusiness, nextPageToken, loadingMore]);

  // ── Toggle review selection ──
  const toggleReview = useCallback((review: SelectedReview) => {
    setForm((prev) => {
      const exists = prev.selectedReviews.some((r) => r.review_id === review.review_id);
      return {
        ...prev,
        selectedReviews: exists
          ? prev.selectedReviews.filter((r) => r.review_id !== review.review_id)
          : [...prev.selectedReviews, review],
      };
    });
  }, []);

  // ── Select all reviews ──
  const selectAllReviews = useCallback(() => {
    setForm((prev) => {
      const currentIds = new Set(prev.selectedReviews.map((r) => r.review_id));
      const newReviews = fetchedReviews.filter((r) => !currentIds.has(r.review_id));
      return { ...prev, selectedReviews: [...prev.selectedReviews, ...newReviews] };
    });
  }, [fetchedReviews]);

  // ── Submit form & create SetupIntent — then show card step ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ""),
          companyName: form.companyName,
          reviewLinks: form.selectedReviews,
          quantity: form.selectedReviews.length,
          googleDataId: selectedBusiness?.data_id || selectedBusiness?.place_id || null,
          placeId: selectedBusiness?.place_id || null,
          businessAddress: selectedBusiness?.address || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Could not create setup intent.");
      }

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStatus("card_step");
      } else {
        throw new Error("No client secret returned.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  // Card confirmation callback from CardForm
  const handleCardSuccess = (setupIntentId: string) => {
    setStatus("success");
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        value: reviewCount * pricePerReview,
        currency: "USD",
      });
    }
    // Finalize: PATCH CRM lead with Stripe IDs (fire-and-forget; non-blocking)
    fetch("/api/finalize-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId }),
    }).catch(() => {});
  };

  const handleCardError = (msg: string) => {
    setStatus("card_step");
    setErrorMsg(msg);
  };

  const reviewCount = form.selectedReviews.length;
  const pricePerReview = getUnitPrice(reviewCount);
  const totalPrice = reviewCount * pricePerReview;

  // ── Star rating display ──
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );

  return (
    <section id="submit" className="relative py-12 lg:py-16 bg-white scroll-mt-20 overflow-x-hidden">
      {/* Subtle bg decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-50/60 to-transparent rounded-full blur-3xl -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1e5a8a] rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-100">
            <FileText className="w-4 h-4" />
            {cms?.badge ?? "Get Started"}
          </div>
          <h2 className="text-gray-900 text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            {cms?.heading ?? "Start Your Review Removal Request"}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {cms?.subheading ?? "Search for your business, select the reviews you want removed, and we'll get started."}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step indicators */}
          <div id="checkout-steps" className="flex items-center justify-center gap-2 mb-8">
            {[
              { key: "search", label: cms?.step1Label ?? "Find Business" },
              { key: "reviews", label: cms?.step2Label ?? "Select Reviews" },
              { key: "form", label: cms?.step3Label ?? "Checkout" },
            ].map((s, i) => {
              const steps = ["search", "reviews", "form"];
              const currentIdx = steps.indexOf(step);
              const stepIdx = steps.indexOf(s.key);
              const isActive = step === s.key;
              const isDone = stepIdx < currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 h-px ${isDone ? "bg-[#1e5a8a]" : "bg-gray-200"}`} />}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? "bg-[#1e5a8a] text-white"
                          : isActive
                          ? "bg-[#1e5a8a] text-white ring-4 ring-blue-100"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ──────── STEP 1: Business Search ──────── */}
          {step === "search" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#1e5a8a] via-cyan-500 to-[#2c3e50]" />
              <div className="p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{cms?.searchTitle ?? "Find Your Business on Google Maps"}</h3>
                <p className="text-sm text-gray-500 mb-6">{cms?.searchSubtitle ?? "Search by business name to find and select your listing."}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Joe's Pizza New York"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className={inputClass + " pl-10 w-full"}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searchLoading || searchQuery.trim().length < 2}
                    className="sm:w-auto px-6 py-3 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {searchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search
                  </button>
                </div>

                {searchError && (
                  <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {searchError}
                  </div>
                )}

                {/* Enter Manually trigger — show after search error or always as a link */}
                {searchError && !manualMode && (
                  <button
                    type="button"
                    onClick={() => setManualMode(true)}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-[#1e5a8a] hover:text-[#1a3a5c] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Can't find your business? Enter details manually
                  </button>
                )}

                {/* Manual entry form */}
                {manualMode && (
                  <div className="mt-5 p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#1e5a8a]" />
                        {cms?.manualEntryTitle ?? "Enter Business Details Manually"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => { setManualMode(false); setManualBusinessName(""); setManualLinks([""]); }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 font-medium mb-1.5">
                        Business Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Joe's Pizza"
                        value={manualBusinessName}
                        onChange={(e) => setManualBusinessName(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 font-medium mb-1.5">
                        Google Review Link(s) <span className="text-red-400">*</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-2">Paste the link to each Google review you want removed.</p>
                      {manualLinks.map((link, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input
                            type="url"
                            placeholder="https://www.google.com/maps/reviews/..."
                            value={link}
                            onChange={(e) => {
                              const updated = [...manualLinks];
                              updated[i] = e.target.value;
                              setManualLinks(updated);
                            }}
                            className={inputClass + " flex-1"}
                          />
                          {manualLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setManualLinks(manualLinks.filter((_, j) => j !== i))}
                              className="px-2.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setManualLinks([...manualLinks, ""])}
                        className="flex items-center gap-1.5 text-sm text-[#1e5a8a] font-medium hover:text-[#1a3a5c] transition-colors mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add another review link
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualSubmit}
                      disabled={!manualBusinessName.trim() || !manualLinks.some((l) => l.trim())}
                      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-900/15 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {cms?.continueText ?? "Continue to Checkout"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        {searchResults.length} Results Found
                      </p>
                      {searchLocation && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {searchLocation}
                        </p>
                      )}
                    </div>
                    {searchResults.map((biz) => (
                      <button
                        key={biz.data_id || biz.place_id}
                        type="button"
                        onClick={() => handleSelectBusiness(biz)}
                        className="w-full relative flex items-start gap-2 lg:gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#1e5a8a]/30 hover:bg-blue-50/30 transition-all text-left group"
                      >
                        {biz.thumbnail ? (
                          <img
                            src={biz.thumbnail}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-[#1e5a8a] transition-colors truncate">
                            {biz.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${s <= Math.round(biz.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{biz.rating} ({biz.reviews} reviews)</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{biz.address}</span>
                          </div>
                          {biz.type && (
                            <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {biz.type}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#1e5a8a] flex-shrink-0 transition-colors absolute right-1.5 top-[5px] lg:static lg:mt-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────── STEP 2: Review Selection ──────── */}
          {step === "reviews" && selectedBusiness && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#1e5a8a] via-cyan-500 to-[#2c3e50]" />
              <div className="p-6 lg:p-8">
                {/* Selected business header */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setStep("search"); setSelectedBusiness(null); setForm((p) => ({ ...p, selectedReviews: [] })); }}
                    className="mt-1 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg">{selectedBusiness.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={Math.round(selectedBusiness.rating)} />
                      <span className="text-sm text-gray-500">{selectedBusiness.rating} ({selectedBusiness.reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {selectedBusiness.address}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{cms?.reviewsTitle ?? "Negative Reviews (1-2 Stars)"}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{cms?.reviewsSubtitle ?? "Select the reviews you want us to remove."}</p>
                    {(cms?.pricingInfo) && (
                      <p className="text-[14px] font-medium text-black mt-2.5">{cms.pricingInfo}</p>
                    )}
                  </div>
                  {fetchedReviews.length > 0 && (
                    <div className="flex justify-end mt-2.5">
                      <button
                        type="button"
                        onClick={selectAllReviews}
                        className="text-sm text-[#1e5a8a] font-medium hover:text-[#1a3a5c] transition-colors"
                      >
                        {cms?.selectAllText ?? "Select All"}
                      </button>
                    </div>
                  )}
                </div>

                {reviewsLoading && (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    <span className="text-sm">Fetching negative reviews…</span>
                  </div>
                )}

                {reviewsError && !reviewsLoading && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {reviewsError}
                  </div>
                )}

                {!reviewsLoading && fetchedReviews.length > 0 && (
                  <div className="space-y-3">
                    {fetchedReviews.map((review) => {
                      const isSelected = form.selectedReviews.some((r) => r.review_id === review.review_id);
                      return (
                        <div
                          key={review.review_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleReview(review)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleReview(review); } }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#1e5a8a] bg-blue-50/40 ring-1 ring-[#1e5a8a]/10"
                              : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected ? "bg-[#1e5a8a] border-[#1e5a8a]" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 mb-1">{review.userName}</div>
                              <div className="flex items-center justify-between mb-1">
                                <StarRating rating={review.rating} />
                                <span className="text-xs text-gray-400">{review.date}</span>
                              </div>
                              {review.snippet && (
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.snippet}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {nextPageToken && (
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full py-3 text-sm font-medium text-[#1e5a8a] bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {cms?.loadMoreText ?? "Load More Reviews"}
                      </button>
                    )}
                  </div>
                )}

                {/* Continue button */}
                {form.selectedReviews.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">{form.selectedReviews.length}</strong> review{form.selectedReviews.length !== 1 ? "s" : ""} selected
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        ${form.selectedReviews.length * getUnitPrice(form.selectedReviews.length)}
                        <span className="text-sm font-normal text-gray-500 ml-1">total</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep("form"); setTimeout(() => document.getElementById("checkout-steps")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-900/15 hover:shadow-xl hover:scale-[1.005] transition-all"
                    >
                      {cms?.continueText ?? "Continue to Checkout"}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────── STEP 3: Contact Info & Submit ──────── */}
          {step === "form" && (
            <div>
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 divide-y divide-gray-100 overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-[#1e5a8a] via-cyan-500 to-[#2c3e50]" />

                {/* Selected reviews summary */}
                <div className="p-6 lg:p-8 space-y-3">
                  <div className="flex items-start gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBusiness?.data_id === "manual") {
                          setStep("search");
                          setManualMode(true);
                        } else {
                          setStep("reviews");
                        }
                      }}
                      className="mt-0.5 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all flex-shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        {cms?.selectedReviewsLabel ?? "Selected Reviews"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{selectedBusiness?.title}</p>
                    </div>
                  </div>
                  {form.selectedReviews.map((r) => (
                    <div key={r.review_id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-[#1e5a8a] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{r.userName}</span>
                          {r.rating > 0 && <StarRating rating={r.rating} />}
                        </div>
                        {r.snippet && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.snippet}</p>}
                        {r.review_id.startsWith("manual-") && r.link && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{r.link}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, selectedReviews: p.selectedReviews.filter((x) => x.review_id !== r.review_id) }));
                          if (form.selectedReviews.length <= 1) setStep("reviews");
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">{reviewCount} review{reviewCount !== 1 ? "s" : ""} × ${pricePerReview}</span>
                    <span className="text-xl font-bold text-gray-900">${totalPrice}</span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="p-6 lg:p-8 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    {cms?.contactInfoLabel ?? "Contact Information"}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field id="ck-name" label="Your Name" required>
                      <input
                        id="ck-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="John Doe"
                      />
                    </Field>
                    <Field id="ck-email" label="Email Address" required>
                      <input
                        id="ck-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="john@company.com"
                      />
                    </Field>
                    <Field id="ck-phone" label="Phone Number" required>
                      <input
                        id="ck-phone"
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="(555) 987-6543"
                        maxLength={14}
                      />
                    </Field>
                  </div>
                </div>

                {/* Agreements + submit */}
                <div className="p-6 lg:p-8 space-y-5">
                  {status !== "card_step" && status !== "saving_card" && status !== "success" && (
                    <>
                      <div className="space-y-3">
                        <CheckboxField name="agreedTerms" checked={form.agreedTerms} onChange={handleChange}>
                          {cms?.agreement1
                            ? cms.agreement1.replace(/\{price\}/g, `$${pricePerReview}`)
                            : <>
                                I agree to Credit Removers'{" "}
                                <Link
                                  to="/terms-of-service"
                                  className="text-[#1e5a8a] underline underline-offset-2"
                                  target="_blank"
                                >
                                  terms
                                </Link>{" "}
                                and pricing. <strong>${pricePerReview} per review</strong>, paid only upon successful removal.
                              </>
                          }
                        </CheckboxField>
                        <CheckboxField name="agreedHold" checked={form.agreedHold} onChange={handleChange}>
                          {(cms?.agreement2 ?? "I understand my card will be securely saved on file. I will only be charged {price} per review upon successful removal.").replace(/\{price\}/g, `$${pricePerReview}`)}
                        </CheckboxField>
                      </div>

                      {status === "error" && errorMsg && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {errorMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!canSubmit || status === "loading"}
                        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#1e5a8a] to-[#2c3e50] text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-900/15 hover:shadow-xl hover:shadow-blue-900/20 hover:scale-[1.005] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {status === "loading" ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            {cms?.buttonText ?? "Fight My Reviews Now"}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      <p className="text-center text-gray-400 text-xs">{cms?.buttonSubtext ?? "Only pay when we win"}</p>
                    </>
                  )}

                  {/* ── Card Element Step ── */}
                  {(status === "card_step" || status === "saving_card") && clientSecret && stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CardForm
                        clientSecret={clientSecret}
                        onSuccess={handleCardSuccess}
                        onError={handleCardError}
                        saving={status === "saving_card"}
                        setSaving={(v) => setStatus(v ? "saving_card" : "card_step")}
                        pricePerReview={pricePerReview}
                        reviewCount={reviewCount}
                        cardTitle={cms?.cardTitle}
                        cardSubtitle={cms?.cardSubtitle}
                        cardButtonText={cms?.cardButtonText}
                        cardSavingText={cms?.cardSavingText}
                        cardSecurityText={cms?.cardSecurityText}
                      />
                    </Elements>
                  )}

                  {/* ── Inline Success ── */}
                  {status === "success" && (
                    <div className="text-center py-4 space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{cms?.successTitle ?? "Card Saved Successfully!"}</h3>
                      <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                        {cms?.successMessage ?? "Thank you for your submission. Our team will review your case and begin working on your review removal within 24 hours. You will only be charged upon successful removal."}
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
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
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSaving(true);
    setErrorMsg("");

    try {
      // First create a PaymentMethod to check card type BEFORE confirming
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (pmError) {
        setErrorMsg(pmError.message || "Card verification failed.");
        onError(pmError.message || "Card verification failed.");
        setSaving(false);
        return;
      }

      // Block prepaid cards before touching the SetupIntent
      if (paymentMethod?.card?.funding === "prepaid") {
        setErrorMsg("Prepaid cards are not accepted. Please use a debit or credit card.");
        onError("Prepaid cards are not accepted. Please use a debit or credit card.");
        setSaving(false);
        return;
      }

      // Card is not prepaid — confirm the SetupIntent with the already-created PM
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (error) {
        setErrorMsg(error.message || "Card verification failed.");
        onError(error.message || "Card verification failed.");
        setSaving(false);
      } else if (setupIntent?.status === "succeeded") {
        onSuccess(setupIntent.id);
      } else {
        setErrorMsg("Unexpected status. Please try again.");
        setSaving(false);
      }
    } catch (err) {
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
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a1a1a",
                "::placeholder": { color: "#9ca3af" },
                fontFamily: "inherit",
              },
              invalid: { color: "#dc2626" },
            },
            hidePostalCode: false,
          }}
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
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
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
      <Navigation minimal />
      <CheckoutHero />
      <KPIMobile />
      <StatsBar />
      <ProcessSteps />
      <CheckoutFAQ />
      <SubmissionForm />
      <Footer svgPaths={svgPaths} />
    </div>
  );
}
