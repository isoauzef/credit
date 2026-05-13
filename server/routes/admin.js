const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";

// ── Login (public — no auth required) ───────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, email: user.email });
  } catch (err) {
    console.error("[admin] login error", err);
    return res.status(500).json({ message: "Login failed." });
  }
});

// ── Auth middleware (JWT Bearer) ────────────────────────────────────
function requireAdmin(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    req.adminUser = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

router.use(requireAdmin);

// ── Change admin credentials ────────────────────────────────────────
router.put("/account", async (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ message: "Current password required." });
  }

  try {
    const user = await prisma.adminUser.findUnique({ where: { id: req.adminUser.id } });
    if (!user) return res.status(404).json({ message: "User not found." });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect." });

    const data = {};
    if (newEmail && newEmail.trim()) data.email = newEmail.toLowerCase().trim();
    if (newPassword && newPassword.length >= 6) data.passwordHash = await bcrypt.hash(newPassword, 12);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const updated = await prisma.adminUser.update({ where: { id: user.id }, data });

    // Issue new token with possibly updated email
    const token = jwt.sign({ id: updated.id, email: updated.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ ok: true, token, email: updated.email });
  } catch (err) {
    console.error("[admin] account update error", err);
    return res.status(500).json({ message: "Update failed." });
  }
});

// ── Current admin info ──────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.adminUser.id },
      select: { id: true, email: true, createdAt: true },
    });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: "Failed to load" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  CONTACT SUBMISSIONS
// ═══════════════════════════════════════════════════════════════════
router.get("/contact-submissions", async (_req, res) => {
  try {
    const rows = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(rows);
  } catch (err) {
    console.error("[admin] contact-submissions list", err);
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.delete("/contact-submissions/:id", async (req, res) => {
  try {
    await prisma.contactSubmission.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(404).json({ message: "Not found" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  CHECKOUT SUBMISSIONS
// ═══════════════════════════════════════════════════════════════════
router.get("/checkout-submissions", async (_req, res) => {
  try {
    const rows = await prisma.checkoutSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(rows);
  } catch (err) {
    console.error("[admin] checkout-submissions list", err);
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.delete("/checkout-submissions/:id", async (req, res) => {
  try {
    await prisma.checkoutSubmission.delete({ where: { id: Number(req.params.id) } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(404).json({ message: "Not found" });
  }
});

// Charge customer (create PaymentIntent using saved card)
router.post("/checkout-submissions/:id/charge", async (req, res) => {
  try {
    const submission = await prisma.checkoutSubmission.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!submission) return res.status(404).json({ message: "Not found" });
    if (!submission.stripeCustomerId || !submission.stripePaymentMethodId) {
      return res.status(400).json({ message: "No saved payment method to charge" });
    }
    if (submission.paymentStatus === "charged") {
      return res.status(400).json({ message: "Already charged" });
    }

    const stripeClient = getStripeClient();
    if (!stripeClient) return res.status(500).json({ message: "Stripe not configured" });

    // Use the amount calculated at checkout time, not current settings
    const chargeAmount = submission.amount;

    const pi = await stripeClient.paymentIntents.create({
      amount: chargeAmount,
      currency: "usd",
      customer: submission.stripeCustomerId,
      payment_method: submission.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Review removal — ${submission.quantity} review(s) for ${submission.companyName}`,
      metadata: {
        submissionId: String(submission.id),
        customerName: submission.name,
        companyName: submission.companyName,
      },
    });

    await prisma.checkoutSubmission.update({
      where: { id: submission.id },
      data: {
        stripePaymentIntentId: pi.id,
        amount: chargeAmount,
        paymentStatus: pi.status === "succeeded" ? "charged" : pi.status,
      },
    });

    return res.json({ ok: true, status: pi.status, amount: chargeAmount });
  } catch (err) {
    console.error("[admin] charge payment", err);
    return res.status(500).json({ message: err.message || "Charge failed" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════
router.get("/email-templates", async (_req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { id: "asc" } });
    return res.json(templates);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.get("/email-templates/:slug", async (req, res) => {
  try {
    const t = await prisma.emailTemplate.findUnique({ where: { slug: req.params.slug } });
    if (!t) return res.status(404).json({ message: "Not found" });
    return res.json(t);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.put("/email-templates/:slug", async (req, res) => {
  const { name, subject, previewText, content, enabled } = req.body;
  try {
    const updated = await prisma.emailTemplate.update({
      where: { slug: req.params.slug },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(previewText !== undefined && { previewText }),
        ...(content !== undefined && { content }),
        ...(enabled !== undefined && { enabled }),
      },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════
router.get("/settings", async (_req, res) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { id: "asc" } });
    // Group by category
    const grouped = {};
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    }
    return res.json(grouped);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.put("/settings", async (req, res) => {
  const updates = req.body; // { key: value, key: value, ... }
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ message: "Invalid body" });
  }

  try {
    for (const [key, value] of Object.entries(updates)) {
      const group = key.startsWith("stripe_") ? "stripe"
        : key.startsWith("smtp_") ? "smtp"
        : key.startsWith("serp_") ? "serpapi"
        : key.startsWith("google_") ? "google"
        : key.startsWith("email_") ? "email"
        : key.startsWith("crm_") ? "crm"
        : "site";
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), group },
      });
    }

    // Refresh runtime caches
    const { refreshStripe, refreshSmtp, refreshSerpApi, refreshGooglePlaces, refreshCrm } = require("../helpers/runtime");
    await refreshStripe();
    await refreshSmtp();
    await refreshSerpApi();
    await refreshGooglePlaces();
    await refreshCrm();

    return res.json({ ok: true });
  } catch (err) {
    console.error("[admin] settings update", err);
    return res.status(500).json({ message: "Failed to save" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  PAGE CONTENT
// ═══════════════════════════════════════════════════════════════════
router.get("/page-content/:page", async (req, res) => {
  try {
    const rows = await prisma.pageContent.findMany({
      where: { page: req.params.page },
    });
    const result = {};
    for (const r of rows) result[r.section] = r.content;
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load" });
  }
});

router.put("/page-content/:page/:section", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: "content is required" });

  try {
    const updated = await prisma.pageContent.upsert({
      where: { page_section: { page: req.params.page, section: req.params.section } },
      update: { content },
      create: { page: req.params.page, section: req.params.section, content },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to save" });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  FILE UPLOAD (logo, favicon)
// ═══════════════════════════════════════════════════════════════════
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(svg|png|jpg|jpeg|ico|webp|gif)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const publicPath = `/uploads/${req.file.filename}`;
  return res.json({ path: publicPath, filename: req.file.filename });
});

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════
router.get("/stats", async (_req, res) => {
  try {
    const [totalContacts, totalCheckouts, authorized, captured] = await Promise.all([
      prisma.contactSubmission.count(),
      prisma.checkoutSubmission.count(),
      prisma.checkoutSubmission.count({ where: { paymentStatus: "authorized" } }),
      prisma.checkoutSubmission.count({ where: { paymentStatus: "captured" } }),
    ]);
    const capturedRows = await prisma.checkoutSubmission.findMany({
      where: { paymentStatus: "captured" },
      select: { amount: true },
    });
    const revenue = capturedRows.reduce((s, r) => s + r.amount, 0);

    return res.json({ totalContacts, totalCheckouts, authorized, captured, revenue });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

// ── Helper: get Stripe client from settings ─────────────────────
function getStripeClient() {
  try {
    const { getStripe } = require("../helpers/runtime");
    return getStripe();
  } catch {
    return null;
  }
}

module.exports = router;
