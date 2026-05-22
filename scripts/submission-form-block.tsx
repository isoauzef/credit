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

function maskSSN(raw: string): string {
  // Display SSN as ***-**-#### when more than 4 digits typed (only when not focused later)
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return digits.slice(0, 3) + "-" + digits.slice(3);
  return digits.slice(0, 3) + "-" + digits.slice(3, 5) + "-" + digits.slice(5);
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

async function uploadSecureFile(file: File): Promise<UploadedDoc> {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await fetch("/api/secure-uploads", { method: "POST", body: fd });
  if (!resp.ok) {
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

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm text-gray-700 font-medium mb-1.5">
        {label} <span className="text-red-400 ml-0.5">*</span>
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
      {doc && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ["Personal Info", "Verification", "Authorization", "Payment"];
  return (
    <div className="flex items-center justify-between gap-2 mb-8">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4;
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [idDoc, setIdDoc] = useState<UploadedDoc | null>(null);
  const [utilityDoc, setUtilityDoc] = useState<UploadedDoc | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [agreed, setAgreed] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "card_step" | "saving_card" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Stripe state
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [setupIntentId, setSetupIntentId] = useState("");

  useEffect(() => {
    if (status !== "card_step" || stripePromise) return;
    fetch("/api/stripe-publishable-key")
      .then((r) => r.json())
      .then((d) => {
        if (d?.publishableKey) setStripePromise(loadStripe(d.publishableKey));
        else setErrorMsg("Stripe is not configured.");
      })
      .catch(() => setErrorMsg("Could not load payment provider."));
  }, [status, stripePromise]);

  const update = <K extends keyof CreditRepairForm>(key: K, value: CreditRepairForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }, []);

  // ── Per-step validation ──
  const step1Errors = useMemo(() => {
    const errs: Partial<Record<keyof CreditRepairForm, string>> = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a 10-digit phone number";
    if (form.address.trim().length < 5) errs.address = "Enter your full street address";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) errs.dob = "Required";
    if (form.ssn.replace(/\D/g, "").length !== 9) errs.ssn = "Enter your 9-digit SSN";
    return errs;
  }, [form]);

  const step2Errors = useMemo(() => {
    const errs: { id?: string; utility?: string } = {};
    if (!idDoc) errs.id = "Required";
    if (!utilityDoc) errs.utility = "Required";
    return errs;
  }, [idDoc, utilityDoc]);

  const goNext = () => {
    if (step === 1) {
      if (Object.keys(step1Errors).length > 0) {
        setErrorMsg("Please complete all required fields.");
        return;
      }
      setErrorMsg("");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (Object.keys(step2Errors).length > 0) {
        setErrorMsg("Please upload both required documents.");
        return;
      }
      setErrorMsg("");
      setStep(3);
      return;
    }
  };

  const goBack = () => {
    setErrorMsg("");
    if (status === "card_step") {
      setStatus("idle");
      setStep(3);
      return;
    }
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
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

  const buildCheckoutPayload = () => ({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone,
    address: form.address.trim(),
    dob: form.dob,
    ssn: form.ssn.replace(/\D/g, ""),
    idDocToken: idDoc?.token,
    utilityDocToken: utilityDoc?.token,
    creditReportDocToken: null,
    signatureDataUrl,
    authLetterSnapshot: authLetterText,
  });

  const handleSubmitForReview = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle" && status !== "error") return;
    if (Object.keys(step1Errors).length || Object.keys(step2Errors).length) {
      setErrorMsg("Please complete all previous steps.");
      return;
    }
    if (signatureEmpty || !signatureDataUrl) {
      setErrorMsg("Please draw your signature.");
      return;
    }
    if (!agreed) {
      setErrorMsg("Please confirm authorization to proceed.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");

    try {
      const resp = await fetch("/api/credit-repair-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutPayload()),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message || "Submission failed");
      }
      setClientSecret(data.clientSecret);
      setSetupIntentId(data.setupIntentId);
      setStatus("card_step");
      setStep(4);
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
        body: JSON.stringify({ setupIntentId: intentId, ...buildCheckoutPayload() }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.message || "Could not finalize checkout.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not finalize checkout.";
      setStatus("card_step");
      setErrorMsg(msg);
      throw new Error(msg);
    }
    setStatus("success");
  };

  // ── Success screen ──
  if (status === "success") {
    return (
      <section id="submit" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
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
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
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

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-6 sm:p-10">
          <StepIndicator step={step} />

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="firstName" label="First Name" required>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={inputClass}
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                  />
                </Field>
                <Field id="lastName" label="Last Name" required>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className={inputClass}
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="email" label="Email" required>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <Field id="phone" label="Phone" required>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => update("phone", formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </Field>
              </div>

              <Field id="address" label="Home Address" required hint="street, city, state, zip">
                <input
                  id="address"
                  type="text"
                  autoComplete="street-address"
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="123 Main St, Springfield, IL 62704"
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field id="dob" label="Date of Birth" required>
                  <input
                    id="dob"
                    type="date"
                    autoComplete="bday"
                    className={inputClass}
                    value={form.dob}
                    onChange={(e) => update("dob", e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <Field id="ssn" label="Social Security Number" required hint="encrypted">
                  <div className="relative">
                    <input
                      id="ssn"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className={`${inputClass} pr-10 font-mono tracking-wider`}
                      value={maskSSN(form.ssn)}
                      onChange={(e) => update("ssn", e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="123-45-6789"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </Field>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50/40 rounded-lg px-3 py-2">
                <Shield className="w-4 h-4 text-[#1e5a8a] flex-shrink-0" />
                All transactions are secure and encrypted.
              </div>
            </div>
          )}

          {/* ── Step 2: Verification Documents ── */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                We need to verify your identity and address before working with the credit bureaus. Please upload a
                clear photo or PDF scan of each document below.
              </p>

              <FileDropzone
                label="Government-Issued Photo ID"
                accept="image/jpeg,image/png,application/pdf"
                doc={idDoc}
                onChange={setIdDoc}
                hint="Driver's license, passport, etc."
              />

              <FileDropzone
                label="Utility Bill"
                accept="image/jpeg,image/png,application/pdf"
                doc={utilityDoc}
                onChange={setUtilityDoc}
                hint="Within the last 90 days, showing your address"
              />

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50/40 rounded-lg px-3 py-2">
                <Shield className="w-4 h-4 text-[#1e5a8a] flex-shrink-0 mt-0.5" />
                Documents are stored on a private server and never publicly accessible. Only the assigned case agent can
                view them through the authenticated admin portal.
              </div>
            </div>
          )}

          {/* ── Step 3: Authorization & Signature ── */}
          {step === 3 && (
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
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1e5a8a] focus:ring-[#1e5a8a]/30"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I confirm the information provided is true and accurate, and I authorize CreditRemovers to dispute
                  items on my credit reports on my behalf.
                </span>
              </label>
            </div>
          )}

          {/* ── Step 4: Save Card ── */}
          {step === 4 && status === "card_step" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Finally, save a card on file. <strong>No charge is made today</strong> — your card is only charged once we confirm the removals.
              </p>
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
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
          {step !== 4 && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || status === "submitting"}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < 3 ? (
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
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {step === 4 && status !== "saving_card" && (
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

