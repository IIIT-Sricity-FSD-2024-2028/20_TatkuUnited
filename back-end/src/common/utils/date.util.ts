import { BadRequestException } from '@nestjs/common';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns the current IST (UTC+05:30) calendar date string (YYYY-MM-DD)
 * and minutes elapsed since IST midnight.
 */
export function getISTDateAndMinutes(now: Date = new Date()) {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 330 * 60000);
  const istDateString = ist.toISOString().slice(0, 10);
  const istMinutes = ist.getHours() * 60 + ist.getMinutes();
  return { istDateString, istMinutes };
}

/**
 * Validates that a string is a real YYYY-MM-DD calendar date.
 */
export function isValidCalendarDateString(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Adds `days` calendar days to a valid YYYY-MM-DD string and returns YYYY-MM-DD.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Extracts and validates a booking date (YYYY-MM-DD or ISO timestamp) against
 * the current IST date and the configured bookingWindowDays (inclusive, today = day 1).
 */
export function parseAndValidateBookingDate(
  input: string | Date,
  bookingWindowDays = 3,
): { dateString: string; targetDate: Date; weekday: number } {
  let dateString: string;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new BadRequestException('Invalid scheduledDate');
    }
    dateString = input.toISOString().slice(0, 10);
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (DATE_RE.test(trimmed)) {
      dateString = trimmed;
    } else {
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(
          'Invalid date format. Expected YYYY-MM-DD or ISO-8601 date string',
        );
      }
      dateString = parsed.toISOString().slice(0, 10);
    }
  } else {
    throw new BadRequestException('Invalid date format');
  }

  if (!isValidCalendarDateString(dateString)) {
    throw new BadRequestException('Invalid calendar date');
  }

  const { istDateString } = getISTDateAndMinutes();
  const windowDays = Math.max(1, Math.floor(bookingWindowDays || 3));
  const maxDateString = addDaysToDateString(istDateString, windowDays - 1);

  if (dateString < istDateString) {
    throw new BadRequestException('Scheduled date cannot be in the past');
  }
  if (dateString > maxDateString) {
    throw new BadRequestException(
      `Bookings are only allowed within ${windowDays} days (${istDateString} to ${maxDateString})`,
    );
  }

  const [y, m, d] = dateString.split('-').map(Number);
  const targetDate = new Date(`${dateString}T00:00:00.000Z`);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  return { dateString, targetDate, weekday };
}
