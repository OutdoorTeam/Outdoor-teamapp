import * as React from 'react';
import { useDailyWorkout } from '../../hooks/useDailyWorkout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Play, Users } from 'lucide-react';
import { format } from 'date-fns';

export function DailyWorkoutView() {
  const { dailyWorkout, loading, error } = useDailyWorkout();

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando entrenamiento del día...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Error: {error}</div>;
  }

  if (!dailyWorkout) {
    return (
      <Card className="bg-card border-border border-2">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-medium mb-2 text-foreground">Sin entrenamiento del día</h3>
          <p className="text-muted-foreground text-lg">
            No hay entrenamiento programado para hoy. ¡Revisa mañana!
          </p>
        </CardContent>
      </Card>
    );
  }

  const exercises = dailyWorkout.exercises_json ? JSON.parse(dailyWorkout.exercises_json) : [];

  return (
    <Card className="bg-card border-border border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Entrenamiento del Día
          </CardTitle>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(), 'dd/MM/yyyy')}
          </div>
        </div>
        <div className="text-xl text-primary font-bold">{dailyWorkout.title}</div>
        {dailyWorkout.description && (
          <p className="text-muted-foreground text-lg">{dailyWorkout.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Lista de ejercicios */}
        {exercises.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-bold text-foreground text-lg">Ejercicios:</h4>
            <div className="grid gap-4">
              {exercises.map((exercise: any, index: number) => (
                <div key={index} className="p-4 bg-background/80 rounded-lg border-2 border-primary/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-bold text-foreground text-lg">{exercise.name}</h5>
                      {exercise.description && (
                        <p className="text-muted-foreground mt-1">{exercise.description}</p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        {exercise.sets && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{exercise.sets}</div>
                            <div className="text-sm text-muted-foreground">Series</div>
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{exercise.reps}</div>
                            <div className="text-sm text-muted-foreground">Repeticiones</div>
                          </div>
                        )}
                        {exercise.rest && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{exercise.rest}</div>
                            <div className="text-sm text-muted-foreground">Descanso</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video del entrenamiento */}
        {dailyWorkout.video_url && (
          <div className="text-center">
            <Button
              onClick={() => window.open(dailyWorkout.video_url!, '_blank')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
            >
              <Play className="h-5 w-5 mr-2" />
              Ver Video Completo
            </Button>
          </div>
        )}

        {/* Mensaje motivacional */}
        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 text-center">
          <h4 className="font-bold text-foreground text-lg mb-2">💪 ¡A entrenar!</h4>
          <p className="text-foreground">
            Este entrenamiento está diseñado para todos los niveles. Escucha a tu cuerpo y adapta la intensidad según tus capacidades.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}