import * as React from 'react';

interface DailyWorkout {
  id: number;
  workout_date: string;
  title: string;
  description: string | null;
  exercises_json: string | null;
  video_url: string | null;
  is_active: number;
}

export function useDailyWorkout() {
  const [dailyWorkout, setDailyWorkout] = React.useState<DailyWorkout | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDailyWorkout = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-workout');
      if (!response.ok) throw new Error('Failed to fetch daily workout');
      const data = await response.json();
      setDailyWorkout(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDailyWorkout();
  }, [fetchDailyWorkout]);

  return {
    dailyWorkout,
    loading,
    error,
    refetch: fetchDailyWorkout,
  };
}