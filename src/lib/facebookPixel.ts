declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function trackFacebookEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }

  return true;
}

export function trackFacebookPageView() {
  return trackFacebookEvent("PageView");
}

export function trackFacebookLead() {
  return trackFacebookEvent("Lead");
}

export function trackFacebookPurchase(params?: Record<string, unknown>) {
  return trackFacebookEvent("Purchase", params);
}
