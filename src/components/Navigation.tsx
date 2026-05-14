import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";

export function Navigation({ minimal = false }: { minimal?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const settings = useSiteSettings();
  const logoSrc = settings.site_logo || "/logo.svg";

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Wordmark */}
          <a href="/" className="flex-shrink-0 inline-flex items-center" aria-label="Credit Removers home">
            <img
              src={logoSrc}
              alt="Credit Removers"
              className="h-10 w-auto drop-shadow-sm"
              loading="lazy"
              decoding="async"
            />
          </a>

          {minimal ? null : (
          <>
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#services" className="text-white hover:text-cyan-200 transition-colors">
              Services
            </a>
            <a href="#how-it-works" className="text-white hover:text-cyan-200 transition-colors">
              How It Works
            </a>
            <a href="#case-studies" className="text-white hover:text-cyan-200 transition-colors">
              Case Studies
            </a>
            <a href="#testimonials" className="text-white hover:text-cyan-200 transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-white hover:text-cyan-200 transition-colors">
              FAQ
            </a>
            <a
              href="/checkout"
              className="text-white px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-white hover:text-cyan-200 hover:bg-white/10"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {!minimal && isMenuOpen && (
        <div className="lg:hidden bg-slate-800/95 backdrop-blur-md">
          <div className="px-4 py-6 space-y-4">
            <a
              href="#services"
              className="block text-base text-white hover:text-cyan-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className="block text-base text-white hover:text-cyan-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#case-studies"
              className="block text-base text-white hover:text-cyan-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Case Studies
            </a>
            <a
              href="#testimonials"
              className="block text-base text-white hover:text-cyan-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="block text-base text-white hover:text-cyan-200 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </a>
            <a
              href="/checkout"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-white px-6 py-3 rounded-full text-base shadow-md bg-white/10 backdrop-blur-sm border border-white/30 text-center"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}