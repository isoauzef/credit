import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { usePageContent } from "../hooks/usePageContent";

interface FAQProps {
  image: string;
  background: string;
  svgPaths: any;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 hover:border-indigo-300 transition-colors">
      <button
        onClick={onToggle}
        className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-900 text-base lg:text-lg pr-4">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 border-t border-gray-100">
          <p className="text-gray-700 text-base lg:text-lg leading-relaxed mt-4">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ({ image, background, svgPaths }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const cms = usePageContent<{
    heading?: string;
    subheading?: string;
    faqs?: Array<{ question: string; answer: string }>;
  }>("homepage", "faq");

  const faqs = cms?.faqs ?? [
    { question: "How long does the review removal process take?", answer: "Most reviews are removed within 7-14 days. The timeline varies depending on the platform and specific circumstances. We work diligently to expedite the process and keep you updated every step of the way." },
    { question: "What types of reviews can be removed?", answer: "We focus on removing false, misleading, defamatory reviews, or reviews that violate platform policies. This includes fake reviews, reviews from competitors, reviews containing profanity, or reviews that violate privacy." },
    { question: "Is the removal permanent?", answer: "Yes! Once we successfully remove a review, it is gone permanently from the platform and search results. We guarantee our results and you'll never have to worry about that review again." },
    { question: "Do I have to pay upfront?", answer: "No. We operate on a no-win, no-fee basis. You only pay once the review has been successfully and permanently removed. We trust in our process and our 98% success rate." },
    { question: "Is the process legal and compliant?", answer: "Absolutely. We only use ethical, platform-compliant methods to remove reviews. We never use black-hat tactics or violate any terms of service. All our methods are 100% legal and transparent." },
    { question: "How confidential is the service?", answer: "Completely confidential. We understand the sensitive nature of reputation management. All our services are handled with the utmost discretion, and we never share client information." },
  ];

  return (
    <section id="faq" className="relative py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden scroll-mt-32">
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-5"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Image */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-10 blur-2xl"></div>
              <img 
                src={image} 
                alt="Woman on phone with glasses looking at computer" 
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Right Column - FAQ */}
          <div className="order-1 lg:order-2">
            <div className="mb-10">
              <h2 className="text-gray-900 text-3xl lg:text-4xl mb-4">
                {cms?.heading ?? "Frequently Asked Questions"}
              </h2>
              <p className="text-gray-600 text-base lg:text-lg">
                {cms?.subheading ?? "Everything you need to know about our review removal service"}
              </p>
            </div>

            <div>
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA Card - Full Width */}
        <div className="mt-12 lg:mt-16">
          <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(to right, rgb(41, 128, 185), rgb(44, 62, 80))' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl mb-2">Still Have Questions?</h3>
                <p className="text-white/90 text-base lg:text-lg">
                  Our reputation management experts are here to help. Get a free consultation today.
                </p>
              </div>
            </div>
            <a
              href="/checkout"
              className="inline-flex items-center justify-center bg-gradient-to-r from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 mt-4 bg-[rgba(239,98,98,0)]"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}