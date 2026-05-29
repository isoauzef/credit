import { Check, Shield, TrendingUp, Star, Users } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

interface ReviewsProps {
  background: string;
  image: string;
  svgPaths: any;
}

export function Reviews({ background, image, svgPaths }: ReviewsProps) {
  const cms = usePageContent<{
    headingLine1?: string;
    headingLine2?: string;
    description?: string;
    benefits?: string[];
    stats?: Array<{ value: string; label: string }>;
  }>("homepage", "reviews");

  const benefitIcons = [TrendingUp, Shield, Star, Users];
  const benefits = (cms?.benefits ?? [
    "Increased business and revenue",
    "Improved credibility and trust",
    "Enhanced brand image",
    "Higher customer confidence",
  ]).map((text, i) => ({ icon: benefitIcons[i % benefitIcons.length], text }));

  const stats = cms?.stats ?? [
    { value: "98%", label: "Success Rate" },
    { value: "7-14", label: "Days Average" },
    { value: "10K+", label: "Happy Clients" },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-white space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl mb-4 text-[27px]">
                {cms?.headingLine1 ?? "Protect Your Brand Image &"}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-coral-400 to-orange-400">
                  {cms?.headingLine2 ?? "Boost Your Reputation"}
                </span>
              </h2>
              
              <p className="text-white/90 lg:text-lg leading-relaxed text-[20px]">
                {cms?.description ?? "Your business reputation is one of your most valuable assets. Negative reviews can have lasting impacts on potential customers and your bottom line. Our comprehensive review removal services help businesses and individuals reclaim their reputation."}
              </p>
            </div>

            {/* Benefits Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-coral-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-base lg:text-lg text-white/90 pt-2">
                        {benefit.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl lg:text-4xl mb-1 text-transparent bg-clip-text bg-gradient-to-r from-coral-400 to-orange-400">
                    {stat.value}
                  </div>
                  <div className="text-sm lg:text-base text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href="/#hero-contact"
              className="inline-block bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Get Started
            </a>
          </div>

          {/* Right Column - Image */}
          <div className="order-first lg:order-last">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-coral-500 to-orange-500 rounded-3xl opacity-20 blur-2xl"></div>
              <img 
                src={image} 
                alt="A man speaking about his brand" 
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
