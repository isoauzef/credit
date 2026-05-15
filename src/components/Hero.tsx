import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Shield, Clock, Award } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";
import emblemTransparent from "../assets/939d05bc0607ad5ec76c880ea7052eade6ac13fe.png";
import emblemDark from "../assets/cc179f68e1f2cdec4f23e00b5ae695644333bf02.png";
import emblemBlue from "../assets/df36f4e1f0ac313fd0c673284d92e4bd4202491a.png";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _tfa?: Array<Record<string, unknown>>;
  }
}

interface HeroProps {
  background: string;
  rectangleIcons: {
    icon1: string;
    icon2: string;
    icon3: string;
  };
  svgPaths: Record<string, string>;
}

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  creditScore: "",
  negativeItems: "",
  hasReport: "",
};

type HeroFormState = typeof initialFormState;

const STEP2_FIELDS = ["creditScore", "negativeItems", "hasReport"] as const;
const MOBILE_SCROLL_MAX_WIDTH = 1024;
const STEP2_DOUBLE_SUBMIT_GUARD_MS = 400;

type Step2Field = (typeof STEP2_FIELDS)[number];
type HeroFieldKey = keyof HeroFormState;

const INPUT_IDS: Record<HeroFieldKey, string> = {
  firstName: "hero-input-first-name",
  lastName: "hero-input-last-name",
  email: "hero-input-email",
  phone: "hero-input-phone",
  creditScore: "hero-input-credit-score",
  negativeItems: "hero-input-negative-items",
  hasReport: "hero-input-has-report",
};

const BUTTON_IDS = {
  continueStep1: "hero-btn-continue-step1",
  back: "hero-btn-back",
  submit: "hero-btn-submit",
} as const;

type HeroButtonId = keyof typeof BUTTON_IDS;

const BUTTON_VALIDATION_FIELDS: Record<HeroButtonId, HeroFieldKey[]> = {
  continueStep1: ["firstName", "lastName", "email", "phone"],
  back: [],
  submit: [...STEP2_FIELDS],
};

const createInitialErrorState = (): Record<keyof HeroFormState, boolean> => {
  return Object.keys(initialFormState).reduce((acc, key) => {
    acc[key as keyof HeroFormState] = false;
    return acc;
  }, {} as Record<keyof HeroFormState, boolean>);
};

export function Hero({
  background: backgroundImage,
  rectangleIcons: decorativeIcons,
  svgPaths: _svgPaths,
}: HeroProps) {
  const cms = usePageContent<{
    badge?: string;
    headingLine1?: string;
    headingLine2?: string;
    description?: string;
    formTitle?: string;
    formSubtitle?: string;
    kpiStats?: Array<{ value: string; label: string }>;
  }>("homepage", "hero");

  const heroBackgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))",
      };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<HeroFormState>({ ...initialFormState });
  const [fieldErrors, setFieldErrors] = useState<Record<keyof HeroFormState, boolean>>(
    () => createInitialErrorState()
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [step2SubmitAttempted, setStep2SubmitAttempted] = useState(false);
  const leadEventTrackedRef = useRef(false);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const viewportHeightRef = useRef<number | null>(null);
  const formInteractionRef = useRef(false);
  const hasRenderedOnceRef = useRef(false);
  // Track when we arrive on the final step so we can ignore accidental double clicks that immediately resubmit.
  const step2EntryTimeRef = useRef<number | null>(null);

  const totalSteps = 2;
  const previousStepRef = useRef(currentStep);

  const scrollFormIntoView = useCallback((delay = 200, options: { force?: boolean } = {}) => {
    if (typeof window === "undefined" || window.innerWidth > MOBILE_SCROLL_MAX_WIDTH) {
      return;
    }

    const node = formContainerRef.current;
    if (!node) {
      return;
    }

    if (!options.force && !formInteractionRef.current) {
      return;
    }

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      scrollTimeoutRef.current = null;
    }, delay);
  }, []);

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      if (currentStep === 2) {
        step2EntryTimeRef.current = Date.now();
        setFieldErrors(prev => ({
          ...prev,
          creditScore: false,
          negativeItems: false,
          hasReport: false,
        }));
        setStep2SubmitAttempted(false);
        setStatus("idle");
        setStatusMessage("");
      } else if (previousStepRef.current === 2) {
        step2EntryTimeRef.current = null;
        setStep2SubmitAttempted(false);
      }
    }

    previousStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasRenderedOnceRef.current) {
      hasRenderedOnceRef.current = true;
      return;
    }

    scrollFormIntoView(250, { force: true });
  }, [currentStep, scrollFormIntoView]);

  useEffect(() => {
    if (status === "error") {
      scrollFormIntoView(220, { force: true });
    }
  }, [status, scrollFormIntoView]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = formContainerRef.current;
    if (!container) {
      return;
    }

    const handleFocusIn = () => {
      formInteractionRef.current = true;
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (typeof document !== "undefined") {
          const active = document.activeElement;
          if (!active || !container.contains(active)) {
            formInteractionRef.current = false;
          }
        }
      }, 50);
    };

    container.addEventListener("focusin", handleFocusIn, true);
    container.addEventListener("focusout", handleFocusOut, true);
    return () => {
      container.removeEventListener("focusin", handleFocusIn, true);
      container.removeEventListener("focusout", handleFocusOut, true);
    };
  }, [scrollFormIntoView]);

  const isStep2Field = (field: HeroFieldKey): field is Step2Field =>
    STEP2_FIELDS.includes(field as Step2Field);

  const getInputClass = (field: keyof HeroFormState, extra = "") => {
    const base = "hero-input";

    if (isStep2Field(field)) {
      const showError = step2SubmitAttempted && Boolean(fieldErrors[field]);
      const stateClass = showError ? " hero-input-error" : " hero-input-default";
      return `${base}${stateClass}${extra ? ` ${extra}` : ""}`;
    }

    const hasError = Boolean(fieldErrors[field]);
    const stateClass = hasError ? " hero-input-error" : " hero-input-default";
    return `${base}${stateClass}${extra ? ` ${extra}` : ""}`;
  };

  const markStepErrors = (
    fields: Array<keyof HeroFormState>,
    options: { includeStep2?: boolean } = {}
  ) => {
    const { includeStep2 = false } = options;
    const stepErrors: Partial<Record<keyof HeroFormState, boolean>> = {};

    fields.forEach(field => {
      if (isStep2Field(field) && !includeStep2) {
        stepErrors[field] = false;
        return;
      }

      const value = formData[field].trim();
      let isValid = value.length > 0;

      if (field === "email") {
        isValid = isValidEmail(formData.email);
      } else if (field === "phone") {
        isValid = formData.phone.length === 10 && /^[2-9]/.test(formData.phone);
      }

      stepErrors[field] = !isValid;
    });

    setFieldErrors(prev => ({ ...prev, ...stepErrors }));
    return stepErrors;
  };

  const highlightFieldsForButton = (
    buttonId: HeroButtonId,
    options: { includeStep2?: boolean } = {}
  ) => {
    const fields = BUTTON_VALIDATION_FIELDS[buttonId];
    if (fields.length === 0) {
      return {} as Partial<Record<HeroFieldKey, boolean>>;
    }

    return markStepErrors(fields, options);
  };

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("1")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (!digits) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

  const trackLeadEvent = () => {
    if (typeof window === "undefined" || leadEventTrackedRef.current) {
      return;
    }

    window.fbq?.("track", "Lead");
    console.log("[analytics] Facebook Lead event fired");
    leadEventTrackedRef.current = true;
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = event.target;
    let { value } = event.target;
    const fieldKey = name as keyof HeroFormState;

    if (name === "phone") {
      let digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.startsWith("1")) digitsOnly = digitsOnly.slice(1);
      value = digitsOnly.slice(0, 10);
    }

    if (status !== "idle") {
      setStatus("idle");
      setStatusMessage("");
    }
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    const shouldClearError = (() => {
      if (fieldKey === "email") {
        return isValidEmail(value);
      }

      if (fieldKey === "phone") {
        return value.replace(/\D/g, "").length === 10;
      }

      return value.trim().length > 0;
    })();

    if (shouldClearError) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldKey]: false,
      }));
    }
  };

  const handleNext = () => {
    if (submissionComplete) {
      return;
    }
    setStatus("idle");
    setStatusMessage("");

    if (currentStep === 1) {
      const hasStep2Errors =
        fieldErrors.creditScore || fieldErrors.negativeItems || fieldErrors.hasReport;

      if (hasStep2Errors || step2SubmitAttempted) {
        setFieldErrors(prev => ({
          ...prev,
          creditScore: false,
          negativeItems: false,
          hasReport: false,
        }));
        setStep2SubmitAttempted(false);
      }
    }

    if (currentStep === 1) {
      const stepErrors = highlightFieldsForButton("continueStep1");
      const requiredFields = BUTTON_VALIDATION_FIELDS.continueStep1;
      const missingRequired = requiredFields.some(field => formData[field].trim().length === 0);
      const invalidEmail = formData.email ? !isValidEmail(formData.email) : false;
      const invalidPhone = formData.phone ? (formData.phone.length !== 10 || !/^[2-9]/.test(formData.phone)) : false;

      if (missingRequired) {
        setStatus("error");
        setStatusMessage("Please provide your contact details before continuing.");
        return;
      }

      if (invalidEmail) {
        setStatus("error");
        setStatusMessage("Please enter a valid email address.");
        return;
      }

      if (invalidPhone) {
        setStatus("error");
        setStatusMessage("Please enter a valid 10-digit US/Canada phone number.");
        return;
      }

      if (Object.values(stepErrors).some(Boolean)) {
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(step => step + 1);
    }
  };

  const handleBack = () => {
    if (submissionComplete) {
      return;
    }
    setStatus("idle");
    setStatusMessage("");
    if (currentStep === 2) {
      setFieldErrors(prev => ({
        ...prev,
        creditScore: false,
        negativeItems: false,
        hasReport: false,
      }));
      setStep2SubmitAttempted(false);
    }
    setCurrentStep(step => (step > 1 ? step - 1 : step));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionComplete) {
      return;
    }

    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    const entryTimestamp = step2EntryTimeRef.current;
    if (entryTimestamp && Date.now() - entryTimestamp < STEP2_DOUBLE_SUBMIT_GUARD_MS) {
      step2EntryTimeRef.current = null;
      if (step2SubmitAttempted) {
        setStep2SubmitAttempted(false);
      }
      setStatus("idle");
      setStatusMessage("");
      return;
    }

    step2EntryTimeRef.current = null;
    setStatus("idle");
    setStatusMessage("");
    setStep2SubmitAttempted(true);

    const submitErrors = highlightFieldsForButton("submit", { includeStep2: true });
    const missingCreditScore = submitErrors.creditScore ?? false;
    const missingNegativeItems = submitErrors.negativeItems ?? false;
    const missingHasReport = submitErrors.hasReport ?? false;

    if (missingCreditScore) {
      setStatus("error");
      setStatusMessage("Please select your average credit score.");
      return;
    }

    if (missingNegativeItems) {
      setStatus("error");
      setStatusMessage("Please tell us how many negative items are on your credit report.");
      return;
    }

    if (missingHasReport) {
      setStatus("error");
      setStatusMessage("Please let us know if you have a copy of your most recent credit report.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setFieldErrors(prev => ({
        ...prev,
        email: true,
      }));
      setStatus("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setStatusMessage("");
    trackLeadEvent();

    const fullName =
      [formData.firstName, formData.lastName].filter(Boolean).join(" ") ||
      formData.firstName ||
      formData.email;

    const problemDetails = [
      `Credit Score Range: ${formData.creditScore}`,
      `Negative Items: ${formData.negativeItems}`,
      `Has Credit Report: ${formData.hasReport}`,
    ]
      .filter(Boolean)
      .join("\n");

    const sanitizedProblem = problemDetails.trim() || "No additional details provided.";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: formatPhone(formData.phone),
          email: formData.email,
          problem: sanitizedProblem.trim(),
          agreed: true,
          source: "hero-multi-step",
          metadata: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            creditScore: formData.creditScore,
            negativeItems: formData.negativeItems,
            hasCreditReport: formData.hasReport,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "We could not submit your request. Please try again.");
      }

      setStatus("success");
      setSubmissionComplete(true);
      setFormData({ ...initialFormState });
      setCurrentStep(1);
      setFieldErrors(createInitialErrorState());
    setStep2SubmitAttempted(false);
      leadEventTrackedRef.current = false;

      if (typeof window !== "undefined") {
        if (!Array.isArray(window._tfa)) {
          window._tfa = [];
        }
        window._tfa.push({ notify: "event", name: "lead", id: 1150751 });
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "We could not submit your request. Please try again."
      );
      leadEventTrackedRef.current = false;
    }
  };

  return (
    <section
      className="relative min-h-[700px] lg:min-h-[800px] flex items-center overflow-hidden"
      style={heroBackgroundStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-slate-900/20" />

{/* SVG Background Objects */}
<div className="absolute inset-0 overflow-hidden bg-[rgba(197,197,197,0)]">
  {/* Top Right Emblem - Blue Version */}
  <img 
    src={emblemBlue}
    alt=""
    className="absolute -top-20 -right-20 w-96 h-96 opacity-10"
  />
  
  {/* Bottom Left Emblem - Dark Version */}
  <img 
    src={emblemDark}
    alt=""
    className="absolute -bottom-24 -left-24 w-80 h-80 opacity-5"
  />
  
  {/* Top Left Emblem - Transparent Version */}
  <img 
    src={emblemTransparent}
    alt=""
    className="absolute top-32 left-16 w-40 h-40 opacity-8"
  />
  
  {/* Middle Right Emblem - Blue Version Small */}
  <img 
    src={emblemBlue}
    alt=""
    className="absolute top-1/2 right-16 w-32 h-32 opacity-6"
  />
  
  {/* Bottom Right Emblem - Transparent Version */}
  <img 
    src={emblemTransparent}
    alt=""
    className="absolute bottom-32 right-1/4 w-48 h-48 opacity-5"
  />
</div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-5 lg:pt-40 lg:pb-20 w-full px-[12px]">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2.5 shadow-lg">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-white text-[14px]">{cms?.badge ?? "Trusted by 10,000+ Businesses Since 2014"}</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-white leading-tight">
                <span className="block text-4xl lg:text-5xl">{cms?.headingLine1 ?? "Remove Negative Reviews"}</span>
                <span className="block text-3xl lg:text-4xl text-cyan-200">{cms?.headingLine2 ?? "Restore Your Reputation"}</span>
              </h1>

              <p className="text-white/90 text-xl lg:text-2xl leading-relaxed max-w-2xl">
               {cms?.description ?? "We permanently remove negative reviews from Google, Yelp, and 100+ platforms with zero upfront costs. Pay only after we remove."}
              </p>
            </div>

            <div id="kpi-first" className="grid grid-cols-3 gap-6">
              {(cms?.kpiStats ?? [
                { value: "98%", label: "Success Rate" },
                { value: "7-14", label: "Days Average" },
                { value: "No Win", label: "No Fee" },
              ]).map((stat, i) => {
                const icons = [Check, Clock, Shield];
                const gradients = ["from-green-400 to-emerald-500", "from-blue-400 to-cyan-500", "from-purple-400 to-pink-500"];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl lg:p-6 hover:bg-white/15 transition-all flex flex-col items-center text-center px-[6px] py-[12px]">
                    <div className={`w-14 h-14 bg-gradient-to-br ${gradients[i % gradients.length]} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={i === 0 ? 3 : undefined} />
                    </div>
                    <div className="text-white text-2xl lg:text-3xl mb-1 text-[20px]">{stat.value}</div>
                    <div className="text-cyan-100 text-sm lg:text-base">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:ml-auto w-full max-w-lg">
            <div
              id="hero-contact"
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden scroll-mt-32"
              ref={formContainerRef}
            >
              <div
                className="px-6 py-4 text-white"
                style={{ background: "linear-gradient(to right, rgb(41, 128, 185), rgb(52, 152, 219))" }}
              >
                <h3 className="text-xl lg:text-2xl mb-1">
                  {submissionComplete ? "Thank you!" : (cms?.formTitle ?? "Get A Free Quote")}
                </h3>
                <p className="text-blue-100 text-sm lg:text-base">
                  {submissionComplete
                    ? "We have received your request and will reach out shortly."
                    : (cms?.formSubtitle ?? "No obligation. 100% confidential.")}
                </p>
              </div>

              {submissionComplete ? (
                <div className="px-6 py-10 pt-5 pb-5 text-center space-y-4">
                  <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <Check className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-900">Thanks for reaching out!</h4>
                  <p className="text-sm text-gray-600">
                    Our specialists will review your request and contact you within one business day.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
                      <span className="text-sm text-blue-600">
                        {Math.round((currentStep / totalSteps) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${(currentStep / totalSteps) * 100}%`,
                          background: "linear-gradient(to right, rgb(41, 128, 185), rgb(52, 152, 219))",
                        }}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="px-6 py-6">
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h4 className="text-lg text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor={INPUT_IDS.firstName}
                              className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                            >
                              First Name *
                            </label>
                            <input
                              id={INPUT_IDS.firstName}
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={getInputClass("firstName")}
                              placeholder="John"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={INPUT_IDS.lastName}
                              className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                            >
                              Last Name *
                            </label>
                            <input
                              id={INPUT_IDS.lastName}
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={getInputClass("lastName")}
                              placeholder="Doe"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor={INPUT_IDS.email}
                            className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                          >
                            Email Address *
                          </label>
                          <input
                            id={INPUT_IDS.email}
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={getInputClass("email")}
                            placeholder="john@company.com"
                            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                            autoComplete="email"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={INPUT_IDS.phone}
                            className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                          >
                            Phone Number *
                          </label>
                          <input
                            id={INPUT_IDS.phone}
                            type="tel"
                            name="phone"
                            value={formatPhone(formData.phone)}
                            onChange={handleInputChange}
                            className={getInputClass("phone")}
                            placeholder="(555) 555-5555"
                            inputMode="numeric"
                            maxLength={14}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-lg text-gray-900 mb-4">About Your Credit</h4>
                        <div>
                          <label
                            htmlFor={INPUT_IDS.creditScore}
                            className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                          >
                            What is your average credit score? *
                          </label>
                          <select
                            id={INPUT_IDS.creditScore}
                            name="creditScore"
                            value={formData.creditScore}
                            onChange={handleInputChange}
                            className={getInputClass("creditScore")}
                            required
                          >
                            <option value="">Select…</option>
                            <option value="400-500">400 to 500</option>
                            <option value="501-600">501 to 600</option>
                            <option value="601-700">601 to 700</option>
                            <option value="701-800+">701 to 800+</option>
                            <option value="unknown">I don't know</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={INPUT_IDS.negativeItems}
                            className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                          >
                            How many negative items do you have on your credit report? *
                          </label>
                          <select
                            id={INPUT_IDS.negativeItems}
                            name="negativeItems"
                            value={formData.negativeItems}
                            onChange={handleInputChange}
                            className={getInputClass("negativeItems")}
                            required
                          >
                            <option value="">Select…</option>
                            <option value="1-5">1 to 5</option>
                            <option value="6-9">6 to 9</option>
                            <option value="10+">10+</option>
                            <option value="unknown">I don't know</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={INPUT_IDS.hasReport}
                            className="block text-gray-700 mb-1.5 text-sm lg:text-base"
                          >
                            Do you have a copy of your most recent credit report? *
                          </label>
                          <select
                            id={INPUT_IDS.hasReport}
                            name="hasReport"
                            value={formData.hasReport}
                            onChange={handleInputChange}
                            className={getInputClass("hasReport")}
                            required
                          >
                            <option value="">Select…</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className="space-y-3 sm:space-y-3.5">
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                            <p className="flex items-center gap-1.5 leading-tight text-sm leading-relaxed text-blue-800 sm:gap-2">
                              <Shield className="mt-0.5 mr-2 h-4 w-4 shrink-0" />
                              <span>Your information is 100% confidential and will never be shared.</span>
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                            <p className="flex items-center gap-1.5 leading-tight text-sm leading-relaxed text-emerald-800 sm:gap-2">
                              <Check className="mt-0.5 mr-2 h-4 w-4 shrink-0" />
                              <span>Free consultation. No credit card required.</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          id={BUTTON_IDS.back}
                          onClick={handleBack}
                          className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors text-base"
                        >
                          Back
                        </button>
                      )}

                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          id={BUTTON_IDS.continueStep1}
                          onClick={handleNext}
                          className="ml-auto inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg text-base disabled:opacity-70 disabled:cursor-not-allowed"
                          disabled={status === "loading"}
                          style={{
                            background: "linear-gradient(to right, rgb(41, 128, 185), rgb(52, 152, 219))",
                          }}
                        >
                          Continue
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          id={BUTTON_IDS.submit}
                          className="ml-auto inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg text-base disabled:opacity-70 disabled:cursor-not-allowed"
                          disabled={status === "loading"}
                          style={{
                            background: "linear-gradient(to right, rgb(41, 128, 185), rgb(52, 152, 219))",
                          }}
                        >
                          {status === "loading" ? "Submitting..." : "Get Free Quote"}
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    {status === "error" && statusMessage && (
                      <p className="text-sm text-center mb-2 text-red-600" role="status" aria-live="polite">
                        {statusMessage}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      By submitting this form, you agree to our
                      {" "}
                      <a
                        href="/privacy-policy"
                        className="text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        Privacy Policy
                      </a>
                      {" "}
                      and
                      {" "}
                      <a
                        href="/terms-of-service"
                        className="text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        Terms of Service
                      </a>
                      .
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
  <div id="kpi-second" className="grid grid-cols-3 gap-4 pt-5">
          {(cms?.kpiStats ?? [
            { value: "98%", label: "Success Rate" },
            { value: "7-14", label: "Days Average" },
            { value: "No Win", label: "No Fee" },
          ]).map((stat, i) => {
            const icons = [Check, Clock, Shield];
            const gradients = ["from-green-400 to-emerald-500", "from-blue-400 to-cyan-500", "from-purple-400 to-pink-500"];
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-[6px] py-[12px] flex flex-col items-center text-center">
                <div className={`w-14 h-14 bg-gradient-to-br ${gradients[i % gradients.length]} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={i === 0 ? 3 : undefined} />
                </div>
                <div className="text-white text-2xl lg:text-3xl mb-1 text-[20px]">{stat.value}</div>
                <div className="text-cyan-100 text-sm lg:text-base">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}













