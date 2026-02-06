/**
 * Cairo timezone utilities (Africa/Cairo, GMT+2)
 */

const CAIRO_TIMEZONE = 'Africa/Cairo';

/**
 * Format a UTC date string to Cairo time display
 */
export function formatCairoDateTime(utcDateStr: string): string {
  const date = new Date(utcDateStr);
  return date.toLocaleString('en-US', {
    timeZone: CAIRO_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a UTC date string to Cairo time (time only)
 */
export function formatCairoTime(utcDateStr: string): string {
  const date = new Date(utcDateStr);
  return date.toLocaleString('en-US', {
    timeZone: CAIRO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a UTC date string to Cairo date only
 */
export function formatCairoDate(utcDateStr: string): string {
  const date = new Date(utcDateStr);
  return date.toLocaleString('en-US', {
    timeZone: CAIRO_TIMEZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Convert local Cairo date+time inputs to UTC ISO string.
 * Takes date string (YYYY-MM-DD) and time string (HH:MM) interpreted as Cairo time.
 */
export function cairoToUTC(dateStr: string, timeStr: string): string {
  // Create a date string that we interpret as Cairo time
  // Cairo is UTC+2 (no DST currently observed in Egypt)
  const cairoOffset = 2; // hours
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create UTC date by subtracting Cairo offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - cairoOffset, minutes));
  return utcDate.toISOString();
}

/**
 * Get current time in Cairo as a formatted string
 */
export function getCairoNow(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: CAIRO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
