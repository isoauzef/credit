import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
            <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">
              ReviewCleaners.com
            </a>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            At <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">reviewcleaners.com</a>, we help businesses and individuals address harmful reviews across major platforms. We understand the importance of privacy and are committed to protecting your personal information throughout the process.
            <br /><br />
            This policy explains how we collect, use, and safeguard your data when you use <a href="https://reviewcleaners.com/" className="text-cyan-700 hover:text-cyan-600">ReviewCleaners.com</a>.
          </p>
          <p className="mt-6 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-700 sm:text-base">
          <section id="information-we-collect" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
            <p>
              When you request our review removal services, we may collect:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>Your name, email address, and contact number</li>
              <li>Business or personal details relevant to your review removal case</li>
              <li>Links, screenshots, or details of the reviews you want removed</li>
              <li>Any communications you send us via forms, chat, or email</li>
              <li>Basic usage analytics to improve our service</li>
            </ul>
          </section>

          <section id="how-we-use-data" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">2. How We Use Your Data</h2>
            <p>
              We use your information only to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>Process and fulfill your review removal requests</li>
              <li>Communicate with you about your case and our services</li>
              <li>Improve our website and service experience</li>
              <li>Comply with legal and platform requirements</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal data to third parties. If we work with trusted partners (such as hosting or analytics providers), they only access data needed to perform their tasks and are bound by confidentiality agreements.
            </p>
          </section>

          <section id="data-security" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">3. Data Security</h2>
            <p>
              We use industry-standard security measures (encryption, access controls, monitoring) to protect your information. While we work hard to keep your data safe, no system is 100% secure—please use strong passwords and contact us immediately if you notice suspicious activity.
            </p>
          </section>

          <section id="retention" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">4. Data Retention &amp; Your Rights</h2>
            <p>
              We keep your information only as long as needed to provide our services, meet legal obligations, or resolve disputes. You can request access, correction, or deletion of your personal data at any time by contacting us.
            </p>
          </section>

          <section id="third-party" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">5. Third-Party Links &amp; Cookies</h2>
            <p>
              Our website may link to external sites. We are not responsible for their privacy practices, so please review their policies. We use cookies and tracking technologies to understand visitor behavior and improve your experience.
            </p>
          </section>

          <section id="contact" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">6. Contact Us</h2>
            <p>
              Have questions about this policy or want to exercise your privacy rights? Contact our team at <a href="mailto:support@reviewcleaners.com" className="text-cyan-700 hover:text-cyan-600">support@reviewcleaners.com</a>.
              We respond within two business days.
            </p>
          </section>
        </div>

      </main>
    </div>
  );
}
