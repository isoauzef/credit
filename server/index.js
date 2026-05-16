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
const { encryptPII, decryptPII, isKmsConfigured } = require("./helpers/encryption");

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
        // Send checkout success email if enabled
        if (await isEmailEnabled("checkout-success")) {
          const sub = await prisma.checkoutSubmission.findFirst({
            where: { stripeSetupIntentId: si.id },
          });
          if (sub) {
            try {
              await sendCheckoutSuccessEmail(sub);
            } catch (e) {
              console.error("[email] checkout success email failed:", e.message);
            }
          }
        }
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
        idDocPath: true, utilityDocPath: true, signedAt: true,
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
app.get("/api/stripe-publishable-key", (_req, res) => {
  const settings = getStripeSettings();
  const mode = settings.stripe_mode || "test";
  const pk = mode === "live" ? settings.stripe_live_publishable_key : settings.stripe_test_publishable_key;
  if (!pk) return res.status(500).json({ message: "Stripe not configured" });
  return res.json({ publishableKey: pk });
});

// ── Public: price per review (cents) ────────────────────────────
app.get("/api/stripe-price", (_req, res) => {
  const settings = getStripeSettings();
  return res.json({
    pricePerReview: Number(settings.stripe_price_per_review) || 40000,
    tier2Threshold: Number(settings.stripe_price_tier2_threshold) || 10,
    tier2Price: Number(settings.stripe_price_tier2) || 30000,
    tier3Threshold: Number(settings.stripe_price_tier3_threshold) || 20,
    tier3Price: Number(settings.stripe_price_tier3) || 20000,
  });
});

// ── Credit-repair checkout: save PII + uploads + signature + SetupIntent ──
app.post("/api/credit-repair-checkout", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const {
    firstName, lastName, email, phone, address, dob, ssn,
    idDocToken, utilityDocToken,
    signatureDataUrl, authLetterSnapshot,
  } = req.body || {};

  // ── Validation ──
  const errors = [];
  if (!firstName || String(firstName).trim().length < 1) errors.push("firstName");
  if (!lastName || String(lastName).trim().length < 1) errors.push("lastName");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) errors.push("email");
  if (!phone || String(phone).replace(/\D/g, "").length < 7) errors.push("phone");
  if (!address || String(address).trim().length < 5) errors.push("address");
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(String(dob))) errors.push("dob");
  const ssnDigits = String(ssn || "").replace(/\D/g, "");
  if (ssnDigits.length !== 9) errors.push("ssn");
  if (!idDocToken || !/^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i.test(String(idDocToken))) errors.push("idDocToken");
  if (!utilityDocToken || !/^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i.test(String(utilityDocToken))) errors.push("utilityDocToken");
  if (!signatureDataUrl || !/^data:image\/png;base64,/.test(String(signatureDataUrl))) errors.push("signature");
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", fields: errors });
  }

  // ── Verify upload tokens correspond to files on disk ──
  const privateDir = path.join(__dirname, "..", "private-uploads");
  for (const t of [idDocToken, utilityDocToken]) {
    const full = path.join(privateDir, String(t));
    if (!full.startsWith(privateDir + path.sep) || !fs.existsSync(full)) {
      return res.status(400).json({ message: "Uploaded document not found. Please re-upload." });
    }
  }

  // ── Limit signature size to prevent DB abuse (~256KB for PNG data URL) ──
  if (String(signatureDataUrl).length > 350_000) {
    return res.status(413).json({ message: "Signature image too large." });
  }

  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
  let customer = null;
  let setupIntent = null;
  let ssnEncrypted = null;

  try {
    // Encrypt full SSN (last 4 stored in clear for admin reference)
    ssnEncrypted = await encryptPII(ssnDigits);
  } catch (err) {
    console.error("[credit-repair] SSN encryption failed:", err.message);
    return res.status(500).json({ message: "Could not securely store sensitive information." });
  }

  try {
    customer = await stripe.customers.create({
      email: String(email),
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

    const submission = await prisma.checkoutSubmission.create({
      data: {
        name: fullName,
        email: String(email),
        phone: String(phone).slice(0, 50),
        address: String(address).slice(0, 500),
        dob: String(dob),
        ssnLast4: ssnDigits.slice(-4),
        ssnEncrypted,
        idDocPath: String(idDocToken),
        utilityDocPath: String(utilityDocToken),
        signatureDataUrl: String(signatureDataUrl),
        signedAt: new Date(),
        authLetterSnapshot: authLetterSnapshot ? String(authLetterSnapshot).slice(0, 10000) : null,
        quantity: 1,
        amount: 0,
        stripeCustomerId: customer.id,
        stripeSetupIntentId: setupIntent.id,
        paymentStatus: "pending",
      },
    });

    return res.json({
      clientSecret: setupIntent.client_secret,
      submissionId: submission.id,
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
  const baseCents = Number(settings.stripe_price_per_review) || 40000;
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

// ── Finalize checkout: PATCH CRM lead with Stripe IDs ─────────────
// Called by the frontend after the SetupIntent succeeds and the
// payment method is confirmed. Failures are non-blocking.
app.post("/api/finalize-checkout", async (req, res) => {
  const { setupIntentId } = req.body || {};
  if (!setupIntentId) return res.status(400).json({ message: "Missing setupIntentId." });

  try {
    const submission = await prisma.checkoutSubmission.findFirst({
      where: { stripeSetupIntentId: String(setupIntentId) },
    });
    if (!submission) return res.status(404).json({ message: "Submission not found." });

    const stripe = getStripe();
    let paymentMethodId = submission.stripePaymentMethodId;
    if (!paymentMethodId && stripe) {
      try {
        const si = await stripe.setupIntents.retrieve(setupIntentId);
        paymentMethodId = typeof si.payment_method === "string"
          ? si.payment_method
          : si.payment_method?.id || null;
      } catch (e) {
        console.error("[finalize] Could not retrieve SetupIntent", e.message);
      }
    }

    // Persist payment method id + status in our DB
    await prisma.checkoutSubmission.update({
      where: { id: submission.id },
      data: {
        stripePaymentMethodId: paymentMethodId || submission.stripePaymentMethodId,
        paymentStatus: "card_saved",
      },
    });

    // Patch CRM lead so it auto-flips to status "payment_method_added"
    const crm = require("./helpers/crmClient");
    if (submission.crmLeadId && crm.isCrmEnabled()) {
      try {
        const fullName = String(submission.name || "").trim();
        const spaceIdx = fullName.indexOf(" ");
        const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : (fullName || "-");
        const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "-";
        const settings = getStripeSettings();
        const baseCents = Number(settings.stripe_price_per_review) || 40000;
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

    return res.json({ ok: true });
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

// ── Serve uploaded files (logos, favicons, etc.) ────────────────
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));

// ── Static files + SPA fallback ─────────────────────────────────
if (fs.existsSync(buildDirectory)) {
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

  const serveIndex = async (_req, res) => {
    let html = loadIndexHtml();
    try {
      const rows = await prisma.setting.findMany({ where: { group: "site" } });
      const settings = {};
      for (const r of rows) settings[r.key] = r.value;
      const inject = `<script>window.__SITE_SETTINGS__=${JSON.stringify(settings).replace(/</g, "\\u003c")};</script>`;
      html = html.replace("</head>", `${inject}</head>`);
    } catch (err) {
      console.warn("[server] could not inject site settings:", err.message);
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
