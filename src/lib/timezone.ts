const TZ_KEY = "critiqs-tz";
const TZ_EVENT = "critiqs:timezone-changed";

export function getStoredTimezone(): string {
  try {
    const v = localStorage.getItem(TZ_KEY);
    if (v) return v;
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function setStoredTimezone(tz: string) {
  localStorage.setItem(TZ_KEY, tz);
  window.dispatchEvent(new CustomEvent(TZ_EVENT, { detail: tz }));
}

export function getOffsetLabel(tz: string, now = new Date()): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const parts = dtf.formatToParts(now);
    const off = parts.find(p => p.type === "timeZoneName")?.value || "";
    return off.replace("GMT", "GMT") || "GMT";
  } catch { return "GMT"; }
}

export function formatTimeInTz(tz: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(now);
  } catch { return ""; }
}

export function getHourInTz(tz: string, now = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now);
    return parseInt(h, 10) || 0;
  } catch { return now.getHours(); }
}

export type TimeBand = { id: "night" | "morning" | "day" | "evening"; hsl: string; label: string; emoji: string };

export function timeOfDayBand(tz: string, now = new Date()): TimeBand {
  const h = getHourInTz(tz, now);
  if (h >= 21 || h < 5)  return { id: "night",   hsl: "215 70% 60%", label: "Night",     emoji: "🌙" };
  if (h < 11)            return { id: "morning", hsl: "200 80% 70%", label: "Morning",   emoji: "🌅" };
  if (h < 17)            return { id: "day",     hsl: "45 85% 60%",  label: "Afternoon", emoji: "☀️" };
  return                       { id: "evening", hsl: "30 80% 60%",  label: "Evening",   emoji: "🌇" };
}

export const TZ_EVENT_NAME = TZ_EVENT;

export const TIMEZONE_LIST: { tz: string; label: string; country: string }[] = [
  { tz: "Pacific/Honolulu", label: "Honolulu", country: "USA" },
  { tz: "America/Anchorage", label: "Anchorage", country: "USA" },
  { tz: "America/Los_Angeles", label: "Los Angeles", country: "USA" },
  { tz: "America/Denver", label: "Denver", country: "USA" },
  { tz: "America/Chicago", label: "Chicago", country: "USA" },
  { tz: "America/New_York", label: "New York", country: "USA" },
  { tz: "America/Toronto", label: "Toronto", country: "Canada" },
  { tz: "America/Mexico_City", label: "Mexico City", country: "Mexico" },
  { tz: "America/Sao_Paulo", label: "São Paulo", country: "Brazil" },
  { tz: "America/Argentina/Buenos_Aires", label: "Buenos Aires", country: "Argentina" },
  { tz: "Atlantic/Reykjavik", label: "Reykjavik", country: "Iceland" },
  { tz: "Europe/London", label: "London", country: "UK" },
  { tz: "Europe/Lisbon", label: "Lisbon", country: "Portugal" },
  { tz: "Europe/Paris", label: "Paris", country: "France" },
  { tz: "Europe/Berlin", label: "Berlin", country: "Germany" },
  { tz: "Europe/Madrid", label: "Madrid", country: "Spain" },
  { tz: "Europe/Rome", label: "Rome", country: "Italy" },
  { tz: "Europe/Amsterdam", label: "Amsterdam", country: "Netherlands" },
  { tz: "Europe/Stockholm", label: "Stockholm", country: "Sweden" },
  { tz: "Europe/Athens", label: "Athens", country: "Greece" },
  { tz: "Europe/Istanbul", label: "Istanbul", country: "Turkey" },
  { tz: "Europe/Moscow", label: "Moscow", country: "Russia" },
  { tz: "Africa/Cairo", label: "Cairo", country: "Egypt" },
  { tz: "Africa/Lagos", label: "Lagos", country: "Nigeria" },
  { tz: "Africa/Johannesburg", label: "Johannesburg", country: "South Africa" },
  { tz: "Africa/Nairobi", label: "Nairobi", country: "Kenya" },
  { tz: "Asia/Jerusalem", label: "Jerusalem", country: "Israel" },
  { tz: "Asia/Riyadh", label: "Riyadh", country: "Saudi Arabia" },
  { tz: "Asia/Dubai", label: "Dubai", country: "UAE" },
  { tz: "Asia/Tehran", label: "Tehran", country: "Iran" },
  { tz: "Asia/Karachi", label: "Karachi", country: "Pakistan" },
  { tz: "Asia/Kolkata", label: "Mumbai / Delhi", country: "India" },
  { tz: "Asia/Dhaka", label: "Dhaka", country: "Bangladesh" },
  { tz: "Asia/Bangkok", label: "Bangkok", country: "Thailand" },
  { tz: "Asia/Jakarta", label: "Jakarta", country: "Indonesia" },
  { tz: "Asia/Singapore", label: "Singapore", country: "Singapore" },
  { tz: "Asia/Hong_Kong", label: "Hong Kong", country: "Hong Kong" },
  { tz: "Asia/Shanghai", label: "Shanghai", country: "China" },
  { tz: "Asia/Taipei", label: "Taipei", country: "Taiwan" },
  { tz: "Asia/Manila", label: "Manila", country: "Philippines" },
  { tz: "Asia/Seoul", label: "Seoul", country: "South Korea" },
  { tz: "Asia/Tokyo", label: "Tokyo", country: "Japan" },
  { tz: "Australia/Perth", label: "Perth", country: "Australia" },
  { tz: "Australia/Sydney", label: "Sydney", country: "Australia" },
  { tz: "Pacific/Auckland", label: "Auckland", country: "New Zealand" },
  { tz: "UTC", label: "UTC", country: "—" },
];