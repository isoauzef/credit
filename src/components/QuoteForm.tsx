import { ChangeEvent, FormEvent, useState } from "react";
import { Check, Shield } from "lucide-react";

type FormState = {
  name: string;
  phone: string;
  email: string;
  problem: string;
  agreed: boolean;
};

const initialFormState: FormState = {
  name: "",
  phone: "",
  email: "",
  problem: "",
  agreed: false,
};

export function QuoteForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validNANP) {
      setStatus("error");
      setStatusMessage("Please enter a valid 10-digit US/Canada phone number.");
      return;
    }
    setStatus("loading");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          problem: formData.problem,
          agreed: formData.agreed,
          source: "quote-form",
          metadata: {
            form: "quote-form",
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

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }
    setFormData((prev: FormState) => ({
      ...prev,
      [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleReset = () => {
    setSubmissionComplete(false);
    setStatus("idle");
    setStatusMessage("");
    setFormData({ ...initialFormState });
  };

  return (
    <div className="bg-white rounded-sm shadow-lg max-w-md mx-auto lg:mx-0">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6">
        <h2 className="text-[#346fb2] text-center text-3xl lg:text-4xl mb-6">Get a Quote</h2>

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
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-[#ebefee] border border-[#eeeeee] text-[#757575] placeholder:text-[#757575] focus:outline-none focus:border-[#346fb2]"
                  required
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 555-5555"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-[#ebefee] border border-[#eeeeee] text-[#757575] placeholder:text-[#757575] focus:outline-none focus:border-[#346fb2]"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-[#ebefee] border border-[#eeeeee] text-[#757575] placeholder:text-[#757575] focus:outline-none focus:border-[#346fb2]"
                  required
                />
              </div>

              {/* Problem Description */}
              <div>
                <textarea
                  name="problem"
                  placeholder="Tell us about your problem:"
                  value={formData.problem}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#ebefee] border border-[#eeeeee] text-[#757575] placeholder:text-[#757575] resize-none focus:outline-none focus:border-[#346fb2]"
                  required
                />
              </div>

              {/* Terms Checkbox */}
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
                  <a href="#" className="text-[#1b4f8b] hover:underline">
                    privacy policy
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#1b4f8b] hover:underline">
                    terms
                  </a>{" "}
                  of this website.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#1b4f8b] text-white py-3.5 rounded-full hover:bg-[#153d6e] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Submitting..." : "Submit"}
              </button>
            </form>

            {status === "error" && statusMessage && (
              <p className="text-center text-sm mt-4 text-red-600" role="status" aria-live="polite">
                {statusMessage}
              </p>
            )}

            {/* Privacy Note */}
            <p className="text-[#4d4d4d] text-center text-xs mt-6">
              We never sell or share your personal information.
            </p>

            {/* Secure Form Badge */}
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
