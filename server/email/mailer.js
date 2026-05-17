const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");
const sharp = require("sharp");
const { buildSubmissionEmail, loadTemplateData } = require("./renderEmail");

let cachedTransporter;
const logoBufferCache = new Map();

/**
 * Build a nodemailer transporter using DB-driven SMTP settings.
 * Falls back to env vars for backward compatibility.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  let smtp;
  try {
    const { getSmtpConfig } = require("../helpers/runtime");
    smtp = getSmtpConfig();
  } catch { smtp = null; }

  const host = smtp?.smtp_host || process.env.SMTP_HOST;
  const port = Number(smtp?.smtp_port || process.env.SMTP_PORT) || 465;
  const secure = String(smtp?.smtp_secure ?? process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
  const user = smtp?.smtp_user || process.env.SMTP_USER;
  const pass = smtp?.smtp_pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return cachedTransporter;
}

function smtpFrom() {
  try {
    const { getSmtpConfig } = require("../helpers/runtime");
    const smtp = getSmtpConfig();
    return smtp?.smtp_from || process.env.SMTP_FROM;
  } catch { return process.env.SMTP_FROM; }
}

function smtpReplyTo() {
  try {
    const { getSmtpConfig } = require("../helpers/runtime");
    const smtp = getSmtpConfig();
    return smtp?.smtp_reply_to || process.env.SMTP_REPLY_TO || smtpFrom();
  } catch { return process.env.SMTP_REPLY_TO || process.env.SMTP_FROM; }
}

/** Reset cached transporter (called when SMTP settings change) */
function resetTransporter() { cachedTransporter = null; }

async function sendSubmissionEmail(submission) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] Skipping auto-response (SMTP not configured).");
    return null;
  }

  const recipientEmail = submission?.email;
  if (!recipientEmail) {
    console.warn("[email] Submission missing recipient email, skipping.");
    return null;
  }

  const result = await buildSubmissionEmail(submission);
  if (!result) {
    console.warn("[email] Quote autoresponse template disabled, skipping.");
    return null;
  }
  const { subject, html, text, previewText } = result;
  const attachments = await buildAttachments("quote-autoresponse");
  const info = await transporter.sendMail({
    from: smtpFrom(),
    to: recipientEmail,
    replyTo: smtpReplyTo(),
    subject,
    text,
    html,
    attachments,
    headers: {
      "X-Entity-Ref-ID": submission.submittedAt || Date.now().toString(),
      "X-creditremovers-Preview": previewText,
    },
  });

  console.log("[email] Auto-response queued:", info.messageId);
  return info;
}

async function sendCheckoutSuccessEmail(submission) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] Skipping checkout-success email (SMTP not configured).");
    return null;
  }
  if (!submission?.email) return null;

  const result = await buildSubmissionEmail(submission, "checkout-success");
  if (!result) {
    console.warn("[email] Checkout success template disabled, skipping.");
    return null;
  }
  const { subject, html, text } = result;
  const attachments = await buildAttachments("checkout-success");

  const info = await transporter.sendMail({
    from: smtpFrom(),
    to: submission.email,
    replyTo: smtpReplyTo(),
    subject,
    text,
    html,
    attachments,
  });

  console.log("[email] Checkout success email queued:", info.messageId);
  return info;
}

module.exports = {
  sendSubmissionEmail,
  sendCheckoutSuccessEmail,
  resetTransporter,
  buildAttachments,
};

function resolveLogoAttachmentPath(attachmentPath) {
  const projectRoot = path.join(__dirname, "..", "..");

  // Admin uploads are stored as public web paths, e.g. /uploads/logo.png.
  // path.isAbsolute('/uploads/logo.png') is true on Linux, so this check must
  // run before the generic absolute-path branch.
  if (attachmentPath.startsWith("/uploads/") || attachmentPath.startsWith("/assets/")) {
    return path.join(projectRoot, "public", attachmentPath.replace(/^\/+/, ""));
  }

  if (path.isAbsolute(attachmentPath)) {
    return attachmentPath;
  }

  return path.resolve(__dirname, attachmentPath);
}

function guessLogoContentType(filePath, fallback) {
  if (fallback) return fallback;
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".gif") return "image/gif";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  return undefined;
}

async function buildAttachments(slug = "quote-autoresponse") {
  const { templateData } = await loadTemplateData(slug);
  const attachments = [];
  const logoUrl = templateData?.brand?.logoUrl;
  const attachmentPath = templateData?.brand?.logoAttachmentPath;

  if (logoUrl && logoUrl.startsWith("cid:") && attachmentPath) {
    const absolutePath = resolveLogoAttachmentPath(attachmentPath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[email] Logo attachment not found: ${absolutePath}`);
      return attachments;
    }
    const extension = path.extname(absolutePath).toLowerCase();
    const cid = logoUrl.replace("cid:", "");

    if (extension === ".svg") {
      try {
        const pngBuffer = await getCachedLogoPng(absolutePath);
        attachments.push({
          filename: "branding-image.png",
          content: pngBuffer,
          cid,
          contentDisposition: "inline",
          contentType: "image/png",
        });
      } catch (error) {
        console.warn(`[email] Failed to rasterize SVG logo for inline attachment: ${error.message}`);
        attachments.push({
          filename: "branding-image.svg",
          path: absolutePath,
          cid,
          contentDisposition: "inline",
          contentType: templateData.brand?.logoAttachmentType || "image/svg+xml",
        });
      }
    } else {
      attachments.push({
        filename: path.basename(absolutePath) || "branding-image",
        path: absolutePath,
        cid,
        contentDisposition: "inline",
        contentType: guessLogoContentType(absolutePath, templateData.brand?.logoAttachmentType),
      });
    }
  }

  return attachments;
}

async function getCachedLogoPng(svgPath) {
  if (logoBufferCache.has(svgPath)) {
    return logoBufferCache.get(svgPath);
  }

  const svgContents = fs.readFileSync(svgPath);
  const buffer = await sharp(svgContents).png().toBuffer();
  logoBufferCache.set(svgPath, buffer);
  return buffer;
}
