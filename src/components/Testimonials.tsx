import { Star, Quote } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

interface TestimonialsProps {
  logos: string[];
}

export function Testimonials({ logos }: TestimonialsProps) {
  const cms = usePageContent<{
    heading?: string;
    subheading?: string;
    testimonials?: Array<{ name: string; role: string; rating: number; text: string }>;
  }>("homepage", "testimonials");

  const testimonials = cms?.testimonials ?? [
    { name: "Sarah Johnson", role: "Restaurant Owner", rating: 5, text: "creditremovers.com helped remove a false review that was costing us customers. Their team was professional, fast, and delivered results. Highly recommend!" },
    { name: "Michael Chen", role: "Medical Practice", rating: 5, text: "As a healthcare provider, our reputation is everything. They removed defamatory content quickly and discreetly. Outstanding service!" },
    { name: "Amanda Rodriguez", role: "Law Firm Partner", rating: 5, text: "We've tried other services before, but creditremovers.com actually delivered. Our negative reviews were removed permanently. Worth every penny." },
  ];

  return (
    <section id="testimonials" className="bg-gradient-to-br from-white to-gray-50 py-16 lg:py-24 scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured In */}
        <div className="mb-20">
          <h2 className="text-gray-900 text-center text-2xl lg:text-3xl mb-10">
            Featured In
          </h2>
          
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 items-center justify-items-center">
            {logos.map((logo, index) => (
              <div key={index} className="flex items-center justify-center h-16 w-full">
                <img 
                  src={logo} 
                  alt={`Media logo ${index + 1}`}
                  className="max-h-full max-w-full object-contain opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Client Testimonials */}
        <div className="mt-20">
          <h2 className="text-gray-900 text-center text-3xl lg:text-4xl mb-4">
            {cms?.heading ?? "See What Our Clients Have to Say"}
          </h2>
          <p className="text-gray-600 text-center text-lg lg:text-xl mb-12 max-w-2xl mx-auto">
            {cms?.subheading ?? "Real stories from real clients who trusted us to protect their reputation"}
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full flex items-center justify-center opacity-50">
                  <Quote className="w-6 h-6 text-blue-600" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-base lg:text-lg text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-gray-900">{testimonial.name}</div>
                  <div className="text-sm lg:text-base text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <a
              href="/checkout"
              className="inline-block bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Join 10,000+ Happy Clients
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}