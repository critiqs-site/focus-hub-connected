import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  name: string | null;
  interests: string[];
  onboarding_complete: boolean;
}

export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("name, interests, onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      setLoading(false);
      return;
    }

    if (!data || !data.onboarding_complete) {
      setNeedsOnboarding(true);
    } else {
      setProfile({
        name: data.name,
        interests: data.interests || [],
        onboarding_complete: data.onboarding_complete,
      });
      setNeedsOnboarding(false);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
    fetchProfile();
  };

  return { profile, loading, needsOnboarding, completeOnboarding };
};
