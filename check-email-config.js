const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const et = await p.emailTemplate.findFirst({ where: { slug: "checkout-success" } });
  console.log("=== checkout-success EmailTemplate ===");
  if (et) {
    console.log("  ID:", et.id);
    console.log("  Subject:", et.subject);
    console.log("  Has content:", !!et.content);
  } else {
    console.log("  NOT FOUND — will fallback to template-data.json (quote autoresponse!)");
  }

  const s = await p.setting.findFirst({ where: { key: "email_checkout_enabled" } });
  console.log("\n=== email_checkout_enabled setting ===");
  console.log("  Value:", s ? s.value : "NOT FOUND — emails will NOT be sent");

  const subs = await p.checkoutSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, name: true, email: true, paymentStatus: true, createdAt: true }
  });
  console.log("\n=== Last 3 CheckoutSubmissions ===");
  subs.forEach(s => console.log(`  ${s.id} | ${s.name} | ${s.email} | ${s.paymentStatus} | ${s.createdAt}`));

  await p.$disconnect();
})();
