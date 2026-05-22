const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const prisma = require("./db");
const { boot, getStripe, getStripeSettings, getSerpApiKey, getGooglePlacesKey, isEmailEnabled } = require("./helpers/runtime");
const { sendSubmissionEmail, sendCheckoutSuccessEmail } = require("./email/mailer");
const { getBusinessReviews, geolocateIp } = require("./services/serpapi");
const { searchPlaces } = require("./services/google-places");
const adminRoutes = require("./routes/admin");
const secureUploadsRoutes = require("./routes/secure-uploads");
const clientDashboardRoutes = require("./routes/client-dashboard");
const {
  buildPortalUrls,
  ensureClientDashboardAccountForSubmission,
} = require("./helpers/clientDashboard");
const { serializeBlogPost } = require("./helpers/blog");

const app = express();
const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);
const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || process.env.VITE_ADMIN_TOKEN || process.env.ADMIN_DASHBOARD_TOKEN || "changeme";

const buildDirectory = path.join(__dirname, "..", "build");

if (ADMIN_TOKEN === "changeme") {
  console.warn("[admin] Using default admin token. Set ADMIN_TOKEN in your environment to secure the dashboard.");
}

// ── Stripe webhook needs raw body — register BEFORE json parser ──
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).send("Stripe not configured");

  const settings = getStripeSettings();
  const mode = settings.stripe_mode || "test";
  const whSecret =
    mode === "live" ? settings.stripe_live_webhook_secret : settings.stripe_test_webhook_secret;

  let event;
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err.message);
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    switch (event.type) {
      case "setup_intent.succeeded": {
        const si = event.data.object;
        const pm = si.payment_method;
        await prisma.checkoutSubmission.updateMany({
          where: { stripeSetupIntentId: si.id },
          data: {
            stripePaymentMethodId: pm || null,
            paymentStatus: "card_saved",
          },
        });
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        await prisma.checkoutSubmission.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { paymentStatus: "charged" },
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await prisma.checkoutSubmission.updateMany({
          where: { stripePaymentIntentId: charge.payment_intent },
          data: { paymentStatus: "refunded" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] event handler error:", err);
  }

  res.json({ received: true });
});

// ── Standard middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Public: page content ────────────────────────────────────────
app.get("/api/page-content/:page", async (req, res) => {
  try {
    const rows = await prisma.pageContent.findMany({ where: { page: req.params.page } });
    const result = {};
    for (const r of rows) result[r.section] = r.content;
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

// ── Public: site settings (non-sensitive) ───────────────────────
app.get("/api/settings/public", async (_req, res) => {
  try {
    const rows = await prisma.setting.findMany({ where: { group: "site" } });
    const result = {};
    for (const r of rows) result[r.key] = r.value;
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

// ── Contact form (homepage quote form) ──────────────────────────
// Public blog posts.
app.get("/api/blog", async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });
    return res.json(posts.map((post) => serializeBlogPost(post, req)));
  } catch (err) {
    console.error("[blog] list", err);
    return res.status(500).json({ message: "Failed to load blog posts" });
  }
});

app.get("/api/blog/:slug", async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: String(req.params.slug || "") },
    });
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Blog post not found" });
    }
    return res.json(serializeBlogPost(post, req));
  } catch (err) {
    console.error("[blog] detail", err);
    return res.status(500).json({ message: "Failed to load blog post" });
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, email, problem, agreed, source, metadata } = req.body || {};

  if (!name || !phone || !email || !problem) {
    return res.status(400).json({ message: "Missing required contact fields." });
  }

  const m = metadata && typeof metadata === "object" ? metadata : {};

  try {
    await prisma.contactSubmission.create({
      data: {
        name: String(name),
        firstName: m.firstName ? String(m.firstName) : null,
        lastName: m.lastName ? String(m.lastName) : null,
        email: String(email),
        phone: String(phone),
        companyName: m.companyName ? String(m.companyName) : null,
        companyAddress: m.companyAddress ? String(m.companyAddress) : null,
        businessLocations: m.businessLocations ? String(m.businessLocations) : null,
        platform: m.platform ? String(m.platform) : null,
        negativeReviewsNeedRemoving: (m.negativeReviewsNeedRemoving || m.negativeReviewsToRemove)
          ? String(m.negativeReviewsNeedRemoving || m.negativeReviewsToRemove)
          : null,
        budgetPerRemoval: m.budgetPerRemoval ? String(m.budgetPerRemoval) : null,
        source: source ? String(source) : null,
        metadata: metadata || undefined,
      },
    });

    // Send auto-response email if enabled
    if (await isEmailEnabled("quote-autoresponse")) {
      try {
        await sendSubmissionEmail({ name, email, phone, problem, metadata });
      } catch (emailError) {
        console.error("[email] Failed to send auto-response", emailError);
      }
    }

    return res.status(201).json({ message: "Submission stored." });
  } catch (error) {
    console.error("[contact] Failed to store submission", error);
    return res.status(500).json({ message: "We could not save this submission." });
  }
});

// ── Legacy admin GET (for old dashboard compat) ─────────────────
app.get("/api/contact", async (req, res) => {
  // Accept either old x-admin-token or new JWT Bearer
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";
  const bearerHeader = req.header("Authorization");
  const legacyToken = req.header("x-admin-token");

  let authorized = false;
  if (bearerHeader && bearerHeader.startsWith("Bearer ")) {
    try { jwt.verify(bearerHeader.slice(7), JWT_SECRET); authorized = true; } catch {}
  }
  if (!authorized && legacyToken && legacyToken === ADMIN_TOKEN) {
    authorized = true;
  }
  if (!authorized) return res.status(401).json({ message: "Unauthorized" });

  try {
    const rows = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "We could not load the submissions." });
  }
});

// ── Legacy admin GET — checkout submissions ─────────────────────
app.get("/api/checkout-submissions", async (req, res) => {
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";
  const bearerHeader = req.header("Authorization");
  const legacyToken = req.header("x-admin-token");

  let authorized = false;
  if (bearerHeader && bearerHeader.startsWith("Bearer ")) {
    try { jwt.verify(bearerHeader.slice(7), JWT_SECRET); authorized = true; } catch {}
  }
  if (!authorized && legacyToken && legacyToken === ADMIN_TOKEN) {
    authorized = true;
  }
  if (!authorized) return res.status(401).json({ message: "Unauthorized" });

  try {
    const rows = await prisma.checkoutSubmission.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, companyName: true,
        googleDataId: true, reviewLinks: true, reason: true, quantity: true, amount: true,
        address: true, dob: true, ssnLast4: true,
        idDocPath: true, utilityDocPath: true, creditReportDocPath: true, signedAt: true,
        stripeSessionId: true, stripePaymentIntentId: true, stripeCustomerId: true,
        stripeSetupIntentId: true, stripePaymentMethodId: true,
        crmLeadId: true, paymentStatus: true,
        createdAt: true, updatedAt: true,
      },
    });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Could not load checkout submissions." });
  }
});

// ── Public: Stripe publishable key ──────────────────────────────
function stripeKeyMode(key) {
  if (typeof key !== "string") return "unknown";
  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) return "live";
  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) return "test";
  return "unknown";
}

app.get("/api/stripe-publishable-key", (_req, res) => {
  const settings = getStripeSettings();
  const mode = settings.stripe_mode || "test";
  const pk = mode === "live" ? settings.stripe_live_publishable_key : settings.stripe_test_publishable_key;
  if (!pk) return res.status(500).json({ message: "Stripe not configured" });
  return res.json({
    publishableKey: pk,
    mode,
    keyMode: stripeKeyMode(pk),
  });
});

// ── Public: price per review (cents) ────────────────────────────
app.get("/api/stripe-price", (_req, res) => {
  const settings = getStripeSettings();
  return res.json({
    pricePerReview: Number(settings.stripe_price_per_review) || 20000,
    tier2Threshold: Number(settings.stripe_price_tier2_threshold) || 10,
    tier2Price: Number(settings.stripe_price_tier2) || 30000,
    tier3Threshold: Number(settings.stripe_price_tier3_threshold) || 20,
    tier3Price: Number(settings.stripe_price_tier3) || 20000,
  });
});

// ── Public: payment method funding type (to block prepaid cards post-confirm) ─
app.get("/api/payment-method-funding", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });
  const id = String(req.query.id || "");
  if (!/^pm_[A-Za-z0-9]+$/.test(id)) {
    return res.status(400).json({ message: "Invalid payment method id" });
  }
  try {
    const pm = await stripe.paymentMethods.retrieve(id);
    return res.json({ funding: pm?.card?.funding || null, brand: pm?.card?.brand || null });
  } catch (err) {
    console.error("[payment-method-funding]", err.message);
    return res.status(500).json({ message: "Could not retrieve payment method" });
  }
});

// ── Credit-repair checkout: validate intake + create SetupIntent ──
app.get("/api/credit-repair-checkout/email-exists", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const existing = await prisma.checkoutSubmission.findFirst({
      where: { email },
      select: { id: true },
    });
    return res.json({ exists: Boolean(existing) });
  } catch (err) {
    console.error("[credit-repair] duplicate email check failed:", err);
    return res.status(500).json({ message: "Could not check this email right now." });
  }
});

function validateCreditRepairCheckoutPayload(body = {}) {
  const {
    firstName, lastName, email, phone, address, dob, ssn,
    idDocToken, utilityDocToken, creditReportDocToken,
    signatureDataUrl, authLetterSnapshot,
  } = body || {};

  const first = String(firstName || "").trim();
  const last = String(lastName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const phoneValue = String(phone || "").trim();
  const addressValue = String(address || "").trim();
  const dobValue = String(dob || "").trim();
  const ssnDigits = String(ssn || "").replace(/\D/g, "");
  const signatureValue = signatureDataUrl ? String(signatureDataUrl) : null;
  const errors = [];

  if (first.length < 1) errors.push("firstName");
  if (last.length < 1) errors.push("lastName");
  if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) errors.push("email");
  if (phoneValue.replace(/\D/g, "").length < 7) errors.push("phone");
  if (addressValue.length < 5) errors.push("address");
  else if (!/^\d/.test(addressValue)) errors.push("address");
  else if (!/[A-Za-z]/.test(addressValue)) errors.push("address");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobValue)) errors.push("dob");
  if (ssnDigits.length !== 4) errors.push("ssn");

  const tokenRe = /^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i;
  const docTokens = {
    idDocToken: idDocToken ? String(idDocToken) : null,
    utilityDocToken: utilityDocToken ? String(utilityDocToken) : null,
    creditReportDocToken: creditReportDocToken ? String(creditReportDocToken) : null,
  };
  if (docTokens.idDocToken && !tokenRe.test(docTokens.idDocToken)) errors.push("idDocToken");
  if (docTokens.utilityDocToken && !tokenRe.test(docTokens.utilityDocToken)) errors.push("utilityDocToken");
  if (docTokens.creditReportDocToken && !tokenRe.test(docTokens.creditReportDocToken)) errors.push("creditReportDocToken");
  if (signatureValue && !/^data:image\/png;base64,/.test(signatureValue)) errors.push("signature");

  if (errors.length) {
    return { ok: false, status: 400, message: "Validation failed", fields: errors };
  }

  const privateDir = path.join(__dirname, "..", "private-uploads");
  for (const t of Object.values(docTokens)) {
    if (!t) continue;
    const full = path.join(privateDir, t);
    if (!full.startsWith(privateDir + path.sep) || !fs.existsSync(full)) {
      return { ok: false, status: 400, message: "Uploaded document not found. Please re-upload." };
    }
  }

  if (signatureValue && signatureValue.length > 350_000) {
    return { ok: false, status: 413, message: "Signature image too large." };
  }

  const fullName = `${first} ${last}`.trim();
  return {
    ok: true,
    data: {
      firstName: first,
      lastName: last,
      fullName,
      normalizedEmail,
      phone: phoneValue,
      address: addressValue,
      dob: dobValue,
      ssnLast4: ssnDigits,
      idDocPath: docTokens.idDocToken,
      utilityDocPath: docTokens.utilityDocToken,
      creditReportDocPath: docTokens.creditReportDocToken,
      signatureDataUrl: signatureValue,
      authLetterSnapshot: authLetterSnapshot ? String(authLetterSnapshot).slice(0, 10000) : null,
    },
  };
}

app.post("/api/credit-repair-checkout", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const {
    firstName, lastName, email, phone, address, dob, ssn,
    idDocToken, utilityDocToken, creditReportDocToken,
    signatureDataUrl, authLetterSnapshot,
  } = req.body || {};

  // ── Validation ──
  const errors = [];
  if (!firstName || String(firstName).trim().length < 1) errors.push("firstName");
  if (!lastName || String(lastName).trim().length < 1) errors.push("lastName");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) errors.push("email");
  if (!phone || String(phone).replace(/\D/g, "").length < 7) errors.push("phone");
  const addressValue = String(address || "").trim();
  if (addressValue.length < 5) errors.push("address");
  else if (!/^\d/.test(addressValue)) errors.push("address");
  else if (!/[A-Za-z]/.test(addressValue)) errors.push("address");
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(String(dob))) errors.push("dob");
  const ssnDigits = String(ssn || "").replace(/\D/g, "");
  if (ssnDigits.length !== 4) errors.push("ssn");
  const tokenRe = /^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i;
  if (idDocToken && !tokenRe.test(String(idDocToken))) errors.push("idDocToken");
  if (utilityDocToken && !tokenRe.test(String(utilityDocToken))) errors.push("utilityDocToken");
  if (creditReportDocToken && !tokenRe.test(String(creditReportDocToken))) errors.push("creditReportDocToken");
  if (signatureDataUrl && !/^data:image\/png;base64,/.test(String(signatureDataUrl))) errors.push("signature");
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", fields: errors });
  }

  // ── Verify upload tokens correspond to files on disk ──
  const privateDir = path.join(__dirname, "..", "private-uploads");
  for (const t of [idDocToken, utilityDocToken, creditReportDocToken]) {
    if (!t) continue;
    const full = path.join(privateDir, String(t));
    if (!full.startsWith(privateDir + path.sep) || !fs.existsSync(full)) {
      return res.status(400).json({ message: "Uploaded document not found. Please re-upload." });
    }
  }

  // ── Limit signature size to prevent DB abuse (~256KB for PNG data URL) ──
  if (signatureDataUrl && String(signatureDataUrl).length > 350_000) {
    return res.status(413).json({ message: "Signature image too large." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const existing = await prisma.checkoutSubmission.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        message: "An application already exists for this email address. Please log in to your client dashboard or contact support.",
        fields: ["email"],
      });
    }
  } catch (err) {
    console.error("[credit-repair] duplicate email submit check failed:", err);
    return res.status(500).json({ message: "Could not verify this email address. Please try again." });
  }

  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
  let customer = null;
  let setupIntent = null;
  try {
    const settings = getStripeSettings();
    const mode = settings.stripe_mode || "test";
    const sk = mode === "live" ? settings.stripe_live_secret_key : settings.stripe_test_secret_key;
    const pk = mode === "live" ? settings.stripe_live_publishable_key : settings.stripe_test_publishable_key;
    console.log(
      "[credit-repair] Stripe mode=%s skPrefix=%s pkPrefix=%s",
      mode,
      sk ? sk.slice(0, 12) : "none",
      pk ? pk.slice(0, 12) : "none"
    );

    customer = await stripe.customers.create({
      email: normalizedEmail,
      name: fullName.slice(0, 200),
      phone: String(phone).slice(0, 50),
      address: { line1: String(address).slice(0, 500) },
      metadata: { source: "credit-repair-checkout" },
    });

    setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        customerName: fullName.slice(0, 500),
        flow: "credit-repair",
      },
    });

    return res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (err) {
    console.error("[credit-repair] failed:", err);
    if (setupIntent) {
      try { await stripe.setupIntents.cancel(setupIntent.id); } catch (_) {}
    }
    if (customer) {
      try { await stripe.customers.del(customer.id); } catch (_) {}
    }
    return res.status(500).json({ message: "Could not start checkout. Please try again." });
  }
});

// ── SetupIntent creation (save card on file, no charge) ─────────
app.post("/api/create-setup-intent", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const {
    name, email, phone, companyName, reviewLinks, quantity, googleDataId,
    placeId, businessAddress, businessCity, businessState, businessZipcode,
  } = req.body || {};
  if (!name || !email || !companyName || !Array.isArray(reviewLinks) || reviewLinks.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const safeQuantity = Math.max(1, Math.min(Number(quantity) || reviewLinks.length, 50));
  const settings = getStripeSettings();
  const baseCents = Number(settings.stripe_price_per_review) || 20000;
  const t2Qty = Number(settings.stripe_price_tier2_threshold) || 10;
  const t2Price = Number(settings.stripe_price_tier2) || 30000;
  const t3Qty = Number(settings.stripe_price_tier3_threshold) || 20;
  const t3Price = Number(settings.stripe_price_tier3) || 20000;
  const pricePerReview = safeQuantity >= t3Qty ? t3Price : safeQuantity >= t2Qty ? t2Price : baseCents;

  // ── Try to create lead in CRM (failure is non-blocking) ──
  let crmLeadId = null;
  const crm = require("./helpers/crmClient");
  if (crm.isCrmEnabled()) {
    try {
      const fullName = String(name).trim();
      const spaceIdx = fullName.indexOf(" ");
      const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
      const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";

      const leadResp = await crm.createOrUpdateLead({
        first_name: firstName,
        last_name: lastName || "-",
        business_name: String(companyName).slice(0, 500),
        cost_per_review: pricePerReview / 100, // CRM expects USD
        phone: phone ? String(phone) : undefined,
        email: String(email),
        business_address: businessAddress ? String(businessAddress) : undefined,
        business_city: businessCity ? String(businessCity) : undefined,
        business_state: businessState ? String(businessState) : undefined,
        business_zipcode: businessZipcode ? String(businessZipcode) : undefined,
        place_id: placeId ? String(placeId) : undefined,
        data_id: googleDataId ? String(googleDataId) : undefined,
      });
      crmLeadId = leadResp?.id || null;
      console.log("[crm] Lead created:", crmLeadId);

      // Push selected reviews to CRM
      if (crmLeadId && Array.isArray(reviewLinks) && reviewLinks.length > 0) {
        const reviewsPayload = reviewLinks.map((r) => ({
          review_url: r.link || r.review_url || undefined,
          reviewer_name: r.userName || r.reviewer_name || undefined,
          rating: typeof r.rating === "number" ? r.rating : 1.0,
          review_text: r.snippet || r.review_text || undefined,
          review_date: r.date || r.review_date || undefined,
          serp_review_id: r.review_id || r.serp_review_id || undefined,
        }));
        try {
          const revResp = await crm.addReviewsToLead(crmLeadId, reviewsPayload);
          console.log("[crm] Reviews added:", revResp?.reviews_created);
        } catch (e) {
          console.error("[crm] Failed to add reviews to lead", crmLeadId, e.message);
        }
      }
    } catch (err) {
      console.error("[crm] Lead create failed (non-blocking):", err.message);
    }
  }

  let customer = null;
  let setupIntent = null;

  try {
    // Create or reuse a Stripe Customer
    customer = await stripe.customers.create({
      email,
      name: String(name).slice(0, 200),
      metadata: {
        companyName: String(companyName).slice(0, 500),
        ...(crmLeadId ? { lead_id: String(crmLeadId) } : {}),
      },
    });

    // Create SetupIntent — validates the card but does NOT hold/block any money
    setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      metadata: {
        customerName: String(name).slice(0, 500),
        companyName: String(companyName).slice(0, 500),
        reviewCount: String(safeQuantity),
        ...(crmLeadId ? { lead_id: String(crmLeadId) } : {}),
      },
    });

    // Save the submission in DB
    await prisma.checkoutSubmission.create({
      data: {
        name: String(name),
        email: String(email),
        phone: phone ? String(phone).slice(0, 50) : null,
        companyName: String(companyName),
        googleDataId: googleDataId ? String(googleDataId).slice(0, 255) : null,
        reviewLinks: reviewLinks,
        reason: null,
        quantity: safeQuantity,
        amount: safeQuantity * pricePerReview,
        stripeCustomerId: customer.id,
        stripeSetupIntentId: setupIntent.id,
        crmLeadId: crmLeadId || null,
        paymentStatus: "pending",
      },
    });

    return res.json({ clientSecret: setupIntent.client_secret, leadId: crmLeadId });
  } catch (err) {
    console.error("[stripe] Failed to create setup intent", err);
    // Clean up Stripe resources if they were created but DB save failed
    if (setupIntent) {
      try { await stripe.setupIntents.cancel(setupIntent.id); } catch (_) {}
    }
    if (customer) {
      try { await stripe.customers.del(customer.id); } catch (_) {}
    }
    return res.status(500).json({ message: "Could not create setup intent." });
  }
});

// ── Finalize checkout: save confirmed card intake + PATCH CRM lead ─────────────
// Called by the frontend after the SetupIntent succeeds and the
// payment method is confirmed.
app.post("/api/finalize-checkout", async (req, res) => {
  const { setupIntentId } = req.body || {};
  if (!setupIntentId) return res.status(400).json({ message: "Missing setupIntentId." });

  try {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ message: "Stripe is not configured." });

    const si = await stripe.setupIntents.retrieve(String(setupIntentId));
    if (si.status !== "succeeded") {
      return res.status(400).json({ message: "Card has not been saved yet." });
    }

    const paymentMethodId = typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method?.id || null;
    if (!paymentMethodId) {
      return res.status(400).json({ message: "Payment method not found." });
    }

    let submission = await prisma.checkoutSubmission.findFirst({
      where: { stripeSetupIntentId: String(setupIntentId) },
    });
    let updatedSubmission = null;

    if (!submission) {
      const parsed = validateCreditRepairCheckoutPayload(req.body);
      if (!parsed.ok) {
        return res.status(parsed.status).json({ message: parsed.message, fields: parsed.fields });
      }
      const intake = parsed.data;
      const existing = await prisma.checkoutSubmission.findFirst({
        where: { email: intake.normalizedEmail },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({
          message: "An application already exists for this email address. Please log in to your client dashboard or contact support.",
          fields: ["email"],
        });
      }

      const stripeCustomerId = typeof si.customer === "string"
        ? si.customer
        : si.customer?.id || null;

      updatedSubmission = await prisma.checkoutSubmission.create({
        data: {
          name: intake.fullName,
          email: intake.normalizedEmail,
          phone: intake.phone.slice(0, 50),
          address: intake.address.slice(0, 500),
          dob: intake.dob,
          ssnLast4: intake.ssnLast4,
          ssnEncrypted: null,
          idDocPath: intake.idDocPath,
          utilityDocPath: intake.utilityDocPath,
          creditReportDocPath: intake.creditReportDocPath,
          signatureDataUrl: intake.signatureDataUrl,
          signedAt: intake.signatureDataUrl ? new Date() : null,
          authLetterSnapshot: intake.authLetterSnapshot,
          quantity: 1,
          amount: 0,
          stripeCustomerId,
          stripeSetupIntentId: String(setupIntentId),
          stripePaymentMethodId: paymentMethodId,
          paymentStatus: "card_saved",
        },
      });
      submission = updatedSubmission;
    } else {
      updatedSubmission = await prisma.checkoutSubmission.update({
        where: { id: submission.id },
        data: {
          stripePaymentMethodId: paymentMethodId || submission.stripePaymentMethodId,
          paymentStatus: "card_saved",
        },
      });
      submission = updatedSubmission;
    }

    // Patch CRM lead so it auto-flips to status "payment_method_added"
    const crm = require("./helpers/crmClient");
    if (submission.crmLeadId && crm.isCrmEnabled()) {
      try {
        const fullName = String(submission.name || "").trim();
        const spaceIdx = fullName.indexOf(" ");
        const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : (fullName || "-");
        const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "-";
        const settings = getStripeSettings();
        const baseCents = Number(settings.stripe_price_per_review) || 20000;
        const t2Qty = Number(settings.stripe_price_tier2_threshold) || 10;
        const t2Price = Number(settings.stripe_price_tier2) || 30000;
        const t3Qty = Number(settings.stripe_price_tier3_threshold) || 20;
        const t3Price = Number(settings.stripe_price_tier3) || 20000;
        const ppr = submission.quantity >= t3Qty ? t3Price : submission.quantity >= t2Qty ? t2Price : baseCents;

        await crm.createOrUpdateLead({
          lead_id: submission.crmLeadId,
          first_name: firstName,
          last_name: lastName,
          business_name: submission.companyName,
          cost_per_review: ppr / 100,
          stripe_customer_id: submission.stripeCustomerId || undefined,
          stripe_payment_method_id: paymentMethodId || undefined,
        });
        console.log("[crm] Lead patched with Stripe IDs:", submission.crmLeadId);
      } catch (e) {
        console.error("[crm] Failed to patch lead", submission.crmLeadId, e.message);
      }
    }

    let portal = null;
    try {
      const portalResult = await ensureClientDashboardAccountForSubmission(submission.id);
      const urls = buildPortalUrls(req);
      portal = {
        email: portalResult.account.email,
        temporaryPassword: portalResult.temporaryPassword,
        created: portalResult.created,
        passwordReset: portalResult.passwordReset,
        loginUrl: urls.loginUrl,
        dashboardUrl: urls.dashboardUrl,
      };

      if (portalResult.temporaryPassword && await isEmailEnabled("checkout-success")) {
        try {
          await sendCheckoutSuccessEmail(updatedSubmission, portal);
        } catch (e) {
          console.error("[email] checkout success email failed:", e.message);
        }
      }
    } catch (e) {
      console.error("[client-dashboard] account creation failed:", e.message);
    }

    return res.json({ ok: true, portal });
  } catch (err) {
    console.error("[finalize] error:", err);
    return res.status(500).json({ message: "Could not finalize checkout." });
  }
});

// ── Verify payment method (reject prepaid cards) ─────────────────
app.post("/api/verify-payment-method", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ message: "Stripe not configured." });

  const { setupIntentId } = req.body || {};
  if (!setupIntentId) return res.status(400).json({ message: "Missing setupIntentId." });

  try {
    const si = await stripe.setupIntents.retrieve(setupIntentId, {
      expand: ["payment_method"],
    });

    const pm = si.payment_method;
    if (!pm || typeof pm === "string") {
      return res.status(400).json({ message: "Payment method not found." });
    }

    if (pm.card && pm.card.funding === "prepaid") {
      // Detach the prepaid card so it can't be used
      try { await stripe.paymentMethods.detach(pm.id); } catch (_) {}
      // Cancel the SetupIntent
      try { await stripe.setupIntents.cancel(setupIntentId); } catch (_) {}
      console.log("[stripe] Blocked prepaid card for SI:", setupIntentId);
      return res.status(400).json({
        message: "Prepaid cards are not accepted. Please use a debit or credit card.",
        blocked: true,
      });
    }

    return res.json({ ok: true, funding: pm.card?.funding });
  } catch (err) {
    console.error("[stripe] verify-payment-method error:", err.message);
    return res.status(500).json({ message: "Could not verify payment method." });
  }
});

// ── Google Places business search ────────────────────────────────
app.get("/api/google/search-business", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) {
    return res.status(400).json({ message: "Query must be at least 2 characters." });
  }
  if (!getGooglePlacesKey()) {
    return res.status(500).json({ message: "Google Places API is not configured." });
  }
  try {
    // IP geolocation for location-biased results
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
    const geo = await geolocateIp(ip);
    const location = geo ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ") : null;

    const results = await searchPlaces(q, geo);
    console.log(`[search] Places q="${q}" results=${results.length}`);

    return res.json({ results, location });
  } catch (err) {
    console.error("[search] Places error:", err.message);
    return res.status(500).json({ message: "Search failed. Please try again." });
  }
});

// ── Google Maps reviews for a business (SerpAPI) ────────────────
app.get("/api/google/reviews/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ message: "Missing business identifier." });
  }
  if (!getSerpApiKey()) {
    return res.status(500).json({ message: "Google search is not configured." });
  }

  // Detect if this is a Google Places place_id (starts with "ChIJ" or "places/")
  const isPlaceId = id.startsWith("ChIJ") || id.startsWith("places/");
  if (isPlaceId) {
    console.log(`[reviews] Fetching reviews via place_id="${id}"`);
  }

  const nextPageToken = req.query.nextPageToken || null;
  try {
    const result = await getBusinessReviews(id, nextPageToken, isPlaceId);
    return res.json(result);
  } catch (err) {
    console.error("[serpapi] reviews error:", err.message);
    return res.status(500).json({ message: "Failed to fetch reviews. Please try again." });
  }
});

// ── Admin API routes ────────────────────────────────────────────
app.use("/api/admin", adminRoutes);
app.use("/api/secure-uploads", secureUploadsRoutes);
app.use("/api/client", clientDashboardRoutes);

// ── Serve uploaded files (logos, favicons, etc.) ────────────────
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));

function escapeHtmlAttr(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function absoluteUrl(req, value) {
  const origin = `${req.protocol}://${req.get("host")}`;
  if (!value) return origin;
  if (/^https?:\/\//i.test(value)) return value;
  if (String(value).startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

function upsertMeta(html, key, content, attrName = "name") {
  if (!content) return html;
  const tag = `<meta ${attrName}="${key}" content="${escapeHtmlAttr(content)}" />`;
  const re = new RegExp(`<meta\\s+${attrName}=["']${key}["'][^>]*>`, "i");
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `${tag}</head>`);
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(href)}" />`;
  const re = /<link\s+rel=["']canonical["'][^>]*>/i;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `${tag}</head>`);
}

async function injectBlogMeta(req, html) {
  const match = req.path.match(/^\/blog\/([^/?#]+)/);
  if (!match) return html;

  const post = await prisma.blogPost.findUnique({ where: { slug: decodeURIComponent(match[1]) } });
  if (!post || post.status !== "published") {
    return html;
  }

  const meta = {
    title: post.metaTitle || post.ogTitle || post.title,
    description: post.metaDescription || post.ogDescription || post.excerpt || "",
    image: absoluteUrl(req, post.ogImageUrl || post.featuredImageUrl || "/removers-og-image.jpg"),
    canonical: absoluteUrl(req, `/blog/${post.slug}`),
    type: "article",
  };

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlAttr(meta.title)}</title>`);
  html = upsertMeta(html, "description", meta.description);
  html = upsertMeta(html, "og:type", meta.type, "property");
  html = upsertMeta(html, "og:url", meta.canonical, "property");
  html = upsertMeta(html, "og:title", meta.title, "property");
  html = upsertMeta(html, "og:description", meta.description, "property");
  html = upsertMeta(html, "og:image", meta.image, "property");
  html = upsertMeta(html, "twitter:card", "summary_large_image");
  html = upsertMeta(html, "twitter:title", meta.title);
  html = upsertMeta(html, "twitter:description", meta.description);
  html = upsertMeta(html, "twitter:image", meta.image);
  return upsertCanonical(html, meta.canonical);
}

// ── Static files + SPA fallback ─────────────────────────────────
if (fs.existsSync(buildDirectory)) {
  app.get(["/blog", "/blog/"], (_req, res) => res.redirect(301, "/"));

  // Serve index.html with injected site settings so logo/title render
  // without a flash of the default values.
  const indexHtmlPath = path.join(buildDirectory, "index.html");
  let cachedIndexHtml = null;
  const loadIndexHtml = () => {
    if (cachedIndexHtml == null) {
      try { cachedIndexHtml = fs.readFileSync(indexHtmlPath, "utf8"); }
      catch { cachedIndexHtml = ""; }
    }
    return cachedIndexHtml;
  };

  const serveIndex = async (req, res) => {
    let html = loadIndexHtml();
    try {
      const rows = await prisma.setting.findMany({ where: { group: "site" } });
      const settings = {};
      for (const r of rows) settings[r.key] = r.value;
      const inject = `<script>window.__SITE_SETTINGS__=${JSON.stringify(settings).replace(/</g, "\\u003c")};</script>`;
      html = html.replace("</head>", `${inject}</head>`);
      html = await injectBlogMeta(req, html);
    } catch (err) {
      console.warn("[server] could not inject site settings or page metadata:", err.message);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(html);
  };

  // Serve hashed assets etc., but NOT index.html (handled below so we can inject)
  app.use(express.static(buildDirectory, { index: false }));
  app.get("*", serveIndex);
}

// ── Boot runtime (load settings from DB) then start server ──────
boot()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[boot] Failed to initialize:", err);
    process.exit(1);
  });
