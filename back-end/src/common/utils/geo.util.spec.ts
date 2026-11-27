import { BadRequestException } from '@nestjs/common';
import {
  assertValidGeoCoordinates,
  haversineKm,
  isValidGeoCoordinates,
} from './geo.util';

describe('geo.util', () => {
  it('accepts valid Chennai [lng, lat] coordinates', () => {
    expect(isValidGeoCoordinates([80.2707, 13.0827])).toBe(true);
    expect(assertValidGeoCoordinates([80.2707, 13.0827])).toEqual([
      80.2707, 13.0827,
    ]);
  });

  it('rejects [0, 0], out-of-range, and swapped lat/lng beyond 90', () => {
    expect(isValidGeoCoordinates([0, 0])).toBe(false);
    expect(isValidGeoCoordinates([13.0827, 95])).toBe(false);
    expect(isValidGeoCoordinates([185, 13])).toBe(false);
    expect(isValidGeoCoordinates([NaN, 13])).toBe(false);
    expect(() => assertValidGeoCoordinates([0, 0])).toThrow(
      BadRequestException,
    );
  });

  it('computes haversine distance accurately', () => {
    // Chennai to Bengaluru is ~290 km
    const dist = haversineKm([80.2707, 13.0827], [77.5946, 12.9716]);
    expect(dist).toBeGreaterThan(280);
    expect(dist).toBeLessThan(310);
  });
});
