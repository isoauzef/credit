import { TrendingUp, Users, Award } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

export function Statistics() {
  const cms = usePageContent<{
    stats?: Array<{ percentage: string; label: string; description: string }>;
  }>("homepage", "statistics");

  const icons = [TrendingUp, Users, Award];

  const stats = (cms?.stats ?? [
    { percentage: "98%", label: "Success Rate", description: "Reviews successfully removed" },
    { percentage: "10K+", label: "Happy Clients", description: "Businesses we've helped" },
    { percentage: "15+", label: "Years Experience", description: "In reputation management" },
  ]).map((s, i) => ({ ...s, icon: icons[i % icons.length] }));

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(to right, rgba(41, 128, 185, 0.1), rgba(44, 62, 80, 0.1))' }}>
                    <Icon className="w-8 h-8" style={{ color: 'rgb(41, 128, 185)' }} />
                  </div>
                  <div className="text-5xl lg:text-6xl mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))' }}>
                    {stat.percentage}
                  </div>
                  <h3 className="text-xl lg:text-2xl text-gray-900 mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-base lg:text-lg text-gray-600 text-[18px]">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}