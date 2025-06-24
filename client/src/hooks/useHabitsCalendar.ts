import * as React from 'react';
import { format, subDays } from 'date-fns';

interface HabitsCalendarData {
  [date: string]: number; // fecha -> número de hábitos completados
}

export function useHabitsCalendar() {
  const [habitsData, setHabitsData] = React.useState<HabitsCalendarData>({});
  const [loading, setLoading] = React.useState(true);

  const fetchHabitsData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener datos de los últimos 60 días para cubrir 2 meses del calendario
      const endDate = new Date();
      const startDate = subDays(endDate, 60);
      
      const response = await fetch(`/api/habits/calendar?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch habits calendar data');
      
      const data = await response.json();
      setHabitsData(data);
    } catch (error) {
      console.error('Error fetching habits calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHabitsData();
  }, [fetchHabitsData]);

  return {
    habitsData,
    loading,
    refetch: fetchHabitsData,
  };
}
