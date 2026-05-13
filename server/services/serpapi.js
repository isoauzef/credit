/**
 * SerpAPI service — Google Maps business search & review fetching
 */
const { getSerpApiKey } = require("../helpers/runtime");

const SERPAPI_BASE = "https://serpapi.com/search.json";

/**
 * Search for businesses on Google Maps
 * @param {string} query - business name / search term
 * @returns {Promise<Array>} list of business results
 */
/**
 * Resolve IP to lat/lng using ip-api.com (free, no key, 45 req/min)
 * @param {string} ip
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function geolocateIp(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon,city,regionName,country`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "success" && data.lat && data.lon) {
      return { lat: data.lat, lng: data.lon, city: data.city || "", region: data.regionName || "", country: data.country || "" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Search for businesses on Google Maps
 * @param {string} query - business name / search term
 * @param {{lat: number, lng: number}|null} coords - optional user coordinates
 * @returns {Promise<Array>} list of business results
 */
async function searchBusinesses(query, coords) {
  const apiKey = getSerpApiKey();
  if (!apiKey) throw new Error("SerpAPI key not configured");

  const mapResult = (r) => ({
    data_id: r.data_id || null,
    place_id: r.place_id || null,
    title: r.title || "",
    address: r.address || "",
    rating: r.rating || 0,
    reviews: r.reviews || 0,
    type: r.type || "",
    thumbnail: r.thumbnail || null,
  });

  const params = new URLSearchParams({
    engine: "google_maps",
    type: "search",
    q: query,
    num: "10",
    hl: "en",
    api_key: apiKey,
  });

  // If we have user coordinates, set ll with a wide zoom for location bias
  if (coords) {
    params.set("ll", `@${coords.lat},${coords.lng},11z`);
  }

  const res = await fetch(`${SERPAPI_BASE}?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  let results = data.local_results || [];

  // Fallback: if no results found with location bias, retry without it
  if (results.length === 0 && coords) {
    const fallbackParams = new URLSearchParams({
      engine: "google_maps",
      type: "search",
      q: query,
      num: "10",
      hl: "en",
      api_key: apiKey,
    });
    const fbRes = await fetch(`${SERPAPI_BASE}?${fallbackParams}`);
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      results = fbData.local_results || [];
    }
  }

  return results.map(mapResult);
}

/**
 * Resolve a business name + address to a SerpAPI data_id
 * Used when the business was found via Google Places (which doesn't have data_id)
 * @param {string} title - business name
 * @param {string} address - business address to help match
 * @returns {Promise<string|null>} data_id or null
 */
async function resolveDataId(title, address) {
  const apiKey = getSerpApiKey();
  if (!apiKey) return null;

  // Strategy 1: Search by title + address
  const query = `${title} ${address}`.trim();
  const params = new URLSearchParams({
    engine: "google_maps",
    type: "search",
    q: query,
    num: "5",
    hl: "en",
    api_key: apiKey,
  });

  try {
    const res = await fetch(`${SERPAPI_BASE}?${params}`);
    if (res.ok) {
      const data = await res.json();
      const results = data.local_results || [];
      if (results.length > 0) {
        const titleLower = title.toLowerCase();
        const match = results.find((r) => (r.title || "").toLowerCase() === titleLower);
        const dataId = (match || results[0]).data_id || null;
        if (dataId) {
          console.log(`[resolve] Found data_id via title+address: "${dataId}"`);
          return dataId;
        }
      }
    }
  } catch (err) {
    console.error("[resolve] Strategy 1 failed:", err.message);
  }

  // Strategy 2: Search by title only (address may differ between Google and SerpAPI)
  try {
    const params2 = new URLSearchParams({
      engine: "google_maps",
      type: "search",
      q: title,
      num: "5",
      hl: "en",
      api_key: apiKey,
    });
    const res2 = await fetch(`${SERPAPI_BASE}?${params2}`);
    if (res2.ok) {
      const data2 = await res2.json();
      const results2 = data2.local_results || [];
      if (results2.length > 0) {
        const titleLower = title.toLowerCase();
        const match = results2.find((r) => (r.title || "").toLowerCase() === titleLower);
        const dataId = (match || results2[0]).data_id || null;
        if (dataId) {
          console.log(`[resolve] Found data_id via title-only: "${dataId}"`);
          return dataId;
        }
      }
    }
  } catch (err) {
    console.error("[resolve] Strategy 2 failed:", err.message);
  }

  console.error(`[resolve] Could not resolve data_id for "${title}" at "${address}"`);
  return null;
}

/**
 * Fetch reviews for a specific business, sorted by lowest rating
 * Supports both data_id (SerpAPI) and place_id (Google Places) identifiers
 * @param {string} id - data_id or place_id
 * @param {string|null} nextPageToken - pagination token for subsequent pages
 * @param {boolean} isPlaceId - whether the id is a Google place_id
 * @returns {Promise<{placeInfo: object, reviews: Array, nextPageToken: string|null}>}
 */
async function getBusinessReviews(id, nextPageToken, isPlaceId = false) {
  const apiKey = getSerpApiKey();
  if (!apiKey) throw new Error("SerpAPI key not configured");

  const params = new URLSearchParams({
    engine: "google_maps_reviews",
    sort_by: "ratingLow",
    hl: "en",
    api_key: apiKey,
  });

  if (isPlaceId) {
    params.set("place_id", id);
  } else {
    params.set("data_id", id);
  }

  if (nextPageToken) {
    params.set("next_page_token", nextPageToken);
  }

  const res = await fetch(`${SERPAPI_BASE}?${params}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI reviews failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  const placeInfo = data.place_info
    ? {
        title: data.place_info.title || "",
        address: data.place_info.address || "",
        rating: data.place_info.rating || 0,
        reviews: data.place_info.reviews || 0,
        type: data.place_info.type || "",
      }
    : null;

  const allReviews = data.reviews || [];

  // Filter to only 1-2 star reviews
  const negativeReviews = allReviews
    .filter((r) => r.rating && r.rating <= 2)
    .map((r) => ({
      review_id: r.review_id || null,
      link: r.link || null,
      rating: r.rating,
      date: r.date || "",
      iso_date: r.iso_date || "",
      snippet: r.snippet || r.extracted_snippet?.original || "",
      userName: r.user?.name || "Anonymous",
      userThumbnail: r.user?.thumbnail || null,
    }));

  const token = data.serpapi_pagination?.next_page_token || null;

  return { placeInfo, reviews: negativeReviews, nextPageToken: token };
}

module.exports = { searchBusinesses, getBusinessReviews, resolveDataId, geolocateIp };
