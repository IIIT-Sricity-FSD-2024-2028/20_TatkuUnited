import { BadRequestException } from '@nestjs/common';
import {
  addDaysToDateString,
  getISTDateAndMinutes,
  isValidCalendarDateString,
  parseAndValidateBookingDate,
} from './date.util';

describe('date.util', () => {
  describe('isValidCalendarDateString', () => {
    it('accepts valid YYYY-MM-DD dates', () => {
      expect(isValidCalendarDateString('2026-11-27')).toBe(true);
    });

    it('rejects invalid calendar dates like Feb 31 or 5-digit years', () => {
      expect(isValidCalendarDateString('2026-02-31')).toBe(false);
      expect(isValidCalendarDateString('2026-13-01')).toBe(false);
      expect(isValidCalendarDateString('30000-01-01')).toBe(false);
      expect(isValidCalendarDateString('not-a-date')).toBe(false);
    });
  });

  describe('parseAndValidateBookingDate', () => {
    it('accepts today and dates within the 3-day booking window', () => {
      const { istDateString } = getISTDateAndMinutes();
      const tomorrow = addDaysToDateString(istDateString, 1);
      const dayAfter = addDaysToDateString(istDateString, 2);

      expect(parseAndValidateBookingDate(istDateString, 3).dateString).toBe(
        istDateString,
      );
      expect(parseAndValidateBookingDate(tomorrow, 3).dateString).toBe(
        tomorrow,
      );
      expect(parseAndValidateBookingDate(dayAfter, 3).dateString).toBe(
        dayAfter,
      );
    });

    it('rejects past dates and far-future years like 3000', () => {
      const { istDateString } = getISTDateAndMinutes();
      const yesterday = addDaysToDateString(istDateString, -1);
      const tooFar = addDaysToDateString(istDateString, 3);

      expect(() => parseAndValidateBookingDate(yesterday, 3)).toThrow(
        BadRequestException,
      );
      expect(() => parseAndValidateBookingDate(tooFar, 3)).toThrow(
        BadRequestException,
      );
      expect(() => parseAndValidateBookingDate('3000-11-27', 3)).toThrow(
        BadRequestException,
      );
      expect(() =>
        parseAndValidateBookingDate('3000-11-27T00:00:00.000Z', 3),
      ).toThrow(BadRequestException);
    });
  });
});
