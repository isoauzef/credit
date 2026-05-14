/**
 * Runtime helpers — reads Stripe & SMTP config from the settings table
 * and exposes lazily-cached singletons that can be refreshed from the admin panel.
 */
const prisma = require("../db");

let _stripe = null;
let _stripeSettings = {};
let _smtpConfig = null;

// ── Stripe ──────────────────────────────────────────────────────
async function loadStripeSettings() {
  const rows = await prisma.setting.findMany({ where: { group: "stripe" } });
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

async function refreshStripe() {
  const s = await loadStripeSettings();
  _stripeSettings = s;
  const mode = s.stripe_mode || "test";
  const secretKey =
    mode === "live" ? s.stripe_live_secret_key : s.stripe_test_secret_key;
  if (secretKey) {
    _stripe = require("stripe")(secretKey);
  } else {
    _stripe = null;
  }
  return _stripe;
}

function getStripe() {
  return _stripe;
}

function getStripeSettings() {
  return _stripeSettings;
}

// ── SMTP ────────────────────────────────────────────────────────
async function loadSmtpSettings() {
  const rows = await prisma.setting.findMany({ where: { group: "smtp" } });
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

async function refreshSmtp() {
  _smtpConfig = await loadSmtpSettings();
  // Reset cached transporter so new settings take effect
  try { require("../email/mailer").resetTransporter(); } catch {}
  return _smtpConfig;
}

function getSmtpConfig() {
  return _smtpConfig;
}

// ── Email toggle check ──────────────────────────────────────────
async function isEmailEnabled(slug) {
  // slug: "quote-autoresponse" → key: "email_quote_enabled"
  // slug: "checkout-success" → key: "email_checkout_enabled"
  const keyMap = {
    "quote-autoresponse": "email_quote_enabled",
    "checkout-success": "email_checkout_enabled",
  };
  const settingKey = keyMap[slug];
  if (!settingKey) return false;
  const row = await prisma.setting.findUnique({ where: { key: settingKey } });
  return row?.value === "true";
}

// ── SerpAPI ─────────────────────────────────────────────────────
let _serpApiKey = null;

async function refreshSerpApi() {
  const row = await prisma.setting.findUnique({ where: { key: "serpapi_api_key" } });
  _serpApiKey = row?.value || process.env.SERPAPI_KEY || null;
  return _serpApiKey;
}

function getSerpApiKey() {
  return _serpApiKey;
}

// ── Google Places ───────────────────────────────────────────────
let _googlePlacesKey = null;

async function refreshGooglePlaces() {
  const row = await prisma.setting.findUnique({ where: { key: "google_places_api_key" } });
  _googlePlacesKey = row?.value || process.env.GOOGLE_PLACES_API_KEY || null;
  return _googlePlacesKey;
}

function getGooglePlacesKey() {
  return _googlePlacesKey;
}

// ── CRM (creditremovers CRM) ────────────────────────────────────
let _crmConfig = {};

async function refreshCrm() {
  const rows = await prisma.setting.findMany({ where: { group: "crm" } });
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  _crmConfig = map;
  return _crmConfig;
}

function getCrmConfig() {
  return _crmConfig;
}

// ── Boot — call once at startup ─────────────────────────────────
async function boot() {
  await refreshStripe();
  await refreshSmtp();
  await refreshSerpApi();
  await refreshGooglePlaces();
  await refreshCrm();
  console.log("[runtime] Stripe mode:", _stripeSettings.stripe_mode || "test");
  console.log("[runtime] SMTP host:", _smtpConfig?.smtp_host || "(not set)");
  console.log("[runtime] SerpAPI key:", _serpApiKey ? "configured" : "(not set)");
  console.log("[runtime] Google Places key:", _googlePlacesKey ? "configured" : "(not set)");
  console.log("[runtime] CRM key:", _crmConfig?.crm_api_key ? "configured" : "(not set)");
}

module.exports = {
  boot,
  refreshStripe,
  refreshSmtp,
  refreshSerpApi,
  refreshGooglePlaces,
  refreshCrm,
  getStripe,
  getStripeSettings,
  getSmtpConfig,
  getSerpApiKey,
  getGooglePlacesKey,
  getCrmConfig,
  isEmailEnabled,
};
