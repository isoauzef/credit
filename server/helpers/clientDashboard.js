const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../db");

const BUREAUS = [
  { key: "equifax", name: "Equifax" },
  { key: "experian", name: "Experian" },
  { key: "transunion", name: "TransUnion" },
];

const DOCUMENT_TYPES = {
  photo_id: "Government Photo ID",
  utility_bill: "Utility Bill",
  additional_utility_bill: "Additional Utility Bill",
  other: "Other Document",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(14);
  let password = "";
  for (const byte of bytes) password += alphabet[byte % alphabet.length];
  return password;
}

function getBaseUrl(req) {
  const fromEnv =
    process.env.CLIENT_DASHBOARD_BASE_URL ||
    process.env.PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    "";
  const fromRequest = req?.headers?.origin || "";
  return String(fromEnv || fromRequest).replace(/\/+$/, "");
}

function buildPortalUrls(req) {
  const base = getBaseUrl(req);
  return {
    loginUrl: base ? `${base}/client-login` : "/client-login",
    dashboardUrl: base ? `${base}/client-dashboard` : "/client-dashboard",
  };
}

async function seedBureauReports(accountId) {
  await Promise.all(
    BUREAUS.map((bureau) =>
      prisma.clientBureauReport.upsert({
        where: { accountId_bureau: { accountId, bureau: bureau.key } },
        update: {},
        create: { accountId, bureau: bureau.key },
      })
    )
  );
}

async function ensureClientDashboardAccountForSubmission(submissionId, options = {}) {
  const submission = await prisma.checkoutSubmission.findUnique({
    where: { id: Number(submissionId) },
  });
  if (!submission) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.clientDashboardAccount.findUnique({
    where: { checkoutSubmissionId: submission.id },
  });

  if (existing && !options.resetPassword) {
    await seedBureauReports(existing.id);
    return { account: existing, submission, temporaryPassword: null, created: false, passwordReset: false };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const email = normalizeEmail(submission.email);
  const account = existing
    ? await prisma.clientDashboardAccount.update({
        where: { id: existing.id },
        data: { email, passwordHash, status: "active" },
      })
    : await prisma.clientDashboardAccount.create({
        data: {
          checkoutSubmissionId: submission.id,
          email,
          passwordHash,
          status: "active",
        },
      });

  await seedBureauReports(account.id);

  return {
    account,
    submission,
    temporaryPassword,
    created: !existing,
    passwordReset: Boolean(existing),
  };
}

async function getAccountForSubmission(submissionId) {
  const account = await prisma.clientDashboardAccount.findUnique({
    where: { checkoutSubmissionId: Number(submissionId) },
  });
  if (!account) return null;
  await seedBureauReports(account.id);
  return account;
}

function safeInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateUploadToken(token) {
  if (!token) return null;
  const value = String(token);
  if (!/^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i.test(value)) {
    const err = new Error("Invalid upload token");
    err.statusCode = 400;
    throw err;
  }

  const privateDir = path.join(__dirname, "..", "..", "private-uploads");
  const full = path.join(privateDir, value);
  if (!full.startsWith(privateDir + path.sep) || !fs.existsSync(full)) {
    const err = new Error("Uploaded document not found");
    err.statusCode = 400;
    throw err;
  }
  return value;
}

async function updateBureauReport(accountId, bureau, data = {}) {
  const normalized = String(bureau || "").toLowerCase();
  if (!BUREAUS.some((item) => item.key === normalized)) {
    const err = new Error("Invalid credit bureau");
    err.statusCode = 400;
    throw err;
  }

  const reportDocPath = data.reportDocToken ? validateUploadToken(data.reportDocToken) : undefined;
  const score = safeInt(data.score, 0);
  const update = {
    score: Math.min(score, 850),
    scoreDate: parseDate(data.scoreDate),
    negativeItems: safeInt(data.negativeItems, 0),
    disputes: safeInt(data.disputes, 0),
    deletions: safeInt(data.deletions, 0),
    positivesNote: data.positivesNote ? String(data.positivesNote).slice(0, 5000) : null,
  };

  if (reportDocPath) {
    update.reportDocPath = reportDocPath;
    update.reportUploadedAt = new Date();
  }

  return prisma.clientBureauReport.upsert({
    where: { accountId_bureau: { accountId, bureau: normalized } },
    update,
    create: { accountId, bureau: normalized, ...update },
  });
}

async function addDashboardUpdate(accountId, data = {}) {
  const title = String(data.title || "").trim();
  const body = String(data.body || "").trim();
  if (!title || !body) {
    const err = new Error("Title and update text are required");
    err.statusCode = 400;
    throw err;
  }

  return prisma.clientDashboardUpdate.create({
    data: {
      accountId,
      title: title.slice(0, 160),
      body: body.slice(0, 10000),
      createdBy: String(data.createdBy || "Zack").slice(0, 128),
      disputes: data.disputes === "" || data.disputes == null ? null : safeInt(data.disputes, 0),
      deletions: data.deletions === "" || data.deletions == null ? null : safeInt(data.deletions, 0),
    },
  });
}

async function attachDashboardDocument(accountId, data = {}, uploadedBy = "client") {
  const type = String(data.type || "").trim();
  if (!DOCUMENT_TYPES[type]) {
    const err = new Error("Invalid document type");
    err.statusCode = 400;
    throw err;
  }
  const token = validateUploadToken(data.token);

  return prisma.clientDashboardDocument.create({
    data: {
      accountId,
      type,
      label: String(data.label || DOCUMENT_TYPES[type]).slice(0, 128),
      token,
      originalName: data.originalName ? String(data.originalName).slice(0, 255) : null,
      mimeType: data.mimeType ? String(data.mimeType).slice(0, 100) : null,
      size: data.size == null ? null : safeInt(data.size, 0),
      uploadedBy: String(uploadedBy || "client").slice(0, 32),
    },
  });
}

function serializeDate(value) {
  return value instanceof Date ? value.toISOString() : value || null;
}

async function getClientDashboardSnapshot(accountId) {
  await seedBureauReports(accountId);
  const account = await prisma.clientDashboardAccount.findUnique({
    where: { id: Number(accountId) },
    include: {
      checkoutSubmission: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          dob: true,
          idDocPath: true,
          utilityDocPath: true,
          creditReportDocPath: true,
          signedAt: true,
          createdAt: true,
          paymentStatus: true,
        },
      },
      bureauReports: { orderBy: { id: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!account) return null;

  const submission = account.checkoutSubmission;
  const extraDocs = account.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    label: doc.label,
    token: doc.token,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedBy: doc.uploadedBy,
    createdAt: serializeDate(doc.createdAt),
  }));

  const hasPhotoId = Boolean(submission.idDocPath || extraDocs.some((doc) => doc.type === "photo_id"));
  const hasUtilityBill = Boolean(
    submission.utilityDocPath ||
    extraDocs.some((doc) => doc.type === "utility_bill" || doc.type === "additional_utility_bill")
  );
  const hasSignedAgreement = Boolean(submission.signedAt);
  const readyToStart = hasPhotoId && hasUtilityBill && hasSignedAgreement;
  const photoIdDoc = extraDocs.find((doc) => doc.type === "photo_id");
  const utilityDoc = extraDocs.find((doc) => doc.type === "utility_bill" || doc.type === "additional_utility_bill");

  const bureauReports = BUREAUS.map((bureau) => {
    const report = account.bureauReports.find((item) => item.bureau === bureau.key);
    return {
      bureau: bureau.key,
      name: bureau.name,
      score: report?.score || 0,
      scoreDate: serializeDate(report?.scoreDate),
      negativeItems: report?.negativeItems || 0,
      disputes: report?.disputes || 0,
      deletions: report?.deletions || 0,
      positivesNote: report?.positivesNote || "",
      reportDocPath: report?.reportDocPath || null,
      reportUploadedAt: serializeDate(report?.reportUploadedAt),
    };
  });

  const totals = bureauReports.reduce(
    (acc, report) => {
      acc.negativeItems += report.negativeItems;
      acc.disputes += report.disputes;
      acc.deletions += report.deletions;
      return acc;
    },
    { negativeItems: 0, disputes: 0, deletions: 0 }
  );

  return {
    account: {
      id: account.id,
      email: account.email,
      status: account.status,
      createdAt: serializeDate(account.createdAt),
      lastLoginAt: serializeDate(account.lastLoginAt),
    },
    client: {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      address: submission.address,
      dob: submission.dob,
      createdAt: serializeDate(submission.createdAt),
      paymentStatus: submission.paymentStatus,
    },
    agent: {
      name: "Zack",
      role: "Credit Repair Agent",
      referral: "Credit Removers",
    },
    documents: {
      readyToStart,
      required: [
        { key: "signed_agreement", label: "Signed Client Agreement", uploaded: hasSignedAgreement, uploadedAt: serializeDate(submission.signedAt) },
        { key: "photo_id", label: "Government Photo ID", uploaded: hasPhotoId, uploadedAt: submission.idDocPath ? serializeDate(submission.createdAt) : photoIdDoc?.createdAt || null },
        { key: "utility_bill", label: "Utility Bill", uploaded: hasUtilityBill, uploadedAt: submission.utilityDocPath ? serializeDate(submission.createdAt) : utilityDoc?.createdAt || null },
      ],
      initial: {
        photoIdToken: submission.idDocPath,
        utilityBillToken: submission.utilityDocPath,
        creditReportToken: submission.creditReportDocPath,
      },
      extra: extraDocs,
    },
    bureauReports,
    totals,
    updates: account.updates.map((update) => ({
      id: update.id,
      title: update.title,
      body: update.body,
      createdBy: update.createdBy,
      disputes: update.disputes,
      deletions: update.deletions,
      createdAt: serializeDate(update.createdAt),
    })),
  };
}

module.exports = {
  BUREAUS,
  DOCUMENT_TYPES,
  buildPortalUrls,
  ensureClientDashboardAccountForSubmission,
  getAccountForSubmission,
  getClientDashboardSnapshot,
  updateBureauReport,
  addDashboardUpdate,
  attachDashboardDocument,
};
