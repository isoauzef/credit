/**
 * Secure uploads for credit-repair checkout.
 *
 *  - Files are stored OUTSIDE the public/ directory in <projectRoot>/private-uploads/
 *  - They are NEVER served via Express static. Admin-only download endpoint
 *    streams the bytes after JWT verification.
 *  - POST /api/secure-uploads is public (used by the public checkout form)
 *    but heavily restricted: 10MB max, jpg/png/pdf only, magic-byte sniffing,
 *    rate-limited by IP via the express-level limiter when present.
 *  - The customer receives an opaque token (random UUID-based filename). The
 *    backend stores that token in the CheckoutSubmission row. There is no way
 *    to fetch the file without a valid admin JWT.
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";

const PRIVATE_DIR = path.join(__dirname, "..", "..", "private-uploads");
if (!fs.existsSync(PRIVATE_DIR)) fs.mkdirSync(PRIVATE_DIR, { recursive: true });

const ALLOWED_EXT = /\.(jpe?g|png|pdf)$/i;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

// Simple in-memory IP rate limit to mitigate abuse (5 uploads / 10 min / IP)
const rateBucket = new Map();
function rateLimit(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .toString().split(",")[0].trim() || "unknown";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const entry = rateBucket.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count += 1;
  rateBucket.set(ip, entry);
  if (entry.count > 8) {
    return res.status(429).json({ message: "Too many uploads, please wait." });
  }
  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRIVATE_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_EXT.test(file.originalname)) {
      return cb(new Error("Only JPG, PNG or PDF files are allowed"));
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

// Magic-byte sniff to guard against MIME spoofing.
function verifyMagic(filePath, mime) {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(8);
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === "image/png")
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (mime === "application/pdf")
    return buf.slice(0, 4).toString("ascii") === "%PDF";
  return false;
}

// ── Public upload endpoint ─────────────────────────────────────────
router.post("/", rateLimit, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(code).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Magic-byte check
    const ok = verifyMagic(req.file.path, req.file.mimetype);
    if (!ok) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: "File content does not match its declared type." });
    }

    res.json({
      token: req.file.filename,                 // opaque ID
      mimeType: req.file.mimetype,
      originalName: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120),
      size: req.file.size,
    });
  });
});

// ── Admin-only download endpoint ───────────────────────────────────
function requireAdmin(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    req.adminUser = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

router.get("/:token", requireAdmin, (req, res) => {
  const token = String(req.params.token || "");
  // Defence-in-depth: token must be UUID + ext only
  if (!/^[0-9a-f-]{36}\.(jpe?g|png|pdf)$/i.test(token)) {
    return res.status(400).json({ message: "Invalid token" });
  }
  const full = path.join(PRIVATE_DIR, token);
  // Ensure the resolved path stays within PRIVATE_DIR (prevent traversal)
  if (!full.startsWith(PRIVATE_DIR + path.sep) && full !== PRIVATE_DIR) {
    return res.status(400).json({ message: "Invalid path" });
  }
  if (!fs.existsSync(full)) return res.status(404).json({ message: "Not found" });

  const ext = path.extname(full).toLowerCase();
  const mime =
    ext === ".pdf" ? "application/pdf" :
    ext === ".png" ? "image/png" :
    "image/jpeg";
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Disposition", `inline; filename="${token}"`);
  fs.createReadStream(full).pipe(res);
});

module.exports = router;
