import { Check, ArrowRight } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

interface EstablishmentProps {
  image: string;
  svgPaths: any;
}

export function Establishment({ image, svgPaths }: EstablishmentProps) {
  const cms = usePageContent<{
    headingLine1?: string;
    headingLine2?: string;
    description?: string;
    benefits?: string[];
    platformsHeading?: string;
    platforms?: string[];
  }>("homepage", "establishment");

  const benefits = cms?.benefits ?? [
    "Remove false and defamatory reviews",
    "Protect your business reputation",
    "Increase customer trust and sales",
    "Comply with platform policies",
    "Get results in 7-14 days",
    "100% confidential service",
  ];

  const platforms = cms?.platforms ?? [
    "Google", "BBB", "Yelp", "Glassdoor",
    "TrustPilot", "TripAdvisor", "Facebook", "Healthgrades",
    "RateMDs", "Zillow", "Angi", "HomeAdvisor",
    "Houzz", "Porch", "Reddit", "Quora"
  ];

  return (
    <section id="how-it-works" className="bg-gradient-to-br from-gray-50 to-white py-16 lg:py-24 scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-10 blur-2xl"></div>
              <img 
                src={image} 
                alt="Coworkers looking at search results for their client" 
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-gray-900 text-3xl lg:text-4xl mb-4 text-[30px]">
                {cms?.headingLine1 ?? "Establishing A Reputable"}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-700">
                  {cms?.headingLine2 ?? "Brand For Success"}
                </span>
              </h2>
              
              <p className="text-gray-700 lg:text-lg leading-relaxed text-[20px]">
                {cms?.description ?? "In today's digital age, your online reputation can make or break your business. We help you take control of your narrative by removing false and misleading reviews from major platforms."}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))' }}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-base lg:text-lg text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Platforms */}
            <div>
              <h3 className="text-gray-900 text-xl lg:text-2xl mb-4">
                {cms?.platformsHeading ?? "Platforms We Work With:"}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white border border-indigo-200 rounded-full text-sm lg:text-base text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    {platform}
                  </span>
                ))}
                <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-full text-sm lg:text-base text-blue-600">
                  +84 more
                </span>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/checkout"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}