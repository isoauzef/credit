import { Link } from "react-router-dom";

export default function TermsOfService() {
  const lastUpdated = "3/28/2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-6 sm:px-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-600">
            reviewcleaners.com
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6">
            <Link to="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
            <Link to="/privacy-policy" className="text-slate-600 hover:text-slate-900">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </header>

  <main className="container mx-auto px-6 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
          <span className="mb-4 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-orange-700">
            Terms of Service
          </span>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Terms of Service for {" "}
            <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">
              ReviewCleaners.com
            </a>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            Welcome to <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">reviewcleaners.com</a>. These terms outline your rights and responsibilities when using <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">ReviewCleaners.com</a> and our review removal services. By accessing our website or requesting service, you agree to these terms.
          </p>
          <p className="mt-6 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section id="eligibility" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">1. Eligibility &amp; Account Security</h2>
            <p>
              You must be at least 18 years old and legally able to enter contracts. You agree to provide accurate information and keep your account credentials secure. You are responsible for all activity under your account.
            </p>
          </section>

          <section id="services" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">2. Services</h2>
            <p>
              We offer review removal services for businesses and individuals. We work to remove false, defamatory, or unfair reviews from major platforms. While our success rate is high, we cannot guarantee removal in every case due to platform-specific policies.
            </p>
            <p>
              We may decline or discontinue service if requests violate our guidelines or applicable laws.
            </p>
          </section>

          <section id="fees" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">3. Fees &amp; Payment</h2>
            <p>
              Our pricing is performance-based: you pay only after a successful review removal unless otherwise agreed in writing. Late payments may incur interest as allowed by law.
            </p>
          </section>

          <section id="acceptable-use" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">4. Acceptable Use</h2>
            <p>
              You agree not to misuse our website or services, attempt unauthorized access, or submit unlawful, fraudulent, or abusive content. We may suspend or terminate access for violations.
            </p>
          </section>

          <section id="intellectual-property" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">5. Intellectual Property</h2>
            <p>
              All content, trademarks, and service marks on reviewcleaners.com belong to us or our licensors. You may not use, copy, or distribute our materials without written permission.
            </p>
          </section>

          <section id="limitation" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">6. Limitation of Liability</h2>
            <p>
              To the fullest extent allowed by law, reviewcleaners.com and its partners are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the fees you paid for the specific service.
            </p>
          </section>

          <section id="governing-law" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">7. Governing Law &amp; Disputes</h2>
            <p>
              These terms are governed by the laws of the United States. Disputes will be resolved by binding arbitration in Delaware unless local law requires otherwise.
            </p>
          </section>

          <section id="contact" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">8. Contact</h2>
            <p>
              Questions about these terms? Email <a href="mailto:support@reviewcleaners.com" className="ml-1 text-cyan-700 hover:text-cyan-600">support@reviewcleaners.com</a>.
            </p>
          </section>
        </div>

      </main>
    </div>
  );
}
