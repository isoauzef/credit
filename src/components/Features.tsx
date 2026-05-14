import { Shield, FileCheck, TrendingUp } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

interface FeaturesProps {
  background: string;
  rectangleIcons: {
    icon1: string;
    icon2: string;
    icon3: string;
  };
  svgPaths: any;
}

export function Features({ background, rectangleIcons, svgPaths }: FeaturesProps) {
  const cms = usePageContent<{
    heading?: string;
    subheading?: string;
    features?: Array<{ title: string; description: string }>;
  }>("homepage", "features");

  const icons = [Shield, FileCheck, TrendingUp];

  const features = (cms?.features ?? [
    { title: "100% Legal & Compliant", description: "We use only ethical, platform-compliant methods to remove reviews that violate policies. No black-hat tactics, ever." },
    { title: "Permanent Removal", description: "Once removed, reviews are gone for good. We ensure complete deletion from all platforms and search results." },
    { title: "Fast Results", description: "Most reviews are removed within 7-14 days. We work quickly to restore your reputation and business." },
  ]).map((f, i) => ({ ...f, icon: icons[i % icons.length] }));

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Background image overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-white text-3xl lg:text-4xl mb-4">
            {cms?.heading ?? "Why Choose creditremovers.com?"}
          </h2>
          <p className="text-white/90 text-lg lg:text-xl max-w-2xl mx-auto text-[20px]">
            {cms?.subheading ?? "We're the trusted leader in review removal with a proven track record"}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 lg:p-10 hover:bg-white/15 transition-all hover:scale-105 transform"
              >
                <div className="text-center">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-white text-xl lg:text-2xl mb-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/90 lg:text-lg leading-relaxed text-[18px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 lg:mt-16">
          <a
            href="/checkout"
            className="inline-block bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
}