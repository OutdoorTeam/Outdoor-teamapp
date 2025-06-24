import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PlanConfig {
  id: number;
  name: string;
  description: string;
  price: number;
  benefits: string[];
  is_active: number;
  display_order: number;
}

export function PlanConfigManager() {
  const [plans, setPlans] = React.useState<PlanConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingPlan, setEditingPlan] = React.useState<PlanConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const fetchPlans = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/plan-configs');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSave = async (planData: Partial<PlanConfig>) => {
    try {
      const isEditing = editingPlan && editingPlan.id;
      const url = isEditing 
        ? `/api/admin/plan-configs/${editingPlan.id}`
        : '/api/admin/plan-configs';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (!response.ok) throw new Error('Failed to save plan');
      
      setIsDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan?')) return;
    
    try {
      const response = await fetch(`/api/admin/plan-configs/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete plan');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const togglePlanStatus = async (plan: PlanConfig) => {
    try {
      await handleSave({
        ...plan,
        is_active: plan.is_active ? 0 : 1
      });
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  const PlanForm = ({ plan }: { plan?: PlanConfig }) => {
    const [formData, setFormData] = React.useState({
      name: plan?.name || '',
      description: plan?.description || '',
      price: plan?.price || 0,
      benefits: plan?.benefits || [],
      is_active: plan?.is_active ?? 1,
      display_order: plan?.display_order || 0,
    });

    const [benefitsText, setBenefitsText] = React.useState(
      plan?.benefits?.join('\n') || ''
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const benefits = benefitsText.split('\n').filter(b => b.trim());
      handleSave({ ...formData, benefits });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre del Plan</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-input border-border text-foreground"
            />
          </div>
          
          <div>
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
            rows={3}
            className="bg-input border-border text-foreground"
          />
        </div>
        
        <div>
          <Label htmlFor="displayOrder">Orden de visualización</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            className="bg-input border-border text-foreground"
          />
        </div>
        
        <div>
          <Label htmlFor="benefits">Beneficios (uno por línea)</Label>
          <Textarea
            id="benefits"
            value={benefitsText}
            onChange={(e) => setBenefitsText(e.target.value)}
            rows={8}
            placeholder="Rutinas de entrenamiento personalizadas&#10;Seguimiento de hábitos diarios&#10;Contador de pasos integrado&#10;Plan nutricional completo&#10;Sesiones de meditación guiada"
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

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando configuración...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configuración de Planes
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingPlan(null);
                  setIsDialogOpen(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
                </DialogTitle>
              </DialogHeader>
              <PlanForm plan={editingPlan || undefined} />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-background/50 border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlanStatus(plan)}
                      className="h-8 w-8 p-0"
                    >
                      <Badge className={plan.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                        {plan.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-primary hover:text-primary-foreground hover:bg-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(plan.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{plan.description}</p>
                  
                  <div className="text-3xl font-bold text-primary">
                    ${plan.price}
                    <span className="text-lg text-muted-foreground font-normal">/mes</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Orden: {plan.display_order}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Beneficios:</h4>
                    <ul className="space-y-1 max-h-36 overflow-y-auto">
                      {plan.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay planes configurados
            </h3>
            <p className="text-muted-foreground mb-4">
              Agrega planes de suscripción para que los usuarios puedan elegir.
            </p>
            <Button
              onClick={() => {
                setEditingPlan(null);
                setIsDialogOpen(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Plan
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground mt-6">
          Total de planes: {plans.length}
        </div>
      </CardContent>
    </Card>
  );
}
