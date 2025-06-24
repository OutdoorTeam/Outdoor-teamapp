import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Save, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DailyWorkout {
  id: number;
  workout_date: string;
  title: string;
  description: string | null;
  exercises_json: string | null;
  video_url: string | null;
  is_active: number;
}

interface Exercise {
  name: string;
  description?: string;
  sets?: string;
  reps?: string;
  rest?: string;
}

export function DailyWorkoutManager() {
  const [workouts, setWorkouts] = React.useState<DailyWorkout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingWorkout, setEditingWorkout] = React.useState<DailyWorkout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const fetchWorkouts = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/daily-workouts');
      if (!response.ok) throw new Error('Failed to fetch daily workouts');
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Error fetching daily workouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleSave = async (workoutData: Partial<DailyWorkout>) => {
    try {
      const isEditing = editingWorkout && editingWorkout.id;
      const url = isEditing 
        ? `/api/admin/daily-workouts/${editingWorkout.id}`
        : '/api/admin/daily-workouts';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) throw new Error('Failed to save daily workout');
      
      setIsDialogOpen(false);
      setEditingWorkout(null);
      fetchWorkouts();
    } catch (error) {
      console.error('Error saving daily workout:', error);
    }
  };

  const handleDelete = async (workoutId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) return;
    
    try {
      const response = await fetch(`/api/admin/daily-workouts/${workoutId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete daily workout');
      fetchWorkouts();
    } catch (error) {
      console.error('Error deleting daily workout:', error);
    }
  };

  const WorkoutForm = ({ workout }: { workout?: DailyWorkout }) => {
    const [formData, setFormData] = React.useState({
      workout_date: workout?.workout_date || new Date().toISOString().split('T')[0],
      title: workout?.title || '',
      description: workout?.description || '',
      video_url: workout?.video_url || '',
      is_active: workout?.is_active ?? 1,
    });

    const [exercises, setExercises] = React.useState<Exercise[]>(() => {
      if (workout?.exercises_json) {
        try {
          return JSON.parse(workout.exercises_json);
        } catch {
          return [];
        }
      }
      return [{ name: '', description: '', sets: '', reps: '', rest: '' }];
    });

    const addExercise = () => {
      setExercises([...exercises, { name: '', description: '', sets: '', reps: '', rest: '' }]);
    };

    const removeExercise = (index: number) => {
      setExercises(exercises.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, field: keyof Exercise, value: string) => {
      const updated = [...exercises];
      updated[index] = { ...updated[index], [field]: value };
      setExercises(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const validExercises = exercises.filter(ex => ex.name.trim());
      handleSave({
        ...formData,
        exercises_json: JSON.stringify(validExercises)
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={formData.workout_date}
              onChange={(e) => setFormData({ ...formData, workout_date: e.target.value })}
              required
              className="bg-input border-border text-foreground"
            />
          </div>
          
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="bg-input border-border text-foreground"
          />
        </div>
        
        <div>
          <Label htmlFor="videoUrl">URL de YouTube</Label>
          <Input
            id="videoUrl"
            type="url"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-input border-border text-foreground"
          />
        </div>

        {/* Ejercicios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg">Ejercicios</Label>
            <Button type="button" onClick={addExercise} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          {exercises.map((exercise, index) => (
            <div key={index} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Ejercicio {index + 1}</span>
                {exercises.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeExercise(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <Input
                  placeholder="Nombre del ejercicio"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  className="bg-input border-border text-foreground"
                />
                
                <Textarea
                  placeholder="Descripción (opcional)"
                  value={exercise.description || ''}
                  onChange={(e) => updateExercise(index, 'description', e.target.value)}
                  rows={2}
                  className="bg-input border-border text-foreground"
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Series"
                    value={exercise.sets || ''}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <Input
                    placeholder="Repeticiones"
                    value={exercise.reps || ''}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <Input
                    placeholder="Descanso"
                    value={exercise.rest || ''}
                    onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando entrenamientos...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Entrenamientos del Día
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingWorkout(null);
                  setIsDialogOpen(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Entrenamiento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingWorkout ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
                </DialogTitle>
              </DialogHeader>
              <WorkoutForm workout={editingWorkout || undefined} />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workouts.map((workout) => (
            <Card key={workout.id} className="bg-background/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-primary text-lg">{workout.title}</div>
                      <div className="text-sm text-muted-foreground">{workout.workout_date}</div>
                    </div>
                    {workout.description && (
                      <div className="text-muted-foreground mt-1">{workout.description}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingWorkout(workout);
                        setIsDialogOpen(true);
                      }}
                      className="text-primary hover:text-primary-foreground hover:bg-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(workout.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {workouts.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay entrenamientos configurados
              </h3>
              <p className="text-muted-foreground">
                Agrega entrenamientos del día para que los usuarios puedan verlos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}