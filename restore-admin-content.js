/**
 * Restore admin-edited checkout page content that was overwritten by seed.
 * Recovered from MySQL binary logs (binlog.000002).
 * 
 * Run on server:  node restore-admin-content.js
 */
const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

const restored = [
  {
    page: "checkout",
    section: "hero",
    content: {
      badge: "Professional Review Removal Service",
      ctaText: "Get Started",
      subtext: "⏱ Most reviews are removed within 24–48 hours of submission",
      kpiItems: [
        { label: "No Upfront Costs" },
        { label: "100% Legal & Compliant" },
        { label: "No Win, No Fee" },
        { label: "Results in 3 Days" },
      ],
      description:
        "Permanently remove negative reviews from Google with zero upfront costs. Pay only after we legally remove the review.",
      headingLine1: "Remove Negative Google Reviews",
      headingLine2: "for Only $400 a Review",
    },
  },
  {
    page: "checkout",
    section: "statsBar",
    content: {
      stats: [
        { label: "Reviews Removed", value: "12,000+" },
        { label: "Businesses Helped", value: "1000+" },
        { label: "Avg Removal Time", value: "3 Days" },
        { label: "If Not Removed", value: "$0" },
      ],
    },
  },
  {
    page: "checkout",
    section: "processSteps",
    content: {
      badge: "How It Works",
      steps: [
        {
          title: "Find Your Business",
          desc: "Search for your business by name — we'll pull up your Google listing and all it's 1 - 2 star reviews so you can select the ones you want removed.",
        },
        {
          title: "We Handle the Removal",
          desc: "Using platform-compliant methods and legal procedures, we work to get the review permanently removed — keeping you updated throughout.",
        },
        {
          title: "Pay Only If It Works",
          desc: "Your card is charged $400 only after successful removal. If we can't remove it — you owe nothing.",
        },
      ],
      ctaText: "Ready to get started?",
      heading: "Our Simple 3-Step Process",
      subheading: "Transparent, legally compliant, and fast.",
    },
  },
  {
    page: "checkout",
    section: "faq",
    content: {
      badge: "FAQ",
      heading: "Everything You Need to Know",
      subheading: "Answers to the most common questions.",
      faqs: [
        {
          q: "Is this legal? Will I get in trouble with Google?",
          a: "Our methods are 100% legal and compliant with all platform terms of service. We use proper legal channels and policy-based arguments to request removal. You will never be penalized.",
        },
        {
          q: "How long does the removal process take?",
          a: "Most reviews are removed within 3–7 days. Some cases may take slightly longer. We keep you updated throughout the entire process.",
        },
        {
          q: "What if the review can't be removed? Do I still pay?",
          a: "You only pay the $400 fee after the review has been successfully and permanently removed. If we can't get it removed, you owe nothing.",
        },
        {
          q: "Should I keep flagging the review while you're working on it?",
          a: "Please do not interact with, flag, or respond to the review while we are actively working on your case. This can interfere with the removal process.",
        },
      ],
    },
  },
  {
    page: "checkout",
    section: "submissionForm",
    content: {
      badge: "Get Started",
      heading: "Start Your Review Removal Request",
      subheading:
        "Search for your business, select the reviews you want removed, and we'll get started.",
      searchTitle: "Find Your Business on Google Maps",
      searchSubtitle:
        "Search by business name to find and select your listing.",
      buttonText: "Remove Reviews Now",
      buttonSubtext: "Only pay when we win",
      disclaimer:
        "We only pursue removal of reviews that violate platform content policies.",
      pricePerReview: 400,
      step1Label: "Find Business",
      step2Label: "Select Reviews",
      step3Label: "Checkout",
      continueText: "Continue to Checkout",
      reviewsTitle: "Negative Reviews (1-2 Stars)",
      reviewsSubtitle: "Select the reviews you want us to remove.",
      selectAllText: "Select All",
      loadMoreText: "Load More Reviews",
      manualEntryLink: "Can't find your business? Enter details manually",
      manualEntryTitle: "Enter Business Details Manually",
      selectedReviewsLabel: "Selected Reviews",
      contactInfoLabel: "Contact Information",
      agreement1:
        "I agree to Review Cleaners' terms and pricing. {price} per review, paid only upon successful removal.",
      agreement2:
        "I understand I will be adding my card to be held for 7 days and charged only after review(s) are successfully removed.",
      cardTitle: "Save Card Now",
      cardSubtitle: "Your card will only be charged upon successful removal.",
      cardButtonText: "Save Card Now",
      cardSavingText: "Saving Card…",
      cardSecurityText: "Secured by Stripe. Your card is not charged today.",
      successTitle: "Card Saved Successfully!",
      successMessage:
        "Thank you for your submission. Our team will review your case and begin working on your review removal within 24 hours. You will only be charged upon successful removal.",
    },
  },
];

async function main() {
  for (const item of restored) {
    await prisma.pageContent.upsert({
      where: { page_section: { page: item.page, section: item.section } },
      update: { content: item.content },
      create: item,
    });
    console.log(`  ✓ Restored ${item.page}/${item.section}`);
  }
  console.log("\n✅ All checkout admin content restored!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
