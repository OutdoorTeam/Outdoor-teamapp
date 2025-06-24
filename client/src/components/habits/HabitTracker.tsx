import * as React from 'react';
import { useHabits } from '../../hooks/useHabits';
import { HabitItem } from './HabitItem';
import { Button } from '@/components/ui/button';

export function HabitTracker() {
  const { habits, loading, error, toggleHabit, initializeHabits } = useHabits();

  React.useEffect(() => {
    initializeHabits();
  }, [initializeHabits]);

  if (loading) {
    return <div className="text-center py-4 text-foreground">Cargando hábitos...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-destructive">Error: {error}</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No tienes hábitos configurados</p>
        <Button 
          onClick={initializeHabits}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Configurar Hábitos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          onToggle={toggleHabit}
        />
      ))}
    </div>
  );
}
