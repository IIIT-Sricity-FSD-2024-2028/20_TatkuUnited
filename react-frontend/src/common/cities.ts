export interface CityOption {
  name: string;
  state: string;
  /** GeoJSON [longitude, latitude] */
  coordinates: [number, number];
  regionId?: string;
}

export const SUPPORTED_CITIES: CityOption[] = [
  { name: "Bengaluru", state: "Karnataka", coordinates: [77.5946, 12.9716] },
  { name: "Chennai", state: "Tamil Nadu", coordinates: [80.2707, 13.0827] },
  { name: "Hyderabad", state: "Telangana", coordinates: [78.4867, 17.385] },
  { name: "Sri City", state: "Andhra Pradesh", coordinates: [80.027, 13.556] },
  { name: "Mumbai", state: "Maharashtra", coordinates: [72.8777, 19.076] },
  { name: "Delhi", state: "Delhi", coordinates: [77.209, 28.6139] },
  { name: "Pune", state: "Maharashtra", coordinates: [73.8567, 18.5204] },
  { name: "Kolkata", state: "West Bengal", coordinates: [88.3639, 22.5726] },
  { name: "Ahmedabad", state: "Gujarat", coordinates: [72.5714, 23.0225] },
  { name: "Jaipur", state: "Rajasthan", coordinates: [75.7873, 26.9124] },
  { name: "Kochi", state: "Kerala", coordinates: [76.2673, 9.9312] },
  { name: "Coimbatore", state: "Tamil Nadu", coordinates: [76.9558, 11.0168] },
  { name: "Visakhapatnam", state: "Andhra Pradesh", coordinates: [83.2185, 17.6868] },
  { name: "Tirupati", state: "Andhra Pradesh", coordinates: [79.4192, 13.6288] },
  { name: "Mysuru", state: "Karnataka", coordinates: [76.6394, 12.2958] },
  { name: "Chandigarh", state: "Chandigarh", coordinates: [76.7794, 30.7333] },
  { name: "Gurugram", state: "Haryana", coordinates: [77.0266, 28.4595] },
  { name: "Noida", state: "Uttar Pradesh", coordinates: [77.391, 28.5355] },
];

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  "bengaluru urban": "Bengaluru",
  madras: "Chennai",
  bombay: "Mumbai",
  "new delhi": "Delhi",
  calcutta: "Kolkata",
  mysore: "Mysuru",
  gurgaon: "Gurugram",
  vizag: "Visakhapatnam",
  cochin: "Kochi",
};

export function findCityByName(name?: string | null): CityOption | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;

  const aliasTarget = CITY_ALIASES[normalized];
  if (aliasTarget) {
    return SUPPORTED_CITIES.find((c) => c.name === aliasTarget);
  }

  return SUPPORTED_CITIES.find((c) => c.name.toLowerCase() === normalized);
}

/**
 * Returns the nearest supported city for a given [lng, lat] coordinate pair.
 */
export function findNearestCity(coordinates: [number, number]): CityOption {
  const [lng, lat] = coordinates;
  let best = SUPPORTED_CITIES[0];
  let bestDist = Number.POSITIVE_INFINITY;

  for (const city of SUPPORTED_CITIES) {
    const dLng = city.coordinates[0] - lng;
    const dLat = city.coordinates[1] - lat;
    const dist = dLng * dLng + dLat * dLat;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }

  return best;
}
