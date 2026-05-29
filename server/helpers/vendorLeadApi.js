const crypto = require("crypto");
const prisma = require("../db");

const ROUND_ROBIN_SETTING_KEY = "contact_lead_vendor_last_id";
const ROUND_ROBIN_LOCK_NAME = "contact_lead_vendor_round_robin";

const CREDIT_SCORE_LABELS = {
  "400-500": "400 - 500",
  "501-600": "501 - 600",
  "601-700": "601 - 700",
  "701-800+": "701 - 800+",
  unknown: "Unknown",
};

const NEGATIVE_ITEM_LABELS = {
  "1-5": "1 - 5",
  "6-9": "6 - 9",
  "10+": "10+",
  unknown: "Unknown",
};

const HAS_REPORT_LABELS = {
  yes: "Yes",
  no: "No",
};

function generateApiKey() {
  return `crv_live_${crypto.randomBytes(32).toString("base64url")}`;
}

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(String(apiKey)).digest("hex");
}

function previewApiKey(apiKey) {
  const key = String(apiKey);
  return `${key.slice(0, 12)}...${key.slice(-6)}`;
}

function cleanString(value, maxLength) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function labelValue(labels, value) {
  const key = typeof value === "string" ? value : "";
  return labels[key] || key || "Not provided";
}

function buildVendorLeadNotes(metadata) {
  const m = metadata && typeof metadata === "object" ? metadata : {};
  return [
    `Credit Score: ${labelValue(CREDIT_SCORE_LABELS, m.creditScore)}`,
    `Negative Items: ${labelValue(NEGATIVE_ITEM_LABELS, m.negativeItems)}`,
    `Has Credit Report: ${labelValue(HAS_REPORT_LABELS, m.hasCreditReport)}`,
  ].join("\n");
}

function serializeVendorLead(lead) {
  return {
    id: lead.id,
    date: lead.createdAt,
    name: lead.name,
    email: lead.email,
    phone: lead.phone || "",
    notes: buildVendorLeadNotes(lead.metadata),
  };
}

function serializeApiVendor(vendor, counts = {}, apiKey) {
  return {
    id: vendor.id,
    name: vendor.name,
    contactEmail: vendor.contactEmail,
    keyPreview: vendor.keyPreview,
    active: vendor.active,
    sortOrder: vendor.sortOrder,
    notes: vendor.notes,
    lastUsedAt: vendor.lastUsedAt,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
    assignedLeadCount: counts.assignedLeadCount || 0,
    deliveredLeadCount: counts.deliveredLeadCount || 0,
    pendingLeadCount: counts.pendingLeadCount || 0,
    ...(apiKey ? { apiKey } : {}),
  };
}

async function acquireRoundRobinLock(tx) {
  const rows = await tx.$queryRawUnsafe(`SELECT GET_LOCK('${ROUND_ROBIN_LOCK_NAME}', 5) AS acquired`);
  return Number(rows?.[0]?.acquired || 0) === 1;
}

async function releaseRoundRobinLock(tx) {
  try {
    await tx.$queryRawUnsafe(`SELECT RELEASE_LOCK('${ROUND_ROBIN_LOCK_NAME}')`);
  } catch (err) {
    console.error("[vendor-api] failed to release round-robin lock", err.message);
  }
}

async function pickNextActiveVendor(tx) {
  let locked = false;
  try {
    locked = await acquireRoundRobinLock(tx);
  } catch (err) {
    console.error("[vendor-api] round-robin lock unavailable; assigning without lock", err.message);
  }

  try {
    const vendors = await tx.apiVendor.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    if (!vendors.length) return null;

    const setting = await tx.setting.findUnique({ where: { key: ROUND_ROBIN_SETTING_KEY } });
    const lastId = Number(setting?.value || 0);
    const lastIndex = vendors.findIndex((vendor) => vendor.id === lastId);
    const nextVendor = vendors[(lastIndex + 1) % vendors.length];

    await tx.setting.upsert({
      where: { key: ROUND_ROBIN_SETTING_KEY },
      create: {
        key: ROUND_ROBIN_SETTING_KEY,
        value: String(nextVendor.id),
        group: "vendor_api",
      },
      update: {
        value: String(nextVendor.id),
        group: "vendor_api",
      },
    });

    return nextVendor;
  } finally {
    if (locked) await releaseRoundRobinLock(tx);
  }
}

async function createContactSubmissionWithVendor(data) {
  return prisma.$transaction(async (tx) => {
    const vendor = await pickNextActiveVendor(tx);
    return tx.contactSubmission.create({
      data: {
        ...data,
        assignedVendorId: vendor?.id || null,
        vendorAssignedAt: vendor ? new Date() : null,
      },
    });
  });
}

function buildApiVendorData(input = {}) {
  const name = cleanString(input.name, 160);
  return {
    name,
    contactEmail: cleanString(input.contactEmail, 255),
    active: input.active === false ? false : true,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    notes: cleanString(input.notes, 2000),
  };
}

module.exports = {
  buildApiVendorData,
  createContactSubmissionWithVendor,
  generateApiKey,
  hashApiKey,
  previewApiKey,
  serializeApiVendor,
  serializeVendorLead,
};
