const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const {
  attachDashboardDocument,
  getClientDashboardSnapshot,
} = require("../helpers/clientDashboard");

const router = express.Router();
const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET || "fallback_secret_change_me";

function signClientToken(account) {
  return jwt.sign(
    { accountId: account.id, email: account.email, type: "client" },
    CLIENT_JWT_SECRET,
    { expiresIn: "14d" }
  );
}

function requireClient(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), CLIENT_JWT_SECRET);
    if (decoded.type !== "client" || !decoded.accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.clientAccount = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const account = await prisma.clientDashboardAccount.findFirst({
      where: { email, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!account) return res.status(401).json({ message: "Invalid credentials." });

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    await prisma.clientDashboardAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    return res.json({
      token: signClientToken(account),
      email: account.email,
    });
  } catch (err) {
    console.error("[client-dashboard] login failed", err);
    return res.status(500).json({ message: "Login failed." });
  }
});

router.get("/dashboard", requireClient, async (req, res) => {
  try {
    const snapshot = await getClientDashboardSnapshot(req.clientAccount.accountId);
    if (!snapshot) return res.status(404).json({ message: "Dashboard not found." });
    return res.json(snapshot);
  } catch (err) {
    console.error("[client-dashboard] dashboard load failed", err);
    return res.status(500).json({ message: "Could not load dashboard." });
  }
});

router.post("/documents", requireClient, async (req, res) => {
  try {
    await attachDashboardDocument(req.clientAccount.accountId, req.body, "client");
    const snapshot = await getClientDashboardSnapshot(req.clientAccount.accountId);
    return res.status(201).json(snapshot);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("[client-dashboard] document attach failed", err);
    return res.status(status).json({ message: err.message || "Could not save document." });
  }
});

module.exports = router;
