import { useRef, useEffect, useState } from "react";
import { usePageContent } from "../hooks/usePageContent";
import imgImgGoogleLogo from "figma:asset/9cb785c8a85a12a9caded2aa7a2851708f140cdd.png";
import imgImgBetterBusinessBureauLogo from "figma:asset/53eeb31d0f6f7694f39e55946804f0045ac7fa20.png";
import imgImgGlassdoorLogo from "figma:asset/898509279e27e830a2d3c5f3703ff50179175537.png";
import imgImgTrustpilotLogo from "figma:asset/05ad502c7873fda42a5637e547271b71c25b7ace.png";
import imgImgRateMDsLogo from "figma:asset/4df05058710a735f1085ed4afcff199528457d02.png";

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Platforms() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cms = usePageContent<{
    heading?: string;
    subheading?: string;
    platformList?: string[];
  }>("homepage", "platforms");

  const platforms = [
    { logo: imgImgGoogleLogo, name: "Google" },
    { logo: imgImgBetterBusinessBureauLogo, name: "Better Business Bureau" },
    { logo: imgImgGlassdoorLogo, name: "Glassdoor" },
    { logo: imgImgTrustpilotLogo, name: "Trustpilot" },
    { logo: imgImgRateMDsLogo, name: "RateMDs" },
  ];

  const platformList = cms?.platformList ?? [
    "Google",
    "Better Business Bureau",
    "Glassdoor",
    "Trustpilot",
    "RateMDs",
    "Yelp",
    "Facebook",
    "TripAdvisor",
  ];

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % platforms.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [platforms.length]);

  // Create visible platforms array (showing 5 at a time)
  const getVisiblePlatforms = () => {
    const visible = [];
    for (let i = 0; i < 5; i++) {
      visible.push(platforms[(currentIndex + i) % platforms.length]);
    }
    return visible;
  };

  return (
    <section id="services" className="py-16 lg:py-20 bg-white border-t border-gray-100 scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">
            {cms?.heading ?? "Platforms We Remove Reviews From"}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            {cms?.subheading ?? "We work with 100+ platforms to help you maintain a clean online reputation"}
          </p>
        </div>

        {/* Carousel */}
        <div className="mb-12 lg:mb-16 overflow-hidden">
          <div className="flex items-center justify-center lg:justify-center gap-3 lg:gap-12 transition-all duration-500">
            {getVisiblePlatforms().map((platform, index) => (
              <div
                key={`${platform.name}-${index}`}
                className="flex-shrink-0 w-[105px] lg:w-[180px]"
              >
                <div className="flex items-center justify-center h-[60px] bg-gray-50 rounded-xl p-3 lg:p-4 hover:bg-gray-100 transition-colors">
                  <img
                    src={platform.logo}
                    alt={platform.name}
                    className="max-h-[48px] lg:max-h-[53px] w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform List with Checkmarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {platformList.map((platform, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 lg:p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))' }}>
                <CheckIcon />
              </div>
              <span className="text-base lg:text-lg text-gray-900">{platform}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}