import { Link } from "react-router-dom";

export default function TermsOfService() {
  const lastUpdated = "5/29/2026";

  return (
    <div className="min-h-screen break-words bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex flex-col items-start gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <Link to="/" className="text-base font-semibold tracking-tight text-slate-900 hover:text-slate-600 sm:text-lg">
            creditremovers.com
          </Link>
          <nav className="flex w-full flex-wrap items-center gap-3 text-sm sm:w-auto sm:gap-6">
            <Link to="/" className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:text-slate-900 sm:bg-transparent sm:px-0 sm:py-0">
              Home
            </Link>
            <Link to="/privacy-policy" className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:text-slate-900 sm:bg-transparent sm:px-0 sm:py-0">
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
            <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">
              CreditRemovers.com
            </a>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            Welcome to <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">creditremovers.com</a>. These terms outline your rights and responsibilities when using <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">CreditRemovers.com</a> and our credit repair services, including the removal of inaccurate, incomplete, or unverifiable negative items from your consumer credit reports and the addition of positive payment history through programs available under the Credit Access and Inclusion Act. By accessing our website or requesting service, you agree to these terms.
          </p>
          <p className="mt-6 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section id="eligibility" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">1. Eligibility &amp; Account Security</h2>
            <p>
              You must be at least 18 years old, a U.S. resident, and legally able to enter contracts. You agree to provide accurate, complete, and current information — including your full legal name, date of birth, address, and any documents required to verify your identity or dispute items with the consumer reporting agencies (Equifax, Experian, and TransUnion). You are responsible for keeping your account credentials secure and for all activity under your account.
            </p>
          </section>

          <section id="services" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">2. Services</h2>
            <p>
              We provide credit repair services on your behalf, which may include reviewing your credit reports, identifying items that may be inaccurate, incomplete, outdated, or unverifiable, and submitting disputes and goodwill requests to the three major credit bureaus and the original creditors or furnishers. Where applicable, we also help report positive on-time bill payments (such as rent, utility, telecom, and insurance payments) to the credit bureaus under the Credit Access and Inclusion Act to help build positive credit history.
            </p>
            <p>
              While our success rate is high and we work diligently on every case, we cannot guarantee that any specific item will be removed or that your credit score will increase by a specific amount. Results depend on the accuracy of each item, the response of the bureaus and furnishers, and your individual credit profile.
            </p>
            <p>
              <strong>Your rights under the Credit Repair Organizations Act (CROA).</strong> You have the right to dispute inaccurate information in your credit report yourself, without paying any fee, by contacting the credit bureaus directly. You have the right to cancel your contract with us, without penalty or obligation, within three (3) business days from the date the contract is signed. You will receive a separate written contract and a "Consumer Credit File Rights Under State and Federal Law" notice before we begin work on your file.
            </p>
            <p>
              We may decline or discontinue service if requests are unlawful, fraudulent, abusive, or otherwise violate our guidelines or applicable laws.
            </p>
          </section>

          <section id="fees" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">3. Fees &amp; Payment</h2>
            <p>
              In accordance with CROA and applicable state credit-services laws, we do not charge for credit repair services until those services have been performed. Fees, payment schedules, and refund terms are described in your separate written service agreement.
            </p>
            <p>
              We may offer money-back guarantees on specific outcomes (for example, no negative items removed within a stated time frame). The terms of any guarantee will be set out in your service agreement and govern in case of conflict with this page. Late payments may incur interest as allowed by law.
            </p>
          </section>

          <section id="acceptable-use" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">4. Acceptable Use &amp; Accurate Information</h2>
            <p>
              You agree not to misuse our website or services, attempt unauthorized access, or submit unlawful, fraudulent, or abusive content. You specifically agree not to ask us to dispute information you know to be accurate and verifiable, to create a new credit identity using an Employer Identification Number, Credit Privacy Number, or any other false identification, or to take any action that violates federal or state law. We may suspend or terminate access for violations.
            </p>
          </section>

          <section id="intellectual-property" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">5. Intellectual Property</h2>
            <p>
              All content, trademarks, logos, and service marks on creditremovers.com belong to us or our licensors. You may not use, copy, reproduce, or distribute our materials without our prior written permission.
            </p>
          </section>

          <section id="no-legal-advice" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">6. No Legal, Financial, or Tax Advice</h2>
            <p>
              We are not a law firm, financial advisor, or tax advisor, and nothing on our website or in our services constitutes legal, financial, or tax advice. If you need legal advice — for example, about bankruptcy, identity theft, or debt collection lawsuits — you should consult a licensed attorney in your state.
            </p>
          </section>

          <section id="limitation" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">7. Limitation of Liability</h2>
            <p>
              To the fullest extent allowed by law, creditremovers.com and its partners are not liable for indirect, incidental, special, or consequential damages, including lost profits, lost credit opportunities, or interest rate differences. Our total liability for any claim relating to our services is limited to the fees you actually paid us for the specific service giving rise to the claim.
            </p>
          </section>

          <section id="governing-law" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">8. Governing Law &amp; Disputes</h2>
            <p>
              These terms are governed by the laws of the United States and, where applicable, the State of Delaware, without regard to conflict-of-laws principles. Disputes will be resolved by binding arbitration in Delaware on an individual basis (no class actions), unless local law where you reside requires otherwise. Nothing in these terms waives any non-waivable rights you have under federal or state consumer protection laws, including CROA and state credit-services statutes.
            </p>
          </section>

          <section id="privacy-and-california-rights" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">9. Privacy &amp; California Rights</h2>
            <p>
              Your use of this website is also governed by our{" "}
              <Link to="/privacy-policy" className="text-cyan-700 hover:text-cyan-600">
                Privacy Policy
              </Link>
              , including the{" "}
              <Link to="/privacy-policy#california-privacy-rights" className="text-cyan-700 hover:text-cyan-600">
                California privacy and Do Not Sell My Info notice
              </Link>
              . By submitting a form, you agree that we may process your information as described there.
            </p>
          </section>

          <section id="contact" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">10. Contact</h2>
            <p>
              Questions about these terms? Email <a href="mailto:support@creditremovers.com" className="ml-1 text-cyan-700 hover:text-cyan-600">support@creditremovers.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
