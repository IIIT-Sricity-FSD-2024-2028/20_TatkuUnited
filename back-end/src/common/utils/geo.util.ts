import { BadRequestException } from '@nestjs/common';

/**
 * Validates that coordinates are [longitude, latitude] in GeoJSON order:
 * - lng in [-180, 180]
 * - lat in [-90, 90]
 * - rejects [0, 0], NaN, and non-finite numbers
 */
export function isValidGeoCoordinates(
  coords: unknown,
): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  if (
    typeof lng !== 'number' ||
    typeof lat !== 'number' ||
    !Number.isFinite(lng) ||
    !Number.isFinite(lat)
  ) {
    return false;
  }
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return false;
  }
  if (lng === 0 && lat === 0) {
    return false;
  }
  return true;
}

export function assertValidGeoCoordinates(
  coords: unknown,
  context = 'location coordinates',
): [number, number] {
  if (!isValidGeoCoordinates(coords)) {
    throw new BadRequestException(
      `Invalid ${context}: expected [longitude, latitude] with lng in [-180, 180], lat in [-90, 90], and not [0, 0]`,
    );
  }
  return coords;
}

/** Great-circle distance in kilometres between two [lng, lat] points. */
export function haversineKm(
  a: [number, number],
  b: [number, number],
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
