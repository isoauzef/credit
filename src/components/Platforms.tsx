import { ShieldCheck, Landmark, Phone, Home, Umbrella, Zap, Droplet, Flame, Trash2, Tv, FileText, ArrowRight } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

/* Map a bill label keyword → icon. Falls back to FileText. */
function iconForBill(label: string) {
  const s = label.toLowerCase();
  if (s.includes("mobile") || s.includes("phone") || s.includes("landline")) return Phone;
  if (s.includes("rent") || s.includes("mortgage") || s.includes("housing")) return Home;
  if (s.includes("insurance")) return Umbrella;
  if (s.includes("electric") || s.includes("power")) return Zap;
  if (s.includes("water")) return Droplet;
  if (s.includes("gas")) return Flame;
  if (s.includes("waste") || s.includes("trash") || s.includes("garbage")) return Trash2;
  if (s.includes("cable") || s.includes("tv") || s.includes("television") || s.includes("internet")) return Tv;
  return FileText;
}

interface PlatformsProps {
  showBills?: boolean;
  showCta?: boolean;
}

export function Platforms({ showBills: showBillsProp, showCta = false }: PlatformsProps = {}) {
  const cms = usePageContent<{
    badge?: string;
    heading?: string;
    subheading?: string;
    lawName?: string;
    lawDescription?: string;
    showBills?: boolean;
    billsHeading?: string;
    ctaText?: string;
    platformList?: string[];
  }>("homepage", "platforms");

  const badge = cms?.badge ?? "Federally Protected Program";
  const heading = cms?.heading ?? "Federally Protected Credit Repair";
  const subheading =
    cms?.subheading ??
    "Thanks to the new Credit Access and Inclusion Act, we add positive bill payment history to all 3 credit bureaus to boost your score even more.";
  const lawName = cms?.lawName ?? "Credit Access and Inclusion Act";
  const lawDescription =
    cms?.lawDescription ??
    "A federal program that empowers consumers to report on-time bill payments to the major credit bureaus — building positive credit history beyond traditional accounts.";
  const billsHeading = cms?.billsHeading ?? "Bill payments we can add to your credit history";
  const ctaText = cms?.ctaText ?? "See If You Qualify";
  // Show bills grid unless explicitly disabled. Treat undefined (legacy data) as true.
  const showBills = showBillsProp ?? cms?.showBills !== false;

  const bills = cms?.platformList ?? [
    "Mobile & Landline Bills",
    "Insurance Payments",
    "Rent Payments",
    "Electricity Bills",
    "Water Bills",
    "Gas Bills",
    "Waste Management Bills",
    "Cable Television Bills",
  ];

  return (
    <section
      id="services"
      className="relative py-12 lg:py-16 bg-white border-t border-gray-100 scroll-mt-32 overflow-hidden"
    >
      {/* Subtle background accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/40 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-slate-100/40 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm lg:text-base mb-6">
            <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
            <span>{badge}</span>
          </div>
          <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">{heading}</h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{subheading}</p>
        </div>

        {/* Law callout */}
        <div className="mb-12 lg:mb-16 max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-6 lg:p-8 text-white shadow-xl"
            style={{ background: "linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))" }}
          >
            <div className="flex items-start gap-4 lg:gap-5">
              <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Landmark className="w-6 h-6 lg:w-7 lg:h-7 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl lg:text-2xl mb-2">{lawName}</h3>
                <p className="text-white/90 text-base lg:text-lg leading-relaxed">{lawDescription}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bills grid */}
        {showBills && (
          <div>
            <h3 className="text-center text-gray-900 text-xl lg:text-2xl mb-8">{billsHeading}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {bills.map((bill, index) => {
                const Icon = iconForBill(bill);
                return (
                  <div
                    key={index}
                    className="group flex flex-col items-center text-center gap-3 p-5 lg:p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all"
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                      style={{ background: "linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))" }}
                    >
                      <Icon className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2} />
                    </div>
                    <span className="text-sm lg:text-base text-gray-800 leading-snug">{bill}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        {showCta && (
          <div className="text-center">
            <a
              href="/#hero-contact"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
