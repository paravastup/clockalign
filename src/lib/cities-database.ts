/**
 * World Cities Database for ClockAlign
 * Contains major cities with timezone data for autocomplete functionality
 */

export interface WorldCity {
  name: string;
  country: string;
  countryCode: string;
  timezone: string;
  population: number;
  lat: number;
  lon: number;
}

// Country code to flag emoji mapping
export const countryToFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Major world cities sorted by population
export const WORLD_CITIES: WorldCity[] = [
  // Asia
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP', timezone: 'Asia/Tokyo', population: 37400000, lat: 35.6762, lon: 139.6503 },
  { name: 'Delhi', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 31181000, lat: 28.6139, lon: 77.2090 },
  { name: 'Shanghai', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', population: 27796000, lat: 31.2304, lon: 121.4737 },
  { name: 'Beijing', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', population: 21540000, lat: 39.9042, lon: 116.4074 },
  { name: 'Mumbai', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 20668000, lat: 19.0760, lon: 72.8777 },
  { name: 'Osaka', country: 'Japan', countryCode: 'JP', timezone: 'Asia/Tokyo', population: 19165000, lat: 34.6937, lon: 135.5023 },
  { name: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', timezone: 'Asia/Dhaka', population: 17118000, lat: 23.8103, lon: 90.4125 },
  { name: 'Kolkata', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 14850000, lat: 22.5726, lon: 88.3639 },
  { name: 'Karachi', country: 'Pakistan', countryCode: 'PK', timezone: 'Asia/Karachi', population: 14910000, lat: 24.8607, lon: 67.0011 },
  { name: 'Manila', country: 'Philippines', countryCode: 'PH', timezone: 'Asia/Manila', population: 13923000, lat: 14.5995, lon: 120.9842 },
  { name: 'Guangzhou', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', population: 13300000, lat: 23.1291, lon: 113.2644 },
  { name: 'Shenzhen', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', population: 12528000, lat: 22.5431, lon: 114.0579 },
  { name: 'Seoul', country: 'South Korea', countryCode: 'KR', timezone: 'Asia/Seoul', population: 9776000, lat: 37.5665, lon: 126.9780 },
  { name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', timezone: 'Asia/Jakarta', population: 10770000, lat: -6.2088, lon: 106.8456 },
  { name: 'Bangalore', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 12327000, lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 10971000, lat: 13.0827, lon: 80.2707 },
  { name: 'Bangkok', country: 'Thailand', countryCode: 'TH', timezone: 'Asia/Bangkok', population: 10539000, lat: 13.7563, lon: 100.5018 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', population: 8993000, lat: 10.8231, lon: 106.6297 },
  { name: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', timezone: 'Asia/Hong_Kong', population: 7482000, lat: 22.3193, lon: 114.1694 },
  { name: 'Singapore', country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', population: 5686000, lat: 1.3521, lon: 103.8198 },
  { name: 'Hyderabad', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', population: 9746000, lat: 17.3850, lon: 78.4867 },
  { name: 'Taipei', country: 'Taiwan', countryCode: 'TW', timezone: 'Asia/Taipei', population: 2646000, lat: 25.0330, lon: 121.5654 },
  { name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur', population: 7780000, lat: 3.1390, lon: 101.6869 },
  { name: 'Dubai', country: 'UAE', countryCode: 'AE', timezone: 'Asia/Dubai', population: 3331000, lat: 25.2048, lon: 55.2708 },
  { name: 'Abu Dhabi', country: 'UAE', countryCode: 'AE', timezone: 'Asia/Dubai', population: 1452000, lat: 24.4539, lon: 54.3773 },
  { name: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', timezone: 'Asia/Riyadh', population: 7676000, lat: 24.7136, lon: 46.6753 },
  { name: 'Tel Aviv', country: 'Israel', countryCode: 'IL', timezone: 'Asia/Jerusalem', population: 4343000, lat: 32.0853, lon: 34.7818 },
  { name: 'Doha', country: 'Qatar', countryCode: 'QA', timezone: 'Asia/Qatar', population: 2382000, lat: 25.2867, lon: 51.5333 },

  // Americas
  { name: 'New York', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 18819000, lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 12458000, lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 8865000, lat: 41.8781, lon: -87.6298 },
  { name: 'Houston', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 6371000, lat: 29.7604, lon: -95.3698 },
  { name: 'Phoenix', country: 'United States', countryCode: 'US', timezone: 'America/Phoenix', population: 4948000, lat: 33.4484, lon: -112.0740 },
  { name: 'Philadelphia', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 5695000, lat: 39.9526, lon: -75.1652 },
  { name: 'San Antonio', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 2550000, lat: 29.4241, lon: -98.4936 },
  { name: 'San Diego', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 3318000, lat: 32.7157, lon: -117.1611 },
  { name: 'Dallas', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 6372000, lat: 32.7767, lon: -96.7970 },
  { name: 'San Jose', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 1030000, lat: 37.3382, lon: -121.8863 },
  { name: 'Austin', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 2295000, lat: 30.2672, lon: -97.7431 },
  { name: 'San Francisco', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 3318000, lat: 37.7749, lon: -122.4194 },
  { name: 'Seattle', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 3439000, lat: 47.6062, lon: -122.3321 },
  { name: 'Denver', country: 'United States', countryCode: 'US', timezone: 'America/Denver', population: 2932000, lat: 39.7392, lon: -104.9903 },
  { name: 'Boston', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 4875000, lat: 42.3601, lon: -71.0589 },
  { name: 'Washington DC', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 5379000, lat: 38.9072, lon: -77.0369 },
  { name: 'Miami', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 6166000, lat: 25.7617, lon: -80.1918 },
  { name: 'Atlanta', country: 'United States', countryCode: 'US', timezone: 'America/New_York', population: 5286000, lat: 33.7490, lon: -84.3880 },
  { name: 'Detroit', country: 'United States', countryCode: 'US', timezone: 'America/Detroit', population: 3506000, lat: 42.3314, lon: -83.0458 },
  { name: 'Minneapolis', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', population: 2968000, lat: 44.9778, lon: -93.2650 },
  { name: 'Portland', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', population: 2472000, lat: 45.5152, lon: -122.6784 },
  { name: 'Toronto', country: 'Canada', countryCode: 'CA', timezone: 'America/Toronto', population: 6255000, lat: 43.6532, lon: -79.3832 },
  { name: 'Vancouver', country: 'Canada', countryCode: 'CA', timezone: 'America/Vancouver', population: 2581000, lat: 49.2827, lon: -123.1207 },
  { name: 'Montreal', country: 'Canada', countryCode: 'CA', timezone: 'America/Montreal', population: 4098000, lat: 45.5017, lon: -73.5673 },
  { name: 'Calgary', country: 'Canada', countryCode: 'CA', timezone: 'America/Edmonton', population: 1392000, lat: 51.0447, lon: -114.0719 },
  { name: 'Ottawa', country: 'Canada', countryCode: 'CA', timezone: 'America/Toronto', population: 1393000, lat: 45.4215, lon: -75.6972 },
  { name: 'Mexico City', country: 'Mexico', countryCode: 'MX', timezone: 'America/Mexico_City', population: 21782000, lat: 19.4326, lon: -99.1332 },
  { name: 'Sao Paulo', country: 'Brazil', countryCode: 'BR', timezone: 'America/Sao_Paulo', population: 22043000, lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR', timezone: 'America/Sao_Paulo', population: 13458000, lat: -22.9068, lon: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', timezone: 'America/Argentina/Buenos_Aires', population: 15154000, lat: -34.6037, lon: -58.3816 },
  { name: 'Lima', country: 'Peru', countryCode: 'PE', timezone: 'America/Lima', population: 10883000, lat: -12.0464, lon: -77.0428 },
  { name: 'Bogota', country: 'Colombia', countryCode: 'CO', timezone: 'America/Bogota', population: 10978000, lat: 4.7110, lon: -74.0721 },
  { name: 'Santiago', country: 'Chile', countryCode: 'CL', timezone: 'America/Santiago', population: 6767000, lat: -33.4489, lon: -70.6693 },

  // Europe
  { name: 'London', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', population: 9002000, lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', population: 10901000, lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', population: 3645000, lat: 52.5200, lon: 13.4050 },
  { name: 'Madrid', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', population: 6642000, lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', population: 4257000, lat: 41.9028, lon: 12.4964 },
  { name: 'Moscow', country: 'Russia', countryCode: 'RU', timezone: 'Europe/Moscow', population: 12506000, lat: 55.7558, lon: 37.6173 },
  { name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', timezone: 'Europe/Amsterdam', population: 1140000, lat: 52.3676, lon: 4.9041 },
  { name: 'Barcelona', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', population: 5575000, lat: 41.3851, lon: 2.1734 },
  { name: 'Munich', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', population: 1472000, lat: 48.1351, lon: 11.5820 },
  { name: 'Milan', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', population: 3140000, lat: 45.4642, lon: 9.1900 },
  { name: 'Vienna', country: 'Austria', countryCode: 'AT', timezone: 'Europe/Vienna', population: 1897000, lat: 48.2082, lon: 16.3738 },
  { name: 'Prague', country: 'Czech Republic', countryCode: 'CZ', timezone: 'Europe/Prague', population: 1309000, lat: 50.0755, lon: 14.4378 },
  { name: 'Warsaw', country: 'Poland', countryCode: 'PL', timezone: 'Europe/Warsaw', population: 1790000, lat: 52.2297, lon: 21.0122 },
  { name: 'Budapest', country: 'Hungary', countryCode: 'HU', timezone: 'Europe/Budapest', population: 1759000, lat: 47.4979, lon: 19.0402 },
  { name: 'Stockholm', country: 'Sweden', countryCode: 'SE', timezone: 'Europe/Stockholm', population: 1632000, lat: 59.3293, lon: 18.0686 },
  { name: 'Copenhagen', country: 'Denmark', countryCode: 'DK', timezone: 'Europe/Copenhagen', population: 1346000, lat: 55.6761, lon: 12.5683 },
  { name: 'Oslo', country: 'Norway', countryCode: 'NO', timezone: 'Europe/Oslo', population: 1041000, lat: 59.9139, lon: 10.7522 },
  { name: 'Helsinki', country: 'Finland', countryCode: 'FI', timezone: 'Europe/Helsinki', population: 1292000, lat: 60.1699, lon: 24.9384 },
  { name: 'Zurich', country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', population: 1395000, lat: 47.3769, lon: 8.5417 },
  { name: 'Brussels', country: 'Belgium', countryCode: 'BE', timezone: 'Europe/Brussels', population: 2080000, lat: 50.8503, lon: 4.3517 },
  { name: 'Dublin', country: 'Ireland', countryCode: 'IE', timezone: 'Europe/Dublin', population: 1228000, lat: 53.3498, lon: -6.2603 },
  { name: 'Lisbon', country: 'Portugal', countryCode: 'PT', timezone: 'Europe/Lisbon', population: 2942000, lat: 38.7223, lon: -9.1393 },
  { name: 'Athens', country: 'Greece', countryCode: 'GR', timezone: 'Europe/Athens', population: 3154000, lat: 37.9838, lon: 23.7275 },
  { name: 'Edinburgh', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', population: 530000, lat: 55.9533, lon: -3.1883 },
  { name: 'Manchester', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', population: 2730000, lat: 53.4808, lon: -2.2426 },
  { name: 'Frankfurt', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', population: 753000, lat: 50.1109, lon: 8.6821 },
  { name: 'Hamburg', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', population: 1899000, lat: 53.5511, lon: 9.9937 },
  { name: 'Reykjavik', country: 'Iceland', countryCode: 'IS', timezone: 'Atlantic/Reykjavik', population: 131000, lat: 64.1466, lon: -21.9426 },
  { name: 'Kiev', country: 'Ukraine', countryCode: 'UA', timezone: 'Europe/Kiev', population: 2952000, lat: 50.4501, lon: 30.5234 },
  { name: 'Istanbul', country: 'Turkey', countryCode: 'TR', timezone: 'Europe/Istanbul', population: 15460000, lat: 41.0082, lon: 28.9784 },

  // Africa
  { name: 'Cairo', country: 'Egypt', countryCode: 'EG', timezone: 'Africa/Cairo', population: 20900000, lat: 30.0444, lon: 31.2357 },
  { name: 'Lagos', country: 'Nigeria', countryCode: 'NG', timezone: 'Africa/Lagos', population: 14862000, lat: 6.5244, lon: 3.3792 },
  { name: 'Kinshasa', country: 'DR Congo', countryCode: 'CD', timezone: 'Africa/Kinshasa', population: 14342000, lat: -4.4419, lon: 15.2663 },
  { name: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', timezone: 'Africa/Johannesburg', population: 5782000, lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', timezone: 'Africa/Johannesburg', population: 4618000, lat: -33.9249, lon: 18.4241 },
  { name: 'Nairobi', country: 'Kenya', countryCode: 'KE', timezone: 'Africa/Nairobi', population: 4734000, lat: -1.2921, lon: 36.8219 },
  { name: 'Casablanca', country: 'Morocco', countryCode: 'MA', timezone: 'Africa/Casablanca', population: 3752000, lat: 33.5731, lon: -7.5898 },
  { name: 'Accra', country: 'Ghana', countryCode: 'GH', timezone: 'Africa/Accra', population: 2557000, lat: 5.6037, lon: -0.1870 },
  { name: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET', timezone: 'Africa/Addis_Ababa', population: 3604000, lat: 8.9806, lon: 38.7578 },

  // Oceania
  { name: 'Sydney', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Sydney', population: 5312000, lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Melbourne', population: 5078000, lat: -37.8136, lon: 144.9631 },
  { name: 'Brisbane', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Brisbane', population: 2514000, lat: -27.4698, lon: 153.0251 },
  { name: 'Perth', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Perth', population: 2085000, lat: -31.9505, lon: 115.8605 },
  { name: 'Auckland', country: 'New Zealand', countryCode: 'NZ', timezone: 'Pacific/Auckland', population: 1657000, lat: -36.8509, lon: 174.7645 },
  { name: 'Wellington', country: 'New Zealand', countryCode: 'NZ', timezone: 'Pacific/Auckland', population: 418000, lat: -41.2865, lon: 174.7762 },
  { name: 'Adelaide', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Adelaide', population: 1345000, lat: -34.9285, lon: 138.6007 },
  { name: 'Honolulu', country: 'United States', countryCode: 'US', timezone: 'Pacific/Honolulu', population: 980000, lat: 21.3069, lon: -157.8583 },
];

/**
 * Search cities by name with fuzzy matching
 * Returns results sorted by relevance (exact prefix matches first, then by population)
 */
export function searchCities(query: string, limit = 10): WorldCity[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  // Score each city based on match quality
  const scored = WORLD_CITIES.map(city => {
    const name = city.name.toLowerCase();
    const country = city.country.toLowerCase();

    let score = 0;

    // Exact match on name
    if (name === normalizedQuery) {
      score = 1000;
    }
    // Name starts with query (prefix match)
    else if (name.startsWith(normalizedQuery)) {
      score = 500 + (100 - normalizedQuery.length); // Shorter queries rank higher
    }
    // Word in name starts with query
    else if (name.split(' ').some(word => word.startsWith(normalizedQuery))) {
      score = 300;
    }
    // Name contains query
    else if (name.includes(normalizedQuery)) {
      score = 200;
    }
    // Country matches
    else if (country.startsWith(normalizedQuery) || country.includes(normalizedQuery)) {
      score = 100;
    }

    // Add population bonus for tie-breaking (normalized to 0-50 range)
    if (score > 0) {
      score += Math.min(50, city.population / 500000);
    }

    return { city, score };
  });

  // Filter and sort
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ city }) => city);
}

/**
 * Convert WorldCity to the City format used in the finder page
 */
export function worldCityToCity(city: WorldCity): {
  id: string;
  name: string;
  country: string;
  timezone: string;
  flag: string;
} {
  return {
    id: city.name.toLowerCase().replace(/\s+/g, '-'),
    name: city.name,
    country: city.country,
    timezone: city.timezone,
    flag: countryToFlag(city.countryCode),
  };
}
