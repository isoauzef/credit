const path = require("path");
const fs = require("fs/promises");
const { createCanvas, DOMMatrix, Path2D } = require("@napi-rs/canvas");

if (!globalThis.DOMMatrix) globalThis.DOMMatrix = DOMMatrix;
if (!globalThis.Path2D) globalThis.Path2D = Path2D;

const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const { createWorker } = require("tesseract.js");
const englishData = require("@tesseract.js-data/eng");
const TESSERACT_CACHE_DIR = path.join(__dirname, "..", "..", "private-uploads", ".tesseract-cache");

class CanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Some credit-report PDFs use PDF shading patterns that node canvas
    // implementations do not accept as pattern sources. The text content is
    // still renderable, so fall back to a harmless transparent pattern.
    const originalCreatePattern = context.createPattern.bind(context);
    const fallbackCanvas = createCanvas(1, 1);
    const fallbackPattern = originalCreatePattern(fallbackCanvas, "repeat");
    context.createPattern = (image, repetition) => {
      try {
        return originalCreatePattern(image, repetition);
      } catch (_) {
        return fallbackPattern;
      }
    };

    return { canvas, context };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseLooseInteger(value) {
  const normalized = String(value || "")
    .replace(/\[\]/g, "0")
    .replace(/[IlT]/g, "1")
    .replace(/[Oo°]/g, "0")
    .replace(/[^\d-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMoney(value) {
  const parsed = parseLooseInteger(value);
  return parsed == null ? null : parsed;
}

function regexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchInt(text, label) {
  const match = text.match(new RegExp(`${regexEscape(label)}\\s+([\\dOo°Il\\[\\]]+)`, "i"));
  return match ? parseLooseInteger(match[1]) : null;
}

function matchMoney(text, label) {
  const match = text.match(new RegExp(`${regexEscape(label)}\\s*\\$?\\s*([\\d,Oo°]+)`, "i"));
  return match ? parseMoney(match[1]) : null;
}

function matchAge(text, label) {
  const match = text.match(new RegExp(`${regexEscape(label)}\\s+([\\dIlT]+)\\s*yrs?\\s+([\\dIlT]+)\\s*mo?s?`, "i"));
  if (!match) return null;
  const years = parseLooseInteger(match[1]);
  const months = parseLooseInteger(match[2]);
  if (years == null || months == null) return null;
  return `${years} yrs ${months} mos`;
}

function parseReportDate(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/,\s*/g, ", ").replace(/\s+/g, " ").trim();
  const parsed = new Date(`${cleaned} UTC`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function matchDate(text, pattern) {
  const match = text.match(pattern);
  return match ? parseReportDate(match[1]) : null;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "")
  );
}

function cropScore(rendered) {
  const { canvas } = rendered;
  const width = canvas.width;
  const height = canvas.height;
  const source = {
    x: Math.round(width * 0.315),
    y: Math.round(height * 0.218),
    width: Math.round(width * 0.145),
    height: Math.round(height * 0.07),
  };

  const target = createCanvas(420, 170);
  const ctx = target.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(canvas, source.x, source.y, source.width, source.height, 0, 0, target.width, target.height);
  return target.toBuffer("image/png");
}

async function renderFirstPage(pdfPath) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    disableFontFace: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.8 });
  const canvasFactory = new CanvasFactory();
  const rendered = canvasFactory.create(viewport.width, viewport.height);

  await page.render({
    canvasContext: rendered.context,
    viewport,
    canvasFactory,
  }).promise;

  return rendered;
}

function parseCreditReportText(fullText, scoreText) {
  const text = cleanText(fullText);
  const flat = text.replace(/\n/g, " ");
  const scoreDigits = String(scoreText || "").replace(/[^\d]/g, "");
  const score = scoreDigits.length >= 3 ? Number.parseInt(scoreDigits.slice(0, 3), 10) : null;

  const dateGenerated = matchDate(flat, /Date generated:\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
  const scoreDate = matchDate(flat, /\b(?:Equifax|Experian|TransUnion)\s+data\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})/i) || dateGenerated;

  const accountSummary = compactObject({
    openAccounts: matchInt(flat, "Open accounts"),
    selfReportedAccounts: matchInt(flat, "Self-reported accounts"),
    accountsEverLate: matchInt(flat, "Accounts ever late"),
    closedAccounts: matchInt(flat, "Closed accounts"),
    collections: matchInt(flat, "Collections"),
    averageAccountAge: matchAge(flat, "Average"),
    oldestAccount: matchAge(flat, "Oldest account"),
  });

  const creditUsage = compactObject({
    creditUsed: matchMoney(flat, "Credit used:"),
    creditLimit: matchMoney(flat, "Credit limit:"),
  });

  const percentMatch = flat.match(/(\d{1,3})\s*%/);
  if (percentMatch) creditUsage.usagePercent = parseLooseInteger(percentMatch[1]);

  const debtSummary = compactObject({
    creditCardDebt: matchMoney(flat, "Credit card and credit line"),
    selfReportedBalance: matchMoney(flat, "Self-reported account balance"),
    loanDebt: matchMoney(flat, "Loan debt"),
    collectionsDebt: matchMoney(flat, "Collections debt"),
    totalDebt: matchMoney(flat, "Total debt"),
  });

  return {
    score: score && score >= 300 && score <= 850 ? score : null,
    scoreDate,
    dateGenerated,
    accountSummary,
    creditUsage,
    debtSummary,
  };
}

async function parseCreditReportPdf(pdfPath) {
  const rendered = await renderFirstPage(pdfPath);
  const pageBuffer = rendered.canvas.toBuffer("image/png");
  const scoreBuffer = cropScore(rendered);
  await fs.mkdir(TESSERACT_CACHE_DIR, { recursive: true });
  const worker = await createWorker("eng", 1, {
    langPath: englishData.langPath,
    cachePath: TESSERACT_CACHE_DIR,
    gzip: englishData.gzip,
  });

  try {
    const fullResult = await worker.recognize(pageBuffer);
    const scoreResult = await worker.recognize(scoreBuffer);
    return {
      ...parseCreditReportText(fullResult.data.text, scoreResult.data.text),
      rawTextLength: fullResult.data.text.length,
    };
  } finally {
    await worker.terminate();
  }
}

module.exports = {
  parseCreditReportPdf,
  parseCreditReportText,
};
