import svgPaths from "./imports/svg-6ltl2tuh8w";
import imgBackground from "figma:asset/62356cd2490931e3dce518ea9588a3f6e4a0694f.png";
import imgRectangle from "figma:asset/81eeb1b9bd38571c87bccb960ba64ff1847c213a.png";
import imgRectangle1 from "figma:asset/e69411da823104d7e7a79fdc3cbd98127d49c82c.png";
import imgRectangle2 from "figma:asset/65b16a828c5cfd3b5ea8caa069d095519f05e562.png";
import imgRectangle3 from "figma:asset/d3eda752e0f4034b7f6f99046f8a4337a91cf213.png";
import imgBackground1 from "figma:asset/a695e954643eeca3c60b1cc9c2d11dabbfdf8ac2.png";
import imgCoworkersLookingAtSearchResultsForTheirClient from "figma:asset/d1a836d6555e3993e48e9e033edf4111f83ca52a.png";
import imgCoworkersCreatingAnOnlineReputationMangementPlan from "figma:asset/0a575576eb2e81278ffa991cc466f77f7445a65b.png";
import imgBackground2 from "figma:asset/7716ad1b96b46278775e32e511f52d19c65ee811.png";
import imgAManSpeakingAboutHisBrand from "figma:asset/14484a7e6b028ec23a8100dec458a808367f441a.png";
import imgWomanOnPhoneWithGlassesLookingAtComputerWorkingInFlowerShopSmallBusinessOwner from "figma:asset/430eaed5428c24cbb89e1594fe8d213f22754341.png";
import { Hero } from "./components/Hero";
import { Statistics } from "./components/Statistics";
import { Platforms } from "./components/Platforms";
import { Features } from "./components/Features";
import { Establishment } from "./components/Establishment";
import { Reviews } from "./components/Reviews";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { CaseStudies } from "./components/CaseStudies";
import { Footer } from "./components/Footer";
import { Navigation } from "./components/Navigation";
import { BackToTop } from "./components/BackToTop";

export default function App() {
  const featuredLogos = [
    new URL("../change-images-from/Bloomberg-Logo-700x394.png", import.meta.url).href,
    new URL("../change-images-from/Business_Insider_Logo.svg.png", import.meta.url).href,
    new URL("../change-images-from/marketwatch-logo-vector-download.png", import.meta.url).href,
    new URL("../change-images-from/Reuters-Logo.png", import.meta.url).href,
    new URL("../change-images-from/images.jpeg", import.meta.url).href,
    new URL("../change-images-from/images.png", import.meta.url).href,
  ];

  return (
    <div className="min-h-screen bg-white">
  <Navigation />
      <main id="main-content" tabIndex={-1}>
      <Hero 
        background={imgBackground}
        rectangleIcons={{
          icon1: imgRectangle1,
          icon2: imgRectangle2,
          icon3: imgRectangle3,
        }}
        svgPaths={svgPaths}
      />
      <Statistics />
      <Platforms />
      <Features
        background={imgBackground1}
        rectangleIcons={{
          icon1: imgRectangle1,
          icon2: imgRectangle2,
          icon3: imgRectangle3,
        }}
        svgPaths={svgPaths}
      />
      <Establishment
        image={imgCoworkersLookingAtSearchResultsForTheirClient}
        svgPaths={svgPaths}
      />
      <Reviews
        background={imgBackground2}
        image={imgAManSpeakingAboutHisBrand}
        svgPaths={svgPaths}
      />
      <Testimonials logos={featuredLogos} />
      <FAQ
        image={imgWomanOnPhoneWithGlassesLookingAtComputerWorkingInFlowerShopSmallBusinessOwner}
        background={imgCoworkersCreatingAnOnlineReputationMangementPlan}
        svgPaths={svgPaths}
      />
      <CaseStudies />
      </main>
  <Footer svgPaths={svgPaths} />
  <BackToTop />
    </div>
  );
}