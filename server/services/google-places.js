/**
 * Google Places API (New) — Text Search for businesses
 * Uses the Places API v1 endpoint for reliable business search results.
 */
const { getGooglePlacesKey } = require("../helpers/runtime");

const PLACES_BASE = "https://places.googleapis.com/v1/places:searchText";

/**
 * Search businesses via Google Places Text Search
 * @param {string} query - business name / search term
 * @param {{lat: number, lng: number}|null} coords - user coordinates for location bias
 * @returns {Promise<Array>} formatted business results
 */
async function searchPlaces(query, coords) {
  const apiKey = getGooglePlacesKey();
  if (!apiKey) throw new Error("Google Places API key not configured");

  const body = {
    textQuery: query,
    languageCode: "en",
    maxResultCount: 10,
  };

  // Add location bias if we have coordinates (50km radius)
  if (coords) {
    body.locationBias = {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius: 50000.0,
      },
    };
  }

  const res = await fetch(PLACES_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryType,places.photos,places.googleMapsUri",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const places = data.places || [];

  return places.map((p) => {
    // Build thumbnail URL from first photo if available
    let thumbnail = null;
    if (p.photos && p.photos.length > 0) {
      const photoName = p.photos[0].name;
      thumbnail = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=120&maxHeightPx=120&key=${apiKey}`;
    }
    return {
      place_id: p.id || null,
      title: p.displayName?.text || "",
      address: p.formattedAddress || "",
      rating: p.rating || 0,
      reviews: p.userRatingCount || 0,
      type: formatType(p.primaryType || ""),
      thumbnail,
      googleMapsUri: p.googleMapsUri || null,
    };
  });
}

/**
 * Convert snake_case type to readable label
 */
function formatType(type) {
  if (!type) return "";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { searchPlaces };
