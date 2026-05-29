const express = require("express");
const prisma = require("../db");
const { hashApiKey, serializeVendorLead } = require("../helpers/vendorLeadApi");

const router = express.Router();

function getApiKey(req) {
  const bearer = req.header("Authorization");
  if (bearer && bearer.startsWith("Bearer ")) return bearer.slice(7).trim();
  return (req.header("X-API-Key") || "").trim();
}

async function requireVendor(req, res, next) {
  const apiKey = getApiKey(req);
  if (!apiKey) return res.status(401).json({ message: "Missing API key." });

  try {
    const vendor = await prisma.apiVendor.findUnique({
      where: { keyHash: hashApiKey(apiKey) },
    });
    if (!vendor || !vendor.active) {
      return res.status(401).json({ message: "Invalid or inactive API key." });
    }
    req.vendor = vendor;
    next();
  } catch (err) {
    console.error("[vendor-api] auth failed", err);
    return res.status(500).json({ message: "Authentication failed." });
  }
}

router.get("/leads", requireVendor, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const deliveredAt = new Date();

  try {
    const leads = await prisma.$transaction(async (tx) => {
      const rows = await tx.contactSubmission.findMany({
        where: {
          assignedVendorId: req.vendor.id,
          vendorDeliveredAt: null,
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });

      if (rows.length) {
        await tx.contactSubmission.updateMany({
          where: {
            id: { in: rows.map((row) => row.id) },
            assignedVendorId: req.vendor.id,
            vendorDeliveredAt: null,
          },
          data: { vendorDeliveredAt: deliveredAt },
        });
      }

      await tx.apiVendor.update({
        where: { id: req.vendor.id },
        data: { lastUsedAt: deliveredAt },
      });

      return rows;
    });

    return res.json({
      vendor: {
        id: req.vendor.id,
        name: req.vendor.name,
      },
      count: leads.length,
      data: leads.map(serializeVendorLead),
    });
  } catch (err) {
    console.error("[vendor-api] failed to deliver leads", err);
    return res.status(500).json({ message: "Failed to load leads." });
  }
});

module.exports = router;
