import imgGoogleMapsReviewRemovals012Gif from "figma:asset/514dcc9df256f42d082f02fbc8ddbfc0532d4257.png";
import svgPaths from "../imports/svg-foacf9ytme";
import { usePageContent } from "../hooks/usePageContent";

interface TabData {
  id: string;
  title: string;
  icon: string;
  content: {
    title: string;
    description: string[];
    stats: Array<{
      icon: string;
      text: string[];
    }>;
    image: string;
  };
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d={svgPaths.p1203d500} fill="white" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d={svgPaths.p380b3580} fill="white" />
    </svg>
  );
}

export function CaseStudies() {
  const cms = usePageContent<{
    heading?: string;
    subheading?: string;
    title?: string;
    description?: string[];
    stats?: Array<{ text: string[] }>;
  }>("homepage", "caseStudies");

  const caseStudy: TabData["content"] = {
    title: cms?.title ?? "How creditremovers Helped a Restaurant Bounce Back",
    description: cms?.description ?? [
      "A local restaurant was hit by a wave of unfair negative reviews, causing a drop in customer trust and foot traffic.",
      "creditremovers stepped in, verified and removed the false reviews, and guided the owner on best practices for future reputation management.",
      "Within weeks, the restaurant saw a surge in positive feedback and regained its loyal customer base.",
    ],
    stats: (cms?.stats ?? [
      { text: ["Google Rating Improved", "from 2.8 to 4.5"] },
      { text: ["50% Increase in", "Monthly Inquiries"] },
    ]).map((s, i) => ({ icon: i === 0 ? "search" : "arrow", text: s.text })),
    image: imgGoogleMapsReviewRemovals012Gif,
  };

  return (
    <section id="case-studies" className="relative py-16 lg:py-24 overflow-hidden bg-white p-[0px] scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-gray-900 text-3xl lg:text-4xl mb-4">{cms?.heading ?? "Case Studies"}</h2>
          <p className="text-gray-600 text-lg lg:text-xl max-w-2xl mx-auto">
            {cms?.subheading ?? "Real results from businesses we've helped"}
          </p>
        </div>

        {/* Case Study Content */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left Column - Text Content */}
              <div>
                <h3 className="text-gray-900 text-2xl lg:text-3xl mb-6">
                  {caseStudy.title}
                </h3>

                <div className="text-gray-700 text-base lg:text-lg leading-relaxed mb-8">
                  {caseStudy.description.map((line, index) => (
                    <p key={index} className={index < caseStudy.description.length - 1 ? "mb-0" : ""}>
                      {line}
                    </p>
                  ))}
                </div>

                <div className="space-y-6 mb-8">
                  {caseStudy.stats.map((stat, index) => (
                    <div key={index} className="flex items-start gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))' }}>
                        {stat.icon === "search" ? <SearchIcon /> : <ArrowIcon />}
                      </div>
                      <div className="text-gray-900 text-base lg:text-lg capitalize leading-snug pt-1">
                        {stat.text.map((line, i) => (
                          <p key={i} className={i < stat.text.length - 1 ? "mb-0" : ""}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="/#hero-contact"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 border-3 border-transparent rounded-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Learn More
                </a>
              </div>

              {/* Right Column - Image */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[410px] h-auto">
                  <img
                    src={caseStudy.image}
                    alt={caseStudy.title}
                    className="w-full h-auto object-contain rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
