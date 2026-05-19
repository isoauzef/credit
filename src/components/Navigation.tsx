import { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";

export function Navigation({
  minimal = false,
  clientLoginOnly = false,
  staticHeader = false,
}: {
  minimal?: boolean;
  clientLoginOnly?: boolean;
  staticHeader?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const settings = useSiteSettings();
  const logoSrc = settings.site_logo || "/logo.svg";

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // Toggle scrolled state when user scrolls past the hero fold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on Escape and return focus to the toggle button.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  // Close menu when tapping/clicking outside the panel + toggle.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (mobilePanelRef.current?.contains(target)) return;
      if (menuButtonRef.current?.contains(target)) return;
      setIsMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [isMenuOpen]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#case-studies", label: "Case Studies" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#faq", label: "FAQ" },
  ];

  const closeMenu = () => setIsMenuOpen(false);
  const showFullNavigation = !minimal && !clientLoginOnly;

  // Shared focus-visible ring so keyboard users see a clear indicator
  // against both translucent nav and the dark mobile panel.
  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-cyan-300";

  return (
    <>
      {/* Skip link for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:shadow-lg ${focusRing}`}
      >
        Skip to main content
      </a>

      <nav
        aria-label="Primary"
        className={`${staticHeader ? "relative" : "fixed top-0 left-0 right-0"} z-50 transition-all duration-300 ${
          minimal || scrolled || isMenuOpen
            ? "bg-slate-900/90 backdrop-blur-md shadow-lg border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              minimal || scrolled ? "h-16" : "h-20"
            }`}
          >
            {/* Wordmark */}
            <a
              href="/"
              aria-label="Credit Removers home"
              className={`flex-shrink-0 inline-flex items-center rounded-md ${focusRing}`}
            >
              <img
                src={logoSrc}
                alt="Credit Removers"
                className={clientLoginOnly ? "h-auto w-auto max-w-[min(58vw,220px)] object-contain drop-shadow-sm" : "h-10 w-auto drop-shadow-sm"}
                decoding="async"
              />
            </a>

            {clientLoginOnly ? (
              <a
                href="/client-login"
                aria-label="Login to your client dashboard"
                className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-gradient-to-r from-coral-500 to-orange-500 px-[10px] py-[10px] text-[13px] font-semibold text-white shadow-md transition-all hover:from-coral-600 hover:to-orange-600 sm:px-5 sm:py-2.5 sm:text-sm ${focusRing}`}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Client Login</span>
              </a>
            ) : showFullNavigation ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-8">
                  {navLinks.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className={`text-white hover:text-cyan-200 transition-colors rounded-sm ${focusRing}`}
                    >
                      {l.label}
                    </a>
                  ))}
                  <a
                    href="/checkout"
                    className={`text-white px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 ${focusRing}`}
                  >
                    Get Started
                  </a>
                  <a
                    href="/client-login"
                    aria-label="Login to your client dashboard"
                    className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 border border-white/20 ${focusRing}`}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Client Login
                  </a>
                </div>

                {/* Mobile menu button (44x44 tap target) */}
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-label={isMenuOpen ? "Close main menu" : "Open main menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  className={`lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-md text-white hover:text-cyan-200 hover:bg-white/10 ${focusRing}`}
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation panel */}
        {showFullNavigation && (
          <div
            ref={mobilePanelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            hidden={!isMenuOpen}
            className="lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-white/10 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className={`flex items-center min-h-[44px] px-3 py-3 rounded-md text-base text-white hover:bg-white/10 hover:text-cyan-200 ${focusRing}`}
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 space-y-3 border-t border-white/10 mt-3">
                <a
                  href="/checkout"
                  onClick={closeMenu}
                  className={`flex items-center justify-center min-h-[44px] w-full text-white px-6 py-3 rounded-full text-base shadow-md bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 ${focusRing}`}
                >
                  Get Started
                </a>
                <a
                  href="/client-login"
                  onClick={closeMenu}
                  aria-label="Login to your client dashboard"
                  className={`flex w-full items-center justify-center gap-2 min-h-[44px] text-white px-6 py-3 rounded-full text-base shadow-md bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 border border-white/20 ${focusRing}`}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Client Login
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
