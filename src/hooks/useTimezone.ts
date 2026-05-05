import { useEffect, useState } from "react";
import { getStoredTimezone, TZ_EVENT_NAME } from "@/lib/timezone";

export function useTimezone() {
  const [tz, setTz] = useState<string>(() => getStoredTimezone());
  useEffect(() => {
    const handler = (e: Event) => {
      const v = (e as CustomEvent).detail as string;
      if (typeof v === "string") setTz(v);
      else setTz(getStoredTimezone());
    };
    window.addEventListener(TZ_EVENT_NAME, handler);
    return () => window.removeEventListener(TZ_EVENT_NAME, handler);
  }, []);
  return tz;
}