export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isStrictCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
  );
}

export function isDateInRange(value: string, min?: string, max?: string): boolean {
  if (!isStrictCalendarDate(value)) {
    return false;
  }
  if (min && value < min) {
    return false;
  }
  if (max && value > max) {
    return false;
  }
  return true;
}
