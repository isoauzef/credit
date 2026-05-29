import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  const lastUpdated = "5/29/2026";

  return (
    <div className="min-h-screen break-words bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-6 sm:px-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-600">
            creditremovers.com
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6">
            <Link to="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
            <Link to="/terms-of-service" className="text-slate-600 hover:text-slate-900">
              Terms of Service
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
          <span className="mb-4 inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-xs font-medium uppercase tracking-wide text-cyan-700">
            Privacy Policy
          </span>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Your Privacy at {" "}
            <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">
              CreditRemovers.com
            </a>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            At <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">creditremovers.com</a>, we help individuals and businesses repair their credit by disputing inaccurate, incomplete, or unverifiable items on their consumer credit reports and by adding positive payment history through programs available under the Credit Access and Inclusion Act. Because credit repair involves sensitive financial information, we treat the protection of your personal data as a core part of our service.
            <br /><br />
            This policy explains how we collect, use, share, and safeguard your data when you use <a href="https://creditremovers.com/" className="text-cyan-700 hover:text-cyan-600">CreditRemovers.com</a>.
          </p>
          <p className="mt-6 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section id="information-we-collect" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
            <p>When you request our credit repair services, we may collect:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>Identity information: your full legal name, date of birth, current and previous addresses, and the last four digits of your Social Security Number where required to authenticate you with the credit bureaus</li>
              <li>Contact details: email address and phone number</li>
              <li>Credit information: copies of your Equifax, Experian, and TransUnion credit reports, individual tradeline details, account numbers (typically masked), balances, and dispute history</li>
              <li>Payment information: billing details processed through our payment processor (we do not store full card numbers on our servers)</li>
              <li>Supporting documents you provide (for example, government-issued ID, proof of address, utility or rent payment receipts used for positive-payment reporting)</li>
              <li>Communications you send us through forms, chat, or email</li>
              <li>Basic usage analytics (pages viewed, device type, IP address) to operate and improve the site</li>
            </ul>
          </section>

          <section id="how-we-use-data" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">2. How We Use Your Data</h2>
            <p>We use your information only to:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>Authenticate you with the consumer reporting agencies and creditors</li>
              <li>Prepare, send, and track credit dispute letters, goodwill requests, and method-of-verification requests on your behalf</li>
              <li>Submit and verify positive payment history (such as rent, utility, telecom, and insurance payments) to the credit bureaus under the Credit Access and Inclusion Act</li>
              <li>Communicate with you about your case, results, and our services</li>
              <li>Process payments and prevent fraud</li>
              <li>Comply with legal obligations (including CROA, FCRA, GLBA, and applicable state credit-services laws)</li>
              <li>Improve our website and service experience</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal data and we do <strong>not</strong> share it for cross-context behavioral advertising. We share information only with: (a) the credit bureaus, creditors, furnishers, and collection agencies needed to perform your disputes; (b) trusted service providers (hosting, payment processing, email, analytics) under written agreements that restrict their use of the data to performing services for us; and (c) authorities when required by law or to protect rights and safety.
            </p>
          </section>

          <section id="data-security" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">3. Data Security</h2>
            <p>
              We use industry-standard security measures — including TLS encryption in transit, encryption at rest for sensitive fields, role-based access controls, and continuous monitoring — to protect your information, consistent with our obligations under the Gramm-Leach-Bliley Act (GLBA) Safeguards Rule. While we work hard to keep your data safe, no system is 100% secure. Please use a strong, unique password and contact us immediately if you notice suspicious activity on your account.
            </p>
          </section>

          <section id="retention" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">4. Data Retention &amp; Your Rights</h2>
            <p>
              We keep your information only as long as needed to provide our services, meet legal and regulatory obligations (CROA and state credit-services laws typically require records to be retained for a set period after the engagement ends), and resolve disputes. Depending on where you live, you may have the right to access, correct, delete, or port your personal data, to restrict or object to certain processing, and to opt out of certain disclosures. You can exercise these rights at any time by contacting us at the address below.
            </p>
            <p>
              You can also request a free copy of your credit report directly from each bureau once every twelve months at AnnualCreditReport.com — this is your right under federal law and does not require our services.
            </p>
          </section>

          <section id="third-party" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">5. Third-Party Links &amp; Cookies</h2>
            <p>
              Our website may link to external sites such as credit bureaus or government resources. We are not responsible for their privacy practices, so please review their policies. We use cookies and similar tracking technologies to operate the site, remember your preferences, understand visitor behavior, and improve your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section id="children" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">6. Children's Privacy</h2>
            <p>
              Our services are intended for adults aged 18 and older. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section id="california-privacy-rights" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">10.0. Your California Privacy Rights</h2>
            <p>California residents may also take advantage of the following rights:</p>
            <p>
              You may request, up to two times each year, that we disclose to you the categories and specific pieces of personal information that we have collected about you, the categories of sources from which your personal information is collected, the business or commercial purpose for collecting your personal information, the categories of personal information that we disclosed for a business purpose, any categories of personal information that we sold or shared about you, the categories of third parties with whom we have shared your personal information, and the business or commercial purpose for selling or sharing your personal information, if applicable.
            </p>
            <p>
              You may request that we delete any personal information that we have collected from or about you. Note that there are some reasons we will not be able to fully address your request, such as if we need to complete a transaction for you, detect and protect against fraudulent or illegal activity, exercise our rights, or comply with a legal obligation.
            </p>
            <p>
              You may request to opt out of our sale or sharing of your personal information to third parties. This means that, if you opt out, going forward, we will not share your information with such third parties to use for their own commercial purposes unless you later direct us to do so.
            </p>
            <p>
              For verification purposes, please send an email to{" "}
              <a href="mailto:support@creditremovers.com" className="text-cyan-700 hover:text-cyan-600">
                support@creditremovers.com
              </a>{" "}
              with the subject line "CCPA Opt Out". In that email, please provide your name, address, telephone number, and email address. Further information may be required for verification. Additionally, please let us know whether this request is for yourself or on behalf of another person. We value your privacy and will not discriminate in response to your exercise of your privacy rights. We will respond to your access and deletion requests within 45 days of receipt of your request, after proper verification, unless we need additional time, in which case we will let you know. We will respond to your opt-out requests as soon as reasonably possible.
            </p>
            <p>
              For purposes of compliance with the California Consumer Privacy Act, in addition to the further details described throughout this Privacy Policy, we make the following disclosures:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>We collect the following categories of personal information: identifiers/contact information, commercial information, internet or other electronic network activity information, geolocation, visual and audio information, and profiles and inferences drawn from the above.</li>
              <li>We disclose the following categories of personal information for a business or commercial purpose: identifiers/contact information, commercial information, internet or other electronic network activity information, geolocation, visual and audio information, and profiles and inferences drawn from the above.</li>
              <li>We may disclose the following categories of personal information to third parties for marketing purposes: identifiers/contact information, commercial information, internet or other electronic network activity information, geolocation, visual and audio information, and profiles and inferences drawn from the above, which may be considered a "sale" or "sharing" of information under the California Consumer Privacy Act.</li>
            </ul>
          </section>

          <section id="contact" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">11. Contact Us</h2>
            <p>
              Have questions about this policy or want to exercise your privacy rights? Contact our team at <a href="mailto:support@creditremovers.com" className="text-cyan-700 hover:text-cyan-600">support@creditremovers.com</a>. We respond within two business days.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
