/**
 * Idempotent import of contact-submissions.json into the database.
 * Checks for duplicates by email + createdAt before inserting.
 *
 * Usage: node server/import-contacts.js
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "data", "contact-submissions.json");
  if (!fs.existsSync(filePath)) {
    console.log("No contact-submissions.json found — nothing to import.");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`Found ${raw.length} total records in JSON file.`);

  // ── Contact submissions (no stripeSessionId) ──
  const contacts = raw.filter((s) => !s.stripeSessionId);
  let contactInserted = 0;
  let contactSkipped = 0;

  for (const s of contacts) {
    const m = s.metadata || {};
    const createdAt = s.submittedAt ? new Date(s.submittedAt) : new Date();
    const email = s.email || "";

    // Duplicate check: same email + same second (rounded)
    const existing = await prisma.contactSubmission.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(createdAt.getTime() - 1000),
          lte: new Date(createdAt.getTime() + 1000),
        },
      },
    });

    if (existing) {
      contactSkipped++;
      continue;
    }

    await prisma.contactSubmission.create({
      data: {
        name: s.name || "",
        firstName: m.firstName || null,
        lastName: m.lastName || null,
        email,
        phone: s.phone || null,
        companyName: m.companyName || null,
        companyAddress: m.companyAddress || null,
        businessLocations: m.businessLocations || null,
        platform: m.platform || null,
        negativeReviewsNeedRemoving:
          m.negativeReviewsNeedRemoving || m.negativeReviewsToRemove || null,
        budgetPerRemoval: m.budgetPerRemoval || null,
        source: s.source || null,
        metadata: s.metadata || undefined,
        createdAt,
      },
    });
    contactInserted++;
  }

  console.log(
    `Contact submissions: ${contactInserted} inserted, ${contactSkipped} skipped (duplicates).`
  );

  // ── Checkout submissions (has stripeSessionId) ──
  const checkouts = raw.filter((s) => s.stripeSessionId);
  let checkoutInserted = 0;
  let checkoutSkipped = 0;

  for (const s of checkouts) {
    const existing = await prisma.checkoutSubmission.findFirst({
      where: { stripeSessionId: s.stripeSessionId },
    });

    if (existing) {
      checkoutSkipped++;
      continue;
    }

    const reviewLinks = s.reviewLinks || [];
    const quantity = reviewLinks.length || 1;

    await prisma.checkoutSubmission.create({
      data: {
        name: s.name || "",
        email: s.email || "",
        companyName: s.companyName || "",
        reviewLinks,
        reason: s.reason || null,
        quantity,
        amount: quantity * 40000,
        stripeSessionId: s.stripeSessionId || null,
        paymentStatus: "pending",
        createdAt: s.submittedAt ? new Date(s.submittedAt) : new Date(),
      },
    });
    checkoutInserted++;
  }

  console.log(
    `Checkout submissions: ${checkoutInserted} inserted, ${checkoutSkipped} skipped (duplicates).`
  );

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
