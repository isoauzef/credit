import { Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageContent } from "../hooks/usePageContent";
import { useSiteSettings } from "../hooks/useSiteSettings";

interface FooterProps {
  svgPaths: any;
}

export function Footer({ svgPaths }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const settings = useSiteSettings();
  const logoSrc = settings.site_logo || "/logo.svg";

  const cms = usePageContent<{
    description?: string;
    contactEmail?: string;
    contactLocation?: string;
    copyrightText?: string;
  }>("homepage", "footer");

  const copyrightText = (cms?.copyrightText ?? "© {year} creditremovers.com. All rights reserved.").replace("{year}", String(currentYear));

  const legal = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Do Not Sell My Info", href: "/privacy-policy#california-privacy-rights" },
  ];

  return (
    <footer id="contact" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <a href="/" className="inline-flex items-center" aria-label="Credit Removers home">
              <img
                src={logoSrc}
                alt="Credit Removers"
                className="h-10 w-auto drop-shadow-sm"
                loading="lazy"
                decoding="async"
              />
            </a>
            <p className="text-white/80 text-base lg:text-lg leading-relaxed">
              {cms?.description ?? "Professional online reputation management and review removal services. We help businesses protect their brand image."}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-white/60 flex-shrink-0 mt-1" />
                <a href={`mailto:${cms?.contactEmail ?? "support@creditremovers.com"}`} className="text-white/80 hover:text-white transition-colors text-base lg:text-lg">
                  {cms?.contactEmail ?? "support@creditremovers.com"}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white/60 flex-shrink-0 mt-1" />
                <span className="text-white/80 text-base lg:text-lg">
                  {cms?.contactLocation ?? "United States"}
                </span>
              </li>
            </ul>

            {/* CTA Button */}
            <a
              href="/#hero-contact"
              className="mt-6 inline-flex w-full items-center justify-center bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-6 py-3 rounded-full text-base lg:text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/70 text-sm lg:text-base text-center md:text-left">
              {copyrightText}
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              {legal.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="text-white/70 hover:text-white text-sm lg:text-base transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
