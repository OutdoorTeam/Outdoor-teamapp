import * as React from 'react';

interface ProfileStats {
  average_daily_steps: number;
  habits_completion_rate: number;
  weekly_total_points: number;
  weekly_habits_completed: number;
  weekly_meditation_sessions: number;
  current_streak: number;
}

interface Profile {
  id: number;
  name: string;
  email: string;
  age: number | null;
  objetivo: string | null;
  plan_name: string | null;
  subscription_end_date: string | null;
  stats: ProfileStats;
}

export function useProfile() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}