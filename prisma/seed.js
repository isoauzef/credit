const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── 1. Migrate existing contact submissions ───────────────────
  const submissionsPath = path.join(__dirname, "..", "server", "data", "contact-submissions.json");
  if (fs.existsSync(submissionsPath)) {
    const raw = JSON.parse(fs.readFileSync(submissionsPath, "utf8"));
    const contactData = raw
      .filter((s) => !s.stripeSessionId) // only non-checkout submissions
      .map((s) => {
        const m = s.metadata || {};
        return {
          name: s.name || "",
          firstName: m.firstName || null,
          lastName: m.lastName || null,
          email: s.email || "",
          phone: s.phone || null,
          companyName: m.companyName || null,
          companyAddress: m.companyAddress || null,
          businessLocations: m.businessLocations || null,
          platform: m.platform || null,
          negativeReviewsNeedRemoving: m.negativeReviewsNeedRemoving || m.negativeReviewsToRemove || null,
          budgetPerRemoval: m.budgetPerRemoval || null,
          source: s.source || null,
          metadata: s.metadata || undefined,
          createdAt: s.submittedAt ? new Date(s.submittedAt) : new Date(),
        };
      });

    for (const c of contactData) {
      await prisma.contactSubmission.create({ data: c });
    }
    console.log(`  ✓ Imported ${contactData.length} contact submissions`);

    // Checkout submissions from JSON
    const checkoutData = raw
      .filter((s) => s.stripeSessionId)
      .map((s) => ({
        name: s.name || "",
        email: s.email || "",
        companyName: s.companyName || "",
        reviewLinks: s.reviewLinks || [],
        reason: s.reason || null,
        quantity: Array.isArray(s.reviewLinks) ? s.reviewLinks.length : 1,
        amount: (Array.isArray(s.reviewLinks) ? s.reviewLinks.length : 1) * 20000,
        stripeSessionId: s.stripeSessionId || null,
        paymentStatus: "pending",
        createdAt: s.submittedAt ? new Date(s.submittedAt) : new Date(),
      }));

    for (const c of checkoutData) {
      await prisma.checkoutSubmission.create({ data: c });
    }
    console.log(`  ✓ Imported ${checkoutData.length} checkout submissions`);
  }

  // ─── 2. Seed email templates ───────────────────────────────────
  const templatePath = path.join(__dirname, "..", "server", "email", "template-data.json");
  const templateData = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  await prisma.emailTemplate.upsert({
    where: { slug: "quote-autoresponse" },
    update: {},
    create: {
      slug: "quote-autoresponse",
      name: "Quote Form Auto-Response",
      subject: templateData.subjectTemplate || "Thank you for your submission",
      previewText: templateData.previewText || "",
      content: templateData,
      enabled: true,
    },
  });

  await prisma.emailTemplate.upsert({
    where: { slug: "checkout-success" },
    update: {},
    create: {
      slug: "checkout-success",
      name: "Checkout Success Confirmation",
      subject: "Your Review Removal Request Has Been Received — {{ companyName }}",
      previewText: "We've received your payment authorization and our team is starting work on your case.",
      content: {
        brand: templateData.brand,
        hero: {
          heading: "ReviewCleaners.com",
          subheading: "Review Removal Confirmation",
          greetingPrefix: "Hello",
          introParagraphs: [
            "Thank you for trusting us with your review removal request. We've successfully received your payment authorization.",
            "Our team will begin analyzing your case within the next 24 hours. You'll receive progress updates via email."
          ],
          callout: "Important: Please do not interact with, flag, or respond to the review(s) while we are working on your case."
        },
        rep: templateData.rep,
        serviceAssurances: [
          "Your card has been authorized but will NOT be charged until the review is successfully removed.",
          "If we are unable to remove the review, the authorization hold will be released and you will not be charged."
        ],
        faqs: [
          {
            question: "What happens next?",
            answer: "Our specialists will review each link you submitted and build a removal strategy. Most removals begin within 24-48 hours and are completed within 2-3 weeks."
          }
        ],
        proofPoints: [
          "With a 98% success rate and over 1,200 reviews removed, you're in good hands. We'll keep you informed every step of the way."
        ],
        signature: templateData.signature,
        footer: templateData.footer,
        socialLinks: templateData.socialLinks
      },
      enabled: true,
    },
  });
  console.log("  ✓ Seeded 2 email templates");

  // ─── 3. Seed settings ─────────────────────────────────────────
  const settings = [
    // Stripe
    { key: "stripe_mode", value: "test", group: "stripe" },
    { key: "stripe_test_publishable_key", value: process.env.STRIPE_PUBLISHABLE_KEY || "", group: "stripe" },
    { key: "stripe_test_secret_key", value: process.env.STRIPE_SECRET_KEY || "", group: "stripe" },
    { key: "stripe_test_webhook_secret", value: process.env.STRIPE_WEBHOOK_SECRET || "", group: "stripe" },
    { key: "stripe_live_publishable_key", value: "", group: "stripe" },
    { key: "stripe_live_secret_key", value: "", group: "stripe" },
    { key: "stripe_live_webhook_secret", value: "", group: "stripe" },
    { key: "stripe_capture_method", value: "manual", group: "stripe" },
    { key: "stripe_price_per_review", value: "20000", group: "stripe" },
    { key: "stripe_price_tier2_threshold", value: "10", group: "stripe" },
    { key: "stripe_price_tier2", value: "30000", group: "stripe" },
    { key: "stripe_price_tier3_threshold", value: "20", group: "stripe" },
    { key: "stripe_price_tier3", value: "20000", group: "stripe" },
    // SMTP
    { key: "smtp_host", value: process.env.SMTP_HOST || "", group: "smtp" },
    { key: "smtp_port", value: process.env.SMTP_PORT || "465", group: "smtp" },
    { key: "smtp_secure", value: process.env.SMTP_SECURE || "true", group: "smtp" },
    { key: "smtp_user", value: process.env.SMTP_USER || "", group: "smtp" },
    { key: "smtp_pass", value: process.env.SMTP_PASS || "", group: "smtp" },
    { key: "smtp_from", value: process.env.SMTP_FROM || "", group: "smtp" },
    { key: "smtp_reply_to", value: process.env.SMTP_REPLY_TO || "", group: "smtp" },
    // Email toggles
    { key: "email_quote_enabled", value: "true", group: "email" },
    { key: "email_checkout_enabled", value: "true", group: "email" },
    // Site
    { key: "site_title_homepage", value: "Review Cleaners — Remove Negative Reviews", group: "site" },
    { key: "site_title_checkout", value: "Remove Negative Reviews — Checkout", group: "site" },
    { key: "site_title_admin", value: "Admin Dashboard", group: "site" },
    { key: "site_logo", value: "/logo.svg", group: "site" },
    { key: "site_favicon", value: "/favicon.ico", group: "site" },
    // SerpAPI
    { key: "serpapi_api_key", value: process.env.SERPAPI_KEY || "", group: "serpapi" },
    // Google Places
    { key: "google_places_api_key", value: process.env.GOOGLE_PLACES_API_KEY || "", group: "google" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ Seeded ${settings.length} settings`);

  // ─── 4. Seed page content ─────────────────────────────────────
  const pageContent = [
    // Homepage
    {
      page: "homepage",
      section: "hero",
      content: {
        badge: "Trusted by 10,000+ Businesses Since 2014",
        headingLine1: "Remove Negative Reviews",
        headingLine2: "Restore Your Reputation",
        description: "We permanently remove negative reviews from Google, Yelp, and 100+ platforms with zero upfront costs. Pay only after we remove.",
        formTitle: "Get A Free Quote",
        formSubtitle: "No obligation. 100% confidential.",
        kpiStats: [
          { value: "98%", label: "Success Rate" },
          { value: "7-14", label: "Days Average" },
          { value: "No Win", label: "No Fee" },
        ],
      },
    },
    {
      page: "homepage",
      section: "statistics",
      content: {
        stats: [
          { percentage: "98%", label: "Success Rate", description: "Reviews successfully removed" },
          { percentage: "10K+", label: "Happy Clients", description: "Businesses we've helped" },
          { percentage: "15+", label: "Years Experience", description: "In reputation management" },
        ],
      },
    },
    {
      page: "homepage",
      section: "platforms",
      content: {
        heading: "Platforms We Remove Reviews From",
        subheading: "We work with 100+ platforms to help you maintain a clean online reputation",
        platformList: ["Google", "Better Business Bureau", "Glassdoor", "Trustpilot", "RateMDs", "Yelp", "Facebook", "TripAdvisor"],
      },
    },
    {
      page: "homepage",
      section: "features",
      content: {
        heading: "Why Choose reviewcleaners.com?",
        subheading: "We're the trusted leader in review removal with a proven track record",
        features: [
          { title: "100% Legal & Compliant", description: "We use only ethical, platform-compliant methods to remove reviews that violate policies. No black-hat tactics, ever." },
          { title: "Permanent Removal", description: "Once removed, reviews are gone for good. We ensure complete deletion from all platforms and search results." },
          { title: "Fast Results", description: "Most reviews are removed within 7-14 days. We work quickly to restore your reputation and business." },
        ],
      },
    },
    {
      page: "homepage",
      section: "establishment",
      content: {
        headingLine1: "Establishing A Reputable",
        headingLine2: "Brand For Success",
        description: "In today's digital age, your online reputation can make or break your business. We help you take control of your narrative by removing false and misleading reviews from major platforms.",
        benefits: [
          "Remove false and defamatory reviews",
          "Protect your business reputation",
          "Increase customer trust and sales",
          "Comply with platform policies",
          "Get results in 7-14 days",
          "100% confidential service",
        ],
        platforms: ["Google", "BBB", "Yelp", "Glassdoor", "TrustPilot", "TripAdvisor", "Facebook", "Healthgrades", "RateMDs", "Zillow", "Angi", "HomeAdvisor", "Houzz", "Porch", "Reddit", "Quora"],
      },
    },
    {
      page: "homepage",
      section: "reviews",
      content: {
        headingLine1: "Protect Your Brand Image &",
        headingLine2: "Boost Your Reputation",
        description: "Your business reputation is one of your most valuable assets. Negative reviews can have lasting impacts on potential customers and your bottom line. Our comprehensive review removal services help businesses and individuals reclaim their reputation.",
        benefits: [
          "Increased business and revenue",
          "Improved credibility and trust",
          "Enhanced brand image",
          "Higher customer confidence",
        ],
        stats: [
          { value: "98%", label: "Success Rate" },
          { value: "7-14", label: "Days Average" },
          { value: "10K+", label: "Happy Clients" },
        ],
      },
    },
    {
      page: "homepage",
      section: "testimonials",
      content: {
        heading: "See What Our Clients Have to Say",
        subheading: "Real stories from real clients who trusted us to protect their reputation",
        testimonials: [
          { name: "Sarah Johnson", role: "Restaurant Owner", rating: 5, text: "reviewcleaners.com helped remove a false review that was costing us customers. Their team was professional, fast, and delivered results. Highly recommend!" },
          { name: "Michael Chen", role: "Medical Practice", rating: 5, text: "As a healthcare provider, our reputation is everything. They removed defamatory content quickly and discreetly. Outstanding service!" },
          { name: "Amanda Rodriguez", role: "Law Firm Partner", rating: 5, text: "We've tried other services before, but reviewcleaners.com actually delivered. Our negative reviews were removed permanently. Worth every penny." },
        ],
      },
    },
    {
      page: "homepage",
      section: "faq",
      content: {
        heading: "Frequently Asked Questions",
        subheading: "Everything you need to know about our review removal service",
        faqs: [
          { question: "How long does the review removal process take?", answer: "Most reviews are removed within 7-14 days. The timeline varies depending on the platform and specific circumstances. We work diligently to expedite the process and keep you updated every step of the way." },
          { question: "What types of reviews can be removed?", answer: "We focus on removing false, misleading, defamatory reviews, or reviews that violate platform policies. This includes fake reviews, reviews from competitors, reviews containing profanity, or reviews that violate privacy." },
          { question: "Is the removal permanent?", answer: "Yes! Once we successfully remove a review, it is gone permanently from the platform and search results. We guarantee our results and you'll never have to worry about that review again." },
          { question: "Do I have to pay upfront?", answer: "No. We operate on a no-win, no-fee basis. You only pay once the review has been successfully and permanently removed. We trust in our process and our 98% success rate." },
          { question: "Is the process legal and compliant?", answer: "Absolutely. We only use ethical, platform-compliant methods to remove reviews. We never use black-hat tactics or violate any terms of service. All our methods are 100% legal and transparent." },
          { question: "How confidential is the service?", answer: "Completely confidential. We understand the sensitive nature of reputation management. All our services are handled with the utmost discretion, and we never share client information." },
        ],
      },
    },
    {
      page: "homepage",
      section: "caseStudies",
      content: {
        title: "How ReviewCleaners Helped a Restaurant Bounce Back",
        description: [
          "A local restaurant was hit by a wave of unfair negative reviews, causing a drop in customer trust and foot traffic.",
          "ReviewCleaners stepped in, verified and removed the false reviews, and guided the owner on best practices for future reputation management.",
          "Within weeks, the restaurant saw a surge in positive feedback and regained its loyal customer base.",
        ],
        stats: [
          { text: ["Google Rating Improved", "from 2.8 to 4.5"] },
          { text: ["50% Increase in", "Monthly Inquiries"] },
        ],
      },
    },
    {
      page: "homepage",
      section: "footer",
      content: {
        description: "Professional online reputation management and review removal services. We help businesses protect their brand image.",
        contactEmail: "support@reviewcleaners.com",
        contactLocation: "United States",
        services: [
          "Google Review Removal",
          "Yelp Review Removal",
          "Facebook Review Removal",
          "BBB Complaint Removal",
          "Glassdoor Review Removal",
          "TripAdvisor Review Removal",
        ],
      },
    },
    // Checkout page
    {
      page: "checkout",
      section: "hero",
      content: {
        badge: "Professional Review Removal Service",
        headingLine1: "Remove Negative Google Reviews",
        headingLine2: "Flat Fee of $200 Per Review",
        description: "That review isn't going away on its own — every week it sits there, it's pushing real customers straight to your competitors. We handle the full legal and technical removal process.",
        ctaText: "Remove My Review — $0 Upfront",
        subtext: "⏱ Most removals begin within 24–48 hours of submission",
        kpiItems: [
          { label: "No Upfront Costs" },
          { label: "100% Legal & Compliant" },
          { label: "Success-Based Pricing" },
          { label: "Results in 3 Weeks" },
        ],
      },
    },
    {
      page: "checkout",
      section: "statsBar",
      content: {
        stats: [
          { value: "1,200+", label: "Reviews Removed" },
          { value: "100+", label: "Businesses Helped" },
          { value: "3 Wks", label: "Avg Removal Time" },
          { value: "$0", label: "If Not Removed" },
        ],
      },
    },
    {
      page: "checkout",
      section: "processSteps",
      content: {
        badge: "How It Works",
        heading: "Our Simple 3-Step Process",
        subheading: "Transparent, legally compliant, and built around one thing: getting your review removed.",
        ctaText: "Ready to get started?",
        steps: [
          { title: "Submit Your Review", desc: "Paste the link to the review(s) you want removed. We'll analyze your case and build a compliant removal strategy within 24 hours." },
          { title: "We Handle the Removal", desc: "Using platform-compliant methods and legal procedures, we work to get the review permanently removed — keeping you updated throughout." },
          { title: "Pay Only If It Works", desc: "Your card is charged $200 only after successful removal. If we can't remove it — you owe nothing." },
        ],
      },
    },
    {
      page: "checkout",
      section: "faq",
      content: {
        badge: "FAQ",
        heading: "Everything You Need to Know",
        subheading: "Answers to the most common questions before businesses submit their first removal request.",
        faqs: [
          { q: "Is this legal? Will I get in trouble with Google?", a: "Yes, our methods are 100% legal and compliant with all platform terms of service. We use proper legal channels and policy-based arguments to request removal. You will never be penalized." },
          { q: "How long does the removal process take?", a: "Most reviews are removed within 2–3 weeks. Some cases resolve faster, while complex situations may take slightly longer. We keep you updated throughout the entire process." },
          { q: "What if the review can't be removed? Do I still pay?", a: "No. You only pay the $200 fee after the review has been successfully and permanently removed. If we can't get it removed, you owe nothing." },
          { q: "Should I keep flagging the review while you're working on it?", a: "No. Please do not interact with, flag, or respond to the review while we are actively working on your case. This can interfere with the removal process." },
        ],
      },
    },
    {
      page: "checkout",
      section: "submissionForm",
      content: {
        badge: "Get Started",
        heading: "Start Your Review Removal Request",
        subheading: "Search for your business, select the reviews you want removed, and we'll get started.",
        buttonText: "Fight My Reviews Now",
        buttonSubtext: "Only pay when we win",
        disclaimer: "We only pursue removal of reviews that violate platform content policies.",
        pricePerReview: 200,
        searchTitle: "Find Your Business on Google Maps",
        searchSubtitle: "Search by business name to find and select your listing.",
        step1Label: "Find Business",
        step2Label: "Select Reviews",
        step3Label: "Checkout",
        continueText: "Continue to Checkout",
        reviewsTitle: "Negative Reviews (1-2 Stars)",
        reviewsSubtitle: "Select the reviews you want us to remove.",
        pricingInfo: "Flat fee: $200/review",
        selectAllText: "Select All",
        loadMoreText: "Load More Reviews",
        manualEntryLink: "Can't find your business? Enter details manually",
        manualEntryTitle: "Enter Business Details Manually",
        selectedReviewsLabel: "Selected Reviews",
        contactInfoLabel: "Contact Information",
        agreement1: "I agree to Review Cleaners' terms and pricing. {price} per review, paid only upon successful removal.",
        agreement2: "I understand my card will be securely saved on file. I will only be charged {price} per review upon successful removal.",
        cardTitle: "Save Card on File",
        cardSubtitle: "Your card will only be charged upon successful removal.",
        cardButtonText: "Save Card on File",
        cardSavingText: "Saving Card…",
        cardSecurityText: "Secured by Stripe. Your card is not charged today.",
        successTitle: "Card Saved Successfully!",
        successMessage: "Thank you for your submission. Our team will review your case and begin working on your review removal within 24 hours. You will only be charged upon successful removal.",
      },
    },
  ];

  for (const pc of pageContent) {
    await prisma.pageContent.upsert({
      where: { page_section: { page: pc.page, section: pc.section } },
      update: { content: pc.content },
      create: pc,
    });
  }
  console.log(`  ✓ Seeded ${pageContent.length} page content sections`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
