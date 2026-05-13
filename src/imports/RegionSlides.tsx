import imgImgGoogleLogo from "figma:asset/9cb785c8a85a12a9caded2aa7a2851708f140cdd.png";
import imgImgBetterBusinessBureauLogo from "figma:asset/53eeb31d0f6f7694f39e55946804f0045ac7fa20.png";
import imgImgGlassdoorLogo from "figma:asset/898509279e27e830a2d3c5f3703ff50179175537.png";
import imgImgTrustpilotLogo from "figma:asset/05ad502c7873fda42a5637e547271b71c25b7ace.png";
import imgImgRateMDsLogo from "figma:asset/4df05058710a735f1085ed4afcff199528457d02.png";

function Group117Link() {
  return (
    <div className="absolute h-[60px] left-[-0.07px] overflow-clip right-[519.27px] top-0" data-name="Group - 1 / 17 → Link">
      <div className="absolute h-[60px] left-0 right-0 top-0" data-name="Img - Google Logo">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[88.71%] left-0 max-w-none top-[5.64%] w-full" src={imgImgGoogleLogo} />
        </div>
      </div>
    </div>
  );
}

function Group217Link() {
  return (
    <div className="absolute h-[60px] left-[129.73px] overflow-clip right-[389.47px] top-0" data-name="Group - 2 / 17 → Link">
      <div className="absolute h-[60px] left-0 right-[0.01px] top-0" data-name="Img - Better Business Bureau Logo">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[1.51%] max-w-none top-0 w-[96.98%]" src={imgImgBetterBusinessBureauLogo} />
        </div>
      </div>
    </div>
  );
}

function Group317Link() {
  return (
    <div className="absolute h-[60px] left-[259.52px] overflow-clip right-[259.68px] top-0" data-name="Group - 3 / 17 → Link">
      <div className="absolute h-[60px] left-0 right-0 top-0" data-name="Img - Glassdoor Logo">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[88.71%] left-0 max-w-none top-[5.64%] w-full" src={imgImgGlassdoorLogo} />
        </div>
      </div>
    </div>
  );
}

function Group417Link() {
  return (
    <div className="absolute h-[60px] left-[389.32px] overflow-clip right-[129.88px] top-0" data-name="Group - 4 / 17 → Link">
      <div className="absolute h-[60px] left-0 right-0 top-0" data-name="Img - Trustpilot Logo">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[88.71%] left-0 max-w-none top-[5.64%] w-full" src={imgImgTrustpilotLogo} />
        </div>
      </div>
    </div>
  );
}

function Group517Link() {
  return (
    <div className="absolute h-[60px] left-[519.12px] overflow-clip right-[0.08px] top-0" data-name="Group - 5 / 17 → Link">
      <div className="absolute h-[60px] left-0 right-0 top-0" data-name="Img - RateMDs Logo">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[88.71%] left-0 max-w-none top-[5.64%] w-full" src={imgImgRateMDsLogo} />
        </div>
      </div>
    </div>
  );
}

export default function RegionSlides() {
  return (
    <div className="relative size-full" data-name="Region - Slides">
      <Group117Link />
      <Group217Link />
      <Group317Link />
      <Group417Link />
      <Group517Link />
    </div>
  );
}