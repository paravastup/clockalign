import { NextRequest, NextResponse } from 'next/server';
import { searchCities, worldCityToCity, countryToFlag } from '@/lib/cities-database';
import { DateTime } from 'luxon';

// Cache for Nominatim results to avoid repeated API calls
const nominatimCache = new Map<string, { data: NominatimResult[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

interface CityResult {
  id: string;
  name: string;
  country: string;
  timezone: string;
  flag: string;
  source: 'local' | 'nominatim';
}

// Map lat/lon to IANA timezone using a simplified approach
// For production, consider using a proper timezone lookup service
function getTimezoneFromCoords(lat: number, lon: number): string {
  // Rough timezone estimation based on longitude
  // This is a simplified approach - for production, use a proper geo-timezone library
  const offset = Math.round(lon / 15);

  // Common timezone mappings by region
  if (lat > 50 && lon > -10 && lon < 40) {
    // Europe
    if (lon < 0) return 'Europe/London';
    if (lon < 15) return 'Europe/Paris';
    if (lon < 25) return 'Europe/Berlin';
    return 'Europe/Moscow';
  }

  if (lat > 20 && lat < 50 && lon > 60 && lon < 150) {
    // East Asia
    if (lon < 90) return 'Asia/Kolkata';
    if (lon < 105) return 'Asia/Bangkok';
    if (lon < 120) return 'Asia/Shanghai';
    if (lon < 135) return 'Asia/Tokyo';
    return 'Asia/Tokyo';
  }

  if (lat > -50 && lat < 20 && lon > 90 && lon < 180) {
    // Southeast Asia / Oceania
    if (lat > 0) return 'Asia/Singapore';
    if (lon < 140) return 'Australia/Perth';
    if (lon < 150) return 'Australia/Sydney';
    return 'Pacific/Auckland';
  }

  if (lat > 25 && lat < 50 && lon < -60) {
    // North America
    if (lon < -120) return 'America/Los_Angeles';
    if (lon < -100) return 'America/Denver';
    if (lon < -85) return 'America/Chicago';
    return 'America/New_York';
  }

  if (lat < 25 && lon < -30 && lon > -120) {
    // Central/South America
    if (lat > 10) return 'America/Mexico_City';
    if (lon < -60) return 'America/Sao_Paulo';
    return 'America/Lima';
  }

  if (lat > 10 && lat < 40 && lon > 30 && lon < 60) {
    // Middle East
    if (lon < 40) return 'Asia/Jerusalem';
    return 'Asia/Dubai';
  }

  if (lat < 35 && lat > -35 && lon > -20 && lon < 55) {
    // Africa
    if (lon < 0) return 'Africa/Casablanca';
    if (lat > 20) return 'Africa/Cairo';
    if (lon > 30) return 'Africa/Nairobi';
    return 'Africa/Lagos';
  }

  // Default fallback based on longitude offset
  if (offset >= 0) {
    return `Etc/GMT-${offset}`;
  }
  return `Etc/GMT+${Math.abs(offset)}`;
}

async function searchNominatim(query: string): Promise<CityResult[]> {
  // Check cache first
  const cacheKey = query.toLowerCase();
  const cached = nominatimCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return processNominatimResults(cached.data);
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('featuretype', 'city');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'ClockAlign/1.0 (timezone meeting scheduler)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const results: NominatimResult[] = await response.json();

    // Cache the results
    nominatimCache.set(cacheKey, { data: results, timestamp: Date.now() });

    return processNominatimResults(results);
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

function processNominatimResults(results: NominatimResult[]): CityResult[] {
  return results
    .filter(r => r.address?.city || r.address?.town || r.address?.municipality)
    .map(result => {
      const cityName = result.address?.city || result.address?.town || result.address?.municipality || 'Unknown';
      const country = result.address?.country || 'Unknown';
      const countryCode = (result.address?.country_code || 'XX').toUpperCase();
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const timezone = getTimezoneFromCoords(lat, lon);

      return {
        id: `nominatim-${result.place_id}`,
        name: cityName,
        country,
        timezone,
        flag: countryToFlag(countryCode),
        source: 'nominatim' as const,
      };
    });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ cities: [], error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  // Search local database first
  const localResults = searchCities(query, 10).map(city => ({
    ...worldCityToCity(city),
    source: 'local' as const,
  }));

  // If we have enough local results, return them
  if (localResults.length >= 5) {
    return NextResponse.json({ cities: localResults, source: 'local' });
  }

  // Otherwise, also search Nominatim for additional results
  const nominatimResults = await searchNominatim(query);

  // Merge and dedupe results (prefer local)
  const seenNames = new Set(localResults.map(c => c.name.toLowerCase()));
  const uniqueNominatim = nominatimResults.filter(c => !seenNames.has(c.name.toLowerCase()));

  const combined = [...localResults, ...uniqueNominatim].slice(0, 10);

  return NextResponse.json({
    cities: combined,
    source: combined.some(c => c.source === 'nominatim') ? 'mixed' : 'local',
  });
}
