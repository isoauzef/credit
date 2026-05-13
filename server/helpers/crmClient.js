/**
 * CRM API client for ReviewCleaners CRM (https://crm.reviewcleaners.com)
 *
 * Configuration is loaded from the Settings table:
 *   - crm_api_key   (REQUIRED — Bearer / API_KEY header value)
 *   - crm_base_url  (optional — defaults to https://crm.reviewcleaners.com)
 *
 * All functions throw on non-2xx responses; callers should wrap in try/catch
 * and log the failure rather than aborting the user-facing checkout flow.
 */

function getConfig() {
  const { getCrmConfig } = require("./runtime");
  const cfg = getCrmConfig() || {};
  const apiKey = cfg.crm_api_key || null;
  const baseUrl = (cfg.crm_base_url || "https://crm.reviewcleaners.com").replace(/\/+$/, "");
  return { apiKey, baseUrl };
}

function isCrmEnabled() {
  return Boolean(getConfig().apiKey);
}

async function callCrm(method, path, body) {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    throw new Error("CRM API key is not configured");
  }
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "API_KEY": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { /* keep raw text */ }
  if (!res.ok) {
    const err = new Error(`CRM ${method} ${path} failed: ${res.status} ${text || ""}`.trim());
    err.status = res.status;
    err.body = json || text;
    throw err;
  }
  return json;
}

/**
 * Create a new lead OR update an existing one.
 * Pass `lead_id` in payload to trigger update (PATCH) behavior.
 *
 * @param {Object} payload — see api_payloads.js for full schema
 * @returns {Promise<{id:number, business_name:string, status:string}>}
 */
async function createOrUpdateLead(payload) {
  return callCrm("POST", "/api/leads", payload);
}

/**
 * Bulk-add reviews to a lead.
 * @param {number} leadId
 * @param {Array<Object>} reviews
 * @returns {Promise<{lead_id:number, reviews_created:number, success:boolean}>}
 */
async function addReviewsToLead(leadId, reviews) {
  return callCrm("POST", `/api/leads/${leadId}/reviews`, { reviews });
}

module.exports = {
  isCrmEnabled,
  createOrUpdateLead,
  addReviewsToLead,
};
