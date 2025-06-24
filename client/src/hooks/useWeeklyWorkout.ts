import * as React from 'react';

interface WeeklyWorkout {
  id: number;
  week_start_date: string;
  title: string;
  workout_type: string | null;
  description: string | null;
  video_url: string | null;
  exercises_json: string | null;
  is_active: number;
}

export function useWeeklyWorkout() {
  const [weeklyWorkout, setWeeklyWorkout] = React.useState<WeeklyWorkout | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWeeklyWorkout = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weekly-workout');
      if (!response.ok) throw new Error('Failed to fetch weekly workout');
      const data = await response.json();
      setWeeklyWorkout(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWeeklyWorkout();
  }, [fetchWeeklyWorkout]);

  return {
    weeklyWorkout,
    loading,
    error,
    refetch: fetchWeeklyWorkout,
  };
}
