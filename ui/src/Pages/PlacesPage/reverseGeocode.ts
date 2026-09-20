export type LocationInfo = {
  city: string
  region: string
  country: string
  label: string
}

// Distance in kilometers using Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface KnownLocation {
  city: string
  region: string
  country: string
  lat: number
  lon: number
  radiusKm: number
}

// Compact high-accuracy offline reference locations
const KNOWN_LOCATIONS: KnownLocation[] = [
  // Major Indian Hubs & Destinations in library
  { city: 'Bengaluru', region: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, radiusKm: 45 },
  { city: 'Nagpur', region: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882, radiusKm: 40 },
  { city: 'Pench National Park', region: 'Madhya Pradesh', country: 'India', lat: 22.215, lon: 79.742, radiusKm: 55 },
  { city: 'Seoni & Chhindwara', region: 'Madhya Pradesh', country: 'India', lat: 22.086, lon: 79.543, radiusKm: 60 },
  { city: 'Nainital', region: 'Uttarakhand', country: 'India', lat: 29.3919, lon: 79.4542, radiusKm: 30 },
  { city: 'Raipur', region: 'Chhattisgarh', country: 'India', lat: 21.2514, lon: 81.6296, radiusKm: 45 },
  { city: 'Sagar', region: 'Madhya Pradesh', country: 'India', lat: 23.8388, lon: 78.7378, radiusKm: 40 },
  { city: 'Indore', region: 'Madhya Pradesh', country: 'India', lat: 22.7196, lon: 75.8577, radiusKm: 40 },
  { city: 'Bhopal', region: 'Madhya Pradesh', country: 'India', lat: 23.2599, lon: 77.4126, radiusKm: 40 },
  { city: 'Shimla', region: 'Himachal Pradesh', country: 'India', lat: 31.1048, lon: 77.1734, radiusKm: 40 },
  { city: 'Coorg & Madikeri', region: 'Karnataka', country: 'India', lat: 12.4244, lon: 75.7382, radiusKm: 45 },
  { city: 'Nilgiris & Ooty', region: 'Tamil Nadu', country: 'India', lat: 11.4102, lon: 76.695, radiusKm: 45 },
  { city: 'Bandipur & Mudumalai', region: 'Karnataka / Tamil Nadu', country: 'India', lat: 11.6667, lon: 76.6333, radiusKm: 35 },
  { city: 'Delhi NCR', region: 'Delhi', country: 'India', lat: 28.6139, lon: 77.209, radiusKm: 50 },
  { city: 'Mumbai', region: 'Maharashtra', country: 'India', lat: 19.076, lon: 72.8777, radiusKm: 45 },
  { city: 'Pune', region: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567, radiusKm: 45 },
  { city: 'Hyderabad', region: 'Telangana', country: 'India', lat: 17.385, lon: 78.4867, radiusKm: 45 },
  { city: 'Chennai', region: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707, radiusKm: 45 },
  { city: 'Kolkata', region: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639, radiusKm: 45 },
  { city: 'Jaipur', region: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873, radiusKm: 40 },
  { city: 'Goa', region: 'Goa', country: 'India', lat: 15.2993, lon: 74.124, radiusKm: 55 },
  // International Highlights
  { city: 'Paris', region: 'Île-de-France', country: 'France', lat: 48.8566, lon: 2.3522, radiusKm: 45 },
  { city: 'London', region: 'Greater London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, radiusKm: 45 },
  { city: 'New York City', region: 'New York', country: 'United States', lat: 40.7128, lon: -74.006, radiusKm: 45 },
  { city: 'San Francisco', region: 'California', country: 'United States', lat: 37.7749, lon: -122.4194, radiusKm: 45 },
  { city: 'Tokyo', region: 'Kanto', country: 'Japan', lat: 35.6762, lon: 139.6503, radiusKm: 50 },
  { city: 'Kyoto', region: 'Kansai', country: 'Japan', lat: 35.0116, lon: 135.7681, radiusKm: 40 },
  { city: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, radiusKm: 45 },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, radiusKm: 35 },
  { city: 'Swiss Alps', region: 'Valais', country: 'Switzerland', lat: 46.0207, lon: 7.7491, radiusKm: 60 },
]

export function getCachedReverseGeocode(lat: number, lon: number): LocationInfo | null {
  // Ignore null or 0.0, 0.0 coordinates
  if ((Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) || !isFinite(lat) || !isFinite(lon)) {
    return null
  }

  // 1. Check offline known locations
  for (const loc of KNOWN_LOCATIONS) {
    const dist = getDistanceKm(lat, lon, loc.lat, loc.lon)
    if (dist <= loc.radiusKm) {
      return {
        city: loc.city,
        region: loc.region,
        country: loc.country,
        label: `${loc.city}, ${loc.region}`,
      }
    }
  }

  // 2. Check localStorage cache
  try {
    const key = `pv_geo_${Math.round(lat * 50) / 50}_${Math.round(lon * 50) / 50}`
    const cached = localStorage.getItem(key)
    if (cached) {
      return JSON.parse(cached) as LocationInfo
    }
  } catch {}

  // 3. Fallback coordinate label
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
  return {
    city: `Location (${latStr}, ${lonStr})`,
    region: 'Geotagged Area',
    country: 'Earth',
    label: `${latStr}, ${lonStr}`,
  }
}

// Asynchronously resolve unknown coordinates via OpenStreetMap Nominatim and cache locally
export async function resolveReverseGeocodeAsync(lat: number, lon: number): Promise<LocationInfo | null> {
  const syncResult = getCachedReverseGeocode(lat, lon)
  if (syncResult && !syncResult.city.startsWith('Location (')) {
    return syncResult
  }

  const key = `pv_geo_${Math.round(lat * 50) / 50}_${Math.round(lon * 50) / 50}`
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
    )
    if (!res.ok) return syncResult

    const data = await res.json()
    const addr = data.address || {}
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      `Region (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
    const region = addr.state || addr.province || addr.region || ''
    const country = addr.country || ''

    const info: LocationInfo = {
      city,
      region,
      country,
      label: region ? `${city}, ${region}` : city,
    }

    try {
      localStorage.setItem(key, JSON.stringify(info))
    } catch {}

    return info
  } catch (err) {
    return syncResult
  }
}
