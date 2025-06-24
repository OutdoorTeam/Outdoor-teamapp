import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coffee, Plus, Edit, Trash2, Save, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ActiveBreak {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  work_type: string | null;
  video_url: string | null;
  gif_url: string | null;
  instructions: string | null;
  is_active: number;
  display_order: number;
}

export function ActiveBreaksManager() {
  const [breaks, setBreaks] = React.useState<ActiveBreak[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingBreak, setEditingBreak] = React.useState<ActiveBreak | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const fetchBreaks = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/active-breaks');
      if (!response.ok) throw new Error('Failed to fetch active breaks');
      const data = await response.json();
      setBreaks(data);
    } catch (error) {
      console.error('Error fetching active breaks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBreaks();
  }, [fetchBreaks]);

  const handleSave = async (breakData: Partial<ActiveBreak>) => {
    try {
      const isEditing = editingBreak && editingBreak.id;
      const url = isEditing 
        ? `/api/admin/active-breaks/${editingBreak.id}`
        : '/api/admin/active-breaks';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(breakData),
      });

      if (!response.ok) throw new Error('Failed to save active break');
      
      setIsDialogOpen(false);
      setEditingBreak(null);
      fetchBreaks();
    } catch (error) {
      console.error('Error saving active break:', error);
    }
  };

  const handleDelete = async (breakId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pausa activa?')) return;
    
    try {
      const response = await fetch(`/api/admin/active-breaks/${breakId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete active break');
      fetchBreaks();
    } catch (error) {
      console.error('Error deleting active break:', error);
    }
  };

  const toggleStatus = async (breakItem: ActiveBreak) => {
    try {
      await handleSave({
        ...breakItem,
        is_active: breakItem.is_active ? 0 : 1
      });
    } catch (error) {
      console.error('Error toggling break status:', error);
    }
  };

  const BreakForm = ({ breakItem }: { breakItem?: ActiveBreak }) => {
    const [formData, setFormData] = React.useState({
      title: breakItem?.title || '',
      description: breakItem?.description || '',
      duration_minutes: breakItem?.duration_minutes || 5,
      work_type: breakItem?.work_type || 'general',
      video_url: breakItem?.video_url || '',
      gif_url: breakItem?.gif_url || '',
      instructions: breakItem?.instructions || '',
      is_active: breakItem?.is_active ?? 1,
      display_order: breakItem?.display_order || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <div>
          <Label htmlFor="description">Descripción breve</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-input border-border text-foreground"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="30"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 5 })}
              className="bg-input border-border text-foreground"
            />
          </div>
          
          <div>
            <Label htmlFor="workType">Tipo de trabajo</Label>
            <Select value={formData.work_type} onValueChange={(value) => setFormData({ ...formData, work_type: value })}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desk">Escritorio</SelectItem>
                <SelectItem value="standing">De pie</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        
        <div>
          <Label htmlFor="gifUrl">URL del GIF (opcional)</Label>
          <Input
            id="gifUrl"
            type="url"
            value={formData.gif_url}
            onChange={(e) => setFormData({ ...formData, gif_url: e.target.value })}
            placeholder="https://ejemplo.com/ejercicio.gif"
            className="bg-input border-border text-foreground"
          />
        </div>
        
        <div>
          <Label htmlFor="instructions">Instrucciones detalladas</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={5}
            placeholder="Describe paso a paso cómo realizar el ejercicio..."
            className="bg-input border-border text-foreground"
          />
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
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </form>
    );
  };

  const getWorkTypeBadge = (workType: string | null) => {
    const config = {
      desk: { label: 'Escritorio', className: 'bg-blue-600 text-white' },
      standing: { label: 'De pie', className: 'bg-green-600 text-white' },
      general: { label: 'General', className: 'bg-purple-600 text-white' }
    };
    
    const { label, className } = config[workType] || config.general;
    
    return (
      <Badge className={className}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando pausas activas...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            Gestión de Pausas Activas
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingBreak(null);
                  setIsDialogOpen(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Pausa Activa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingBreak ? 'Editar Pausa Activa' : 'Nueva Pausa Activa'}
                </DialogTitle>
              </DialogHeader>
              <BreakForm breakItem={editingBreak || undefined} />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/20 border-b-2 border-primary/30">
                <TableHead className="text-foreground font-bold">Título</TableHead>
                <TableHead className="text-foreground font-bold text-center">Tipo</TableHead>
                <TableHead className="text-foreground font-bold text-center">Duración</TableHead>
                <TableHead className="text-foreground font-bold text-center">Estado</TableHead>
                <TableHead className="text-foreground font-bold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breaks.map((breakItem, index) => (
                <TableRow
                  key={breakItem.id}
                  className={`
                    hover:bg-muted/50 transition-colors border-b border-border
                    ${index % 2 === 0 ? 'bg-card' : 'bg-background/30'}
                  `}
                >
                  <TableCell className="py-4">
                    <div>
                      <div className="font-medium text-foreground">{breakItem.title}</div>
                      {breakItem.description && (
                        <div className="text-sm text-muted-foreground">{breakItem.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {getWorkTypeBadge(breakItem.work_type)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span className="font-bold text-primary">
                      {breakItem.duration_minutes} min
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(breakItem)}
                      className={breakItem.is_active 
                        ? "text-green-400 hover:text-green-300" 
                        : "text-red-400 hover:text-red-300"
                      }
                    >
                      <Badge className={breakItem.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                        {breakItem.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      {breakItem.video_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(breakItem.video_url!, '_blank')}
                          className="text-primary hover:text-primary-foreground hover:bg-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBreak(breakItem);
                          setIsDialogOpen(true);
                        }}
                        className="text-primary hover:text-primary-foreground hover:bg-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(breakItem.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          Total de pausas activas: {breaks.length}
        </div>
      </CardContent>
    </Card>
  );
}