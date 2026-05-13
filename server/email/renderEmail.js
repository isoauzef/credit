const fs = require("fs");
const path = require("path");

/**
 * Load template data from the database (EmailTemplate.content JSON).
 * Falls back to the static JSON file for backward compatibility.
 */
async function loadTemplateData(slug) {
  try {
    const prisma = require("../db");
    const tpl = await prisma.emailTemplate.findUnique({ where: { slug } });
    if (tpl && tpl.content) {
      const content = typeof tpl.content === "string" ? JSON.parse(tpl.content) : tpl.content;
      return { templateData: content, subject: tpl.subject, previewText: tpl.previewText, enabled: tpl.enabled };
    }
  } catch (err) {
    console.warn("[email] Failed to load template from DB, falling back to file:", err.message);
  }
  // Fallback to static file
  const templateDataPath = path.join(__dirname, "template-data.json");
  const data = JSON.parse(fs.readFileSync(templateDataPath, "utf8"));
  return { templateData: data, subject: data.subjectTemplate, previewText: data.previewText, enabled: true };
}

function get(obj, keyPath) {
  return keyPath.split(".").reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

function interpolate(templateString, context) {
  if (!templateString) {
    return "";
  }

  return templateString.replace(/{{\s*([^}]+)\s*}}/g, (_match, token) => {
    const value = get(context, token.trim());
    return value === undefined || value === null ? "" : String(value);
  });
}

function getRecipientFirstName(submission) {
  const metadataName = submission?.metadata?.firstName;
  if (metadataName && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (submission?.name) {
    const parts = submission.name.trim().split(/\s+/);
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
  }

  return "there";
}

function buildInterpolationContext(submission, templateData) {
  const firstName = getRecipientFirstName(submission);
  const amount = submission?.amount ? `$${(submission.amount / 100).toFixed(2)}` : "";
  return {
    ...templateData,
    // Flatten submission fields so tokens like {{name}}, {{companyName}} work
    name: submission?.name || "",
    email: submission?.email || "",
    companyName: submission?.companyName || "",
    quantity: String(submission?.quantity || 1),
    amount,
    submission,
    firstName,
    recipientName: submission?.name || firstName,
  };
}

function buildListItems(items = [], templateData) {
  return items
    .map(item => `<li style="margin-bottom:8px;color:${templateData.brand.textColor};font-size:15px;line-height:1.5;">${item}</li>`)
    .join("");
}

function buildParagraphs(paragraphs = [], ctx) {
  if (!paragraphs.length) {
    return "";
  }

  return paragraphs
    .map(text => `<p style="font-size:16px;line-height:1.7;margin-bottom:16px;">${interpolate(text, ctx)}</p>`)
    .join("");
}

function buildFaqBlocks(faqs = [], ctx, templateData) {
  if (!faqs.length) {
    return "";
  }

  return faqs
    .map(faq => {
      const question = interpolate(faq.question, ctx);
      const answer = interpolate(faq.answer, ctx);
      return `
        <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;">
          <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${templateData.brand.primaryColor};font-weight:bold;">${question}</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${templateData.brand.textColor};">${answer}</p>
        </div>
      `;
    })
    .join("");
}

function formatPhoneHref(phoneNumber) {
  return phoneNumber ? phoneNumber.replace(/[^\d+]/g, "") : "";
}

function getInterpolatedArray(values = [], ctx) {
  return values.map(value => interpolate(value, ctx));
}

function buildSocialLinks(links = []) {
  if (!links.length) {
    return "";
  }

  const items = links
    .map(
      link => `
        <a href="${link.href}" style="margin:0 8px;color:#ffffff;font-size:13px;text-decoration:none;">
          ${link.label}
        </a>
      `
    )
    .join("");

  return `
    <div style="text-align:center;margin-top:16px;">
      ${items}
    </div>
  `;
}

async function buildEmailHtml(submission, slug = "quote-autoresponse") {
  const { templateData, subject: dbSubject, previewText: dbPreviewText, enabled } = await loadTemplateData(slug);
  if (!enabled) return null;

  const ctx = buildInterpolationContext(submission, templateData);
  const subject = interpolate(dbSubject || templateData.subjectTemplate, ctx);
  const previewText = dbPreviewText || templateData.previewText || "";
  const greetingPrefix = templateData.hero?.greetingPrefix || "Hello";
  const greeting = `${greetingPrefix} ${ctx.firstName},`;
  const introHtml = buildParagraphs(templateData.hero?.introParagraphs, ctx);
  const assuranceHtml = buildParagraphs(templateData.serviceAssurances, ctx);
  const proofHtml = buildParagraphs(templateData.proofPoints, ctx);
  const faqHtml = buildFaqBlocks(templateData.faqs, ctx, templateData);

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:${templateData.brand.background};color:${templateData.brand.textColor};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
      <div style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${previewText}</div>
      <div style="width:100%;background:${templateData.brand.background};padding:32px 12px;">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;">
          <tr>
            <td align="center" valign="top">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="max-width:640px;margin:0 auto;background:${templateData.brand.cardBackground};border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td
                    class="header"
                    bgcolor="${templateData.brand.primaryColor}"
                    style="background:${templateData.brand.primaryColor};padding:32px;text-align:left;color:#ffffff;"
                  >
                    ${
                      templateData.brand.logoUrl
                        ? `<img src="${templateData.brand.logoUrl}" width="320" alt="Review Cleaners" style="display:block;max-width:320px;height:auto;margin:0 0 16px 0;border:0;outline:none;text-decoration:none;" />`
                        : ""
                    }
                    <h1 style="margin:0 0 8px 0;font-size:28px;line-height:1.3;color:#ffffff;">${templateData.hero.heading}</h1>
                    <p style="margin:0;font-size:17px;line-height:1.5;color:#ffffff;">${templateData.hero.subheading}</p>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding:32px;background:${templateData.brand.cardBackground};">
                    <p style="margin-top:0;font-size:16px;line-height:1.6;">${greeting}</p>
                    ${introHtml}
                    ${templateData.hero.callout ? `<p style="font-size:16px;line-height:1.7;margin-bottom:24px;color:${templateData.brand.primaryColor};font-weight:bold;">${templateData.hero.callout}</p>` : ""}
                    <div style="margin-bottom:24px;">
                      ${templateData.hero.heading ? `<h2 style="margin:0 0 4px;font-size:20px;line-height:1.4;color:${templateData.brand.primaryColor};">${templateData.hero.heading}</h2>` : ""}
                      ${templateData.hero.subheading ? `<p style="margin:0;font-size:15px;line-height:1.6;color:${templateData.brand.textColor};">${templateData.hero.subheading}</p>` : ""}
                    </div>
                    ${assuranceHtml}
                    ${faqHtml ? `<div style="margin-bottom:24px;">${faqHtml}</div>` : ""}
                    ${proofHtml}
                    ${templateData.signature ? `<p style="font-size:16px;line-height:1.7;margin-bottom:16px;">${templateData.signature}</p>` : ""}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="font-size:15px;line-height:1.6;">
                          ${templateData.rep?.directPhone ? `<strong>Direct Line/Text:</strong> <a href="tel:${formatPhoneHref(templateData.rep.directPhone)}" style="color:${templateData.brand?.primaryColor};text-decoration:none;">${templateData.rep.directPhone}</a><br/>` : ""}
                          ${templateData.rep?.tollFreePhone ? `<strong>Toll-Free:</strong> <a href="tel:${formatPhoneHref(templateData.rep.tollFreePhone)}" style="color:${templateData.brand?.primaryColor};text-decoration:none;">${templateData.rep.tollFreePhone}</a><br/>` : ""}
                          ${templateData.rep?.email ? `<strong>Email:</strong> <a href="mailto:${templateData.rep.email}" style="color:${templateData.brand?.primaryColor};text-decoration:none;">${templateData.rep.email}</a><br/>` : ""}
                          ${templateData.rep?.hours ? `<strong>Hours:</strong> ${templateData.rep.hours}<br/>` : ""}
                        </td>
                      </tr>
                    </table>
                    ${buildSocialLinks(templateData.socialLinks)}
                  </td>
                </tr>
                <tr>
                  <td class="footer" bgcolor="${templateData.brand.primaryColor}" style="text-align:center;color:#dbe6ff;font-size:13px;padding:24px 16px;background:${templateData.brand.primaryColor};">
                    <p style="margin:0 0 12px;color:#e2e8ff;">${templateData.footer?.address || ""}</p>
                    <p style="margin:0 0 12px;line-height:1.6;color:#e2e8ff;">${templateData.footer?.disclaimer || ""}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>`;

  const textSections = [greeting];
  textSections.push(...getInterpolatedArray(templateData.hero?.introParagraphs, ctx));

  if (templateData.hero?.callout) {
    textSections.push(templateData.hero.callout);
  }

  if (templateData.hero?.heading || templateData.hero?.subheading) {
    textSections.push([templateData.hero?.heading, templateData.hero?.subheading].filter(Boolean).join(" - "));
  }

  if (templateData.services?.length) {
    textSections.push("Highlights:");
    textSections.push(...templateData.services.map(item => ` - ${item}`));
  }

  textSections.push(...getInterpolatedArray(templateData.serviceAssurances, ctx));

  if (templateData.faqs?.length) {
    templateData.faqs.forEach(faq => {
      textSections.push(faq.question);
      textSections.push(faq.answer);
    });
  }

  textSections.push(...getInterpolatedArray(templateData.proofPoints, ctx));

  if (templateData.signature) {
    textSections.push(templateData.signature);
  }

  if (templateData.rep?.directPhone) {
    textSections.push(`Direct Line/Text: ${templateData.rep.directPhone}`);
  }

  if (templateData.rep?.hours) {
    textSections.push(`Hours: ${templateData.rep.hours}`);
  }

  if (templateData.rep?.email) {
    textSections.push(`Email: ${templateData.rep.email}`);
  }

  textSections.push(templateData.footer?.disclaimer, templateData.footer?.address);

  const text = textSections.filter(Boolean).join("\n\n");

  return { subject, html, text, previewText };
}

module.exports = {
  buildSubmissionEmail: buildEmailHtml,
  loadTemplateData,
};
