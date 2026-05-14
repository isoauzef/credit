import { ChangeEvent, FormEvent, useState } from "react";
import { Check, Shield, ArrowLeft, ArrowRight } from "lucide-react";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  creditScore: string;
  negativeItems: string;
  hasReport: string;
  agreed: boolean;
};

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  creditScore: "",
  negativeItems: "",
  hasReport: "",
  agreed: false,
};

const CREDIT_SCORE_OPTIONS = [
  { value: "400-500", label: "400 to 500" },
  { value: "501-600", label: "501 to 600" },
  { value: "601-700", label: "601 to 700" },
  { value: "701-800+", label: "701 to 800+" },
  { value: "unknown", label: "I don't know" },
];

const NEGATIVE_ITEM_OPTIONS = [
  { value: "1-5", label: "1 to 5" },
  { value: "6-9", label: "6 to 9" },
  { value: "10+", label: "10+" },
  { value: "unknown", label: "I don't know" },
];

export function QuoteForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const phoneDigits = formData.phone.replace(/\D/g, "");
  const validNANP = phoneDigits.length === 10 && /^[2-9]/.test(phoneDigits);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const step1Valid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    validEmail &&
    validNANP &&
    formData.address.trim() !== "";

  const step2Valid =
    formData.creditScore !== "" &&
    formData.negativeItems !== "" &&
    formData.hasReport !== "" &&
    formData.agreed;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target as HTMLInputElement;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNext = () => {
    if (!step1Valid) {
      setStatus("error");
      if (!validNANP) {
        setStatusMessage("Please enter a valid 10-digit US/Canada phone number.");
      } else if (!validEmail) {
        setStatusMessage("Please enter a valid email address.");
      } else {
        setStatusMessage("Please fill in all fields to continue.");
      }
      return;
    }
    setStatus("idle");
    setStatusMessage("");
    setStep(2);
  };

  const handleBack = () => {
    setStatus("idle");
    setStatusMessage("");
    setStep(1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!step2Valid) {
      setStatus("error");
      setStatusMessage("Please answer all questions and accept the terms.");
      return;
    }
    setStatus("loading");
    setStatusMessage("");

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const problemSummary = [
      `Credit score range: ${formData.creditScore}`,
      `Negative items: ${formData.negativeItems}`,
      `Has credit report: ${formData.hasReport}`,
    ].join("\n");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: formData.phone,
          email: formData.email,
          problem: problemSummary,
          agreed: formData.agreed,
          source: "quote-form",
          metadata: {
            form: "quote-form",
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyAddress: formData.address,
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
      setStatusMessage("");
      setFormData({ ...initialFormState });
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "We could not submit your request. Please try again."
      );
    }
  };

  const handleReset = () => {
    setSubmissionComplete(false);
    setStatus("idle");
    setStatusMessage("");
    setStep(1);
    setFormData({ ...initialFormState });
  };

  const inputClass =
    "w-full px-3 py-2.5 bg-[#ebefee] border border-[#eeeeee] text-[#4d4d4d] placeholder:text-[#757575] focus:outline-none focus:border-[#346fb2]";
  const selectClass = inputClass + " appearance-none";

  return (
    <div className="bg-white rounded-sm shadow-lg max-w-md mx-auto lg:mx-0">
      <div className="bg-white px-6 pt-8 pb-6">
        <h2 className="text-[#346fb2] text-center text-3xl lg:text-4xl mb-2">Get a Quote</h2>

        {!submissionComplete && (
          <>
            {/* Step indicator */}
            <div
              className="flex items-center justify-center gap-2 mb-5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={2}
              aria-valuenow={step}
              aria-label={`Step ${step} of 2`}
            >
              <span
                className={`h-2 w-10 rounded-full transition-colors ${
                  step >= 1 ? "bg-[#1b4f8b]" : "bg-[#dbdde5]"
                }`}
              />
              <span
                className={`h-2 w-10 rounded-full transition-colors ${
                  step >= 2 ? "bg-[#1b4f8b]" : "bg-[#dbdde5]"
                }`}
              />
            </div>
            <p className="text-center text-xs text-[#4d4d4d] mb-4">
              Step {step} of 2 — {step === 1 ? "Your details" : "About your credit"}
            </p>
          </>
        )}

        {submissionComplete ? (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1b4f8b]/10">
              <Check className="h-8 w-8 text-[#1b4f8b]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#1b4f8b]">Thank you!</h3>
            <p className="text-sm text-[#4d4d4d]">
              Our team has received your request and will be in touch shortly.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-full border border-[#1b4f8b] px-6 py-2 text-sm font-medium text-[#1b4f8b] transition-colors hover:bg-[#1b4f8b] hover:text-white"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    aria-label="First name"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    aria-label="Last name"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  aria-label="Email"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 555-5555"
                  autoComplete="tel-national"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  aria-label="Phone"
                />

                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  aria-label="Address"
                />

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1b4f8b] text-white py-3.5 rounded-full hover:bg-[#153d6e] transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm text-[#4d4d4d] mb-1" htmlFor="creditScore">
                    What is your average credit score?
                  </label>
                  <select
                    id="creditScore"
                    name="creditScore"
                    value={formData.creditScore}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select…</option>
                    {CREDIT_SCORE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#4d4d4d] mb-1" htmlFor="negativeItems">
                    How many negative items do you have on your credit report?
                  </label>
                  <select
                    id="negativeItems"
                    name="negativeItems"
                    value={formData.negativeItems}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select…</option>
                    {NEGATIVE_ITEM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#4d4d4d] mb-1" htmlFor="hasReport">
                    Do you have a copy of your most recent credit report?
                  </label>
                  <select
                    id="hasReport"
                    name="hasReport"
                    value={formData.hasReport}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select…</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreed"
                    id="agreed"
                    checked={formData.agreed}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 bg-[#0075ff] border-0 rounded-sm cursor-pointer"
                    required
                  />
                  <label htmlFor="agreed" className="text-[10px] text-[#4d4d4d] leading-tight cursor-pointer">
                    I agree to the{" "}
                    <a href="/privacy-policy" className="text-[#1b4f8b] hover:underline">
                      privacy policy
                    </a>{" "}
                    and{" "}
                    <a href="/terms-of-service" className="text-[#1b4f8b] hover:underline">
                      terms
                    </a>{" "}
                    of this website.
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-[#1b4f8b] text-[#1b4f8b] py-3.5 rounded-full hover:bg-[#1b4f8b]/5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#1b4f8b] text-white py-3.5 rounded-full hover:bg-[#153d6e] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {!submissionComplete && status === "error" && statusMessage && (
          <p className="text-center text-sm mt-4 text-red-600" role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}

        {!submissionComplete && (
          <>
            <p className="text-[#4d4d4d] text-center text-xs mt-6">
              We never sell or share your personal information.
            </p>

            <div className="flex justify-center mt-4">
              <div className="bg-white border border-[#dbdde5] rounded px-4 py-2 inline-flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#1A976A]" />
                  <span className="text-xs tracking-tight">Secure Form</span>
                </div>
                <div className="bg-[#eef0f5] px-2 py-1 rounded-b text-[9px] text-black/70">
                  Verified by Trustindex
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
