/**
 * Generates a short unique ID without any external dependency.
 * Format: 8 alphanumeric characters.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns today's date as an ISO date string "YYYY-MM-DD"
 */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the current month as "YYYY-MM"
 */
export function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Formats a number as Indian currency  e.g. ₹1,23,456
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `₹${k.toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string for display  e.g. "11 Oct"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Returns the number of spending days remaining in the given month, including today.
 * On the final day of the month, exactly 1 spending day remains.
 * @param month "YYYY-MM"
 * @param customDay Optional day of month override (1-31) for deterministic testing
 */
export function remainingDaysInMonth(month: string, customDay?: number): number {
  const today = new Date();
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate(); // last day of month
  const currentDay = customDay !== undefined
    ? customDay
    : (today.getFullYear() === year && today.getMonth() + 1 === mon ? today.getDate() : 1);

  if (currentDay > lastDay) return 0;
  return Math.max(lastDay - currentDay + 1, 0);
}

/**
 * Returns the total days in the given month.
 * @param month "YYYY-MM"
 */
export function daysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns true if the given ISO date string is in the past.
 */
export function isPast(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString());
}

/**
 * Returns the day-of-month for an ISO date string.
 */
export function dayOfMonth(dateStr: string): number {
  return parseInt(dateStr.split('-')[2], 10);
}
