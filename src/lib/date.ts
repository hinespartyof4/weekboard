export function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

export function toDateString({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getTodayInTimeZone(timeZone: string) {
  return toDateString(getDatePartsInTimeZone(new Date(), timeZone));
}

export function addDays(dateString: string, days: number) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function subtractDays(dateString: string, days: number) {
  return addDays(dateString, -days);
}

export function getWeekStartDate(dateString: string, weekStartsOn: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const utcDay = date.getUTCDay();
  const offset = (utcDay - weekStartsOn + 7) % 7;
  return subtractDays(dateString, offset);
}

export function formatShortDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  const normalizedValue = value.includes("T") ? value : `${value}T00:00:00Z`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(normalizedValue));
}
