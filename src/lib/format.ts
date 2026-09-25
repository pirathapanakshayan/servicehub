const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as "LKR 4,500.00". Accepts numbers or decimal strings. */
export function formatPrice(value: number | string): string {
  return `LKR ${priceFormatter.format(Number(value))}`;
}

/** Formats minutes as "45 min", "1 hr", "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date-only "YYYY-MM-DD" string as "Thu, 24 Sep 2026". */
export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

/** Formats "HH:mm" (24h) as "2:30 PM". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h! >= 12 ? "PM" : "AM";
  return `${h! % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Colombo",
});

/** Formats an ISO timestamp in Sri Lanka time, e.g. "24 Sep 2026, 2:30 pm". */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
