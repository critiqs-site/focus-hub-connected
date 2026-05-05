import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const HOURLY_LIMIT = 14000;

function currentHourBucketISO(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

export function useAiUsage(userId?: string) {
  const [used, setUsed] = useState(0);
  const [carry, setCarry] = useState(0); // negative carry from previous hour
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const bucket = currentHourBucketISO();
    const prevBucket = new Date(new Date(bucket).getTime() - 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("ai_usage")
      .select("hour_bucket, chars_used")
      .eq("user_id", userId)
      .in("hour_bucket", [bucket, prevBucket]);
    let now = 0, prev = 0;
    for (const r of data || []) {
      if (r.hour_bucket === bucket) now = r.chars_used;
      else prev = r.chars_used;
    }
    const prevOver = Math.max(0, prev - HOURLY_LIMIT);
    setUsed(now);
    setCarry(prevOver);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 30000);
    return () => clearInterval(i);
  }, [refresh]);

  const remaining = HOURLY_LIMIT - used - carry;
  return { used, carry, remaining, limit: HOURLY_LIMIT, loading, refresh };
}