import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';
import { useWeeklyWorkout } from '../../hooks/useWeeklyWorkout';

export function WeeklyWorkout() {
  const { weeklyWorkout, loading, error } = useWeeklyWorkout();

  if (loading) {
    return (
      <Card className="bg-card border-border border-2">
        <CardContent className="p-8 text-center">
          <div className="text-foreground">Cargando entrenamiento semanal...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weeklyWorkout) {
    return (
      <Card className="bg-card border-border border-2">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">No hay entrenamiento semanal disponible</div>
        </CardContent>
      </Card>
    );
  }

  const exercises = weeklyWorkout.exercises_json ? JSON.parse(weeklyWorkout.exercises_json) : [];

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}`;
    }
    return null;
  };

  const mainVideoEmbedUrl = getYouTubeEmbedUrl(weeklyWorkout.video_url || '');

  return (
    <Card className="bg-card border-border border-2">
      <CardHeader>
        <CardTitle className="text-foreground text-2xl flex items-center gap-2">
          <Play className="h-6 w-6 text-primary" />
          Entrenamiento Semanal
        </CardTitle>
        {weeklyWorkout.description && (
          <p className="text-muted-foreground text-lg">{weeklyWorkout.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Workout Plan */}
          <div className="space-y-4">
            <div className="bg-background/80 rounded-lg p-6 border-2 border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-primary">{weeklyWorkout.title}</h3>
                {weeklyWorkout.workout_type && (
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {weeklyWorkout.workout_type}
                  </span>
                )}
              </div>
              
              {exercises.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-sm font-bold text-muted-foreground border-b border-border pb-2">
                    <div>Ejercicio</div>
                    <div className="text-center">Series</div>
                    <div className="text-center">Reps</div>
                    <div className="text-center">Descanso</div>
                  </div>
                  
                  {exercises.map((exercise: any, index: number) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center text-sm py-2 border-b border-border/50">
                      <div className="font-medium text-foreground">
                        {exercise.video_url ? (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => window.open(exercise.video_url, '_blank')}
                            className="p-0 h-auto text-primary hover:text-primary/80 text-left"
                          >
                            {exercise.name}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          exercise.name
                        )}
                      </div>
                      <div className="text-center text-primary font-bold">
                        {exercise.sets || '-'}
                      </div>
                      <div className="text-center text-primary font-bold">
                        {exercise.reps || '-'}
                      </div>
                      <div className="text-center text-primary font-bold">
                        {exercise.rest || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Video del Entrenamiento</h3>
            {mainVideoEmbedUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-primary/30">
                <iframe
                  src={mainVideoEmbedUrl}
                  title="Weekly Workout Video"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : weeklyWorkout.video_url ? (
              <div className="flex items-center justify-center aspect-video bg-background/50 rounded-lg border-2 border-border">
                <Button
                  onClick={() => window.open(weeklyWorkout.video_url!, '_blank')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Ver Video en YouTube
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-video bg-muted rounded-lg border-2 border-border">
                <div className="text-muted-foreground">Sin video disponible</div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 text-center">
          <h4 className="font-bold text-foreground text-lg mb-2">🔥 ¡Desafío Semanal!</h4>
          <p className="text-foreground">
            Completa este entrenamiento durante la semana y marca la diferencia en tu progreso. ¡Tú puedes!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
