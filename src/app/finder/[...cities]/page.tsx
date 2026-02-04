'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WORLD_CITIES, worldCityToCity } from '@/lib/cities-database';
import FairTimeFinder from '../page';

// This component handles URL-based city selection
// URL format: /finder/new-york/singapore/tokyo
export default function FinderWithCities() {
  const params = useParams();
  const [initialized, setInitialized] = useState(false);

  // Parse cities from URL and store in localStorage for the main component
  useEffect(() => {
    // One-time initialization from URL params - intentional pattern
    if (params.cities && !initialized) {
      const citySlugs = Array.isArray(params.cities)
        ? params.cities
        : [params.cities];

      // Find matching cities from our database
      const matchedCities = citySlugs
        .map((slug) => {
          const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
          const worldCity = WORLD_CITIES.find(
            (c) => c.name.toLowerCase() === normalizedSlug
          );
          return worldCity ? worldCityToCity(worldCity) : null;
        })
        .filter(Boolean);

      if (matchedCities.length > 0) {
        localStorage.setItem('clockalign-finder-cities', JSON.stringify(matchedCities));
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialized(true);
    }
  }, [params.cities, initialized]);

  // Render the main finder component
  // The main component handles its own state from localStorage
  return <FairTimeFinder />;
}
