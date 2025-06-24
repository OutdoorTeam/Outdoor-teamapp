import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';

interface PlanConfig {
  id: number;
  name: string;
  description: string;
  price: number;
  benefits: string[];
  is_active: number;
  display_order: number;
}

export function PlansConfig() {
  const [plans, setPlans] = React.useState<PlanConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/plan-configs');
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        setPlans(data.filter((plan: PlanConfig) => plan.is_active));
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Planes de Suscripción</h1>
        <p className="text-muted-foreground text-lg">
          Elige el plan que mejor se adapte a tus objetivos y comienza tu transformación
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`bg-card border-border relative ${
              index === 1 ? 'border-primary scale-105 shadow-lg' : ''
            }`}
          >
            {index === 1 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-bold">
                  <Star className="h-4 w-4 mr-1" />
                  Más Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-foreground mb-2">{plan.name}</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">
                ${plan.price}
                <span className="text-lg text-muted-foreground font-normal">/mes</span>
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-foreground">Incluye:</h4>
                <ul className="space-y-3">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                className={`w-full text-lg py-6 ${
                  index === 1
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {index === 1 ? 'Comenzar Ahora' : 'Seleccionar Plan'}
              </Button>
              
              {index === 1 && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  ⭐ Recomendado para mejores resultados
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 max-w-4xl mx-auto text-center">
        <h3 className="text-xl font-bold text-foreground mb-3">
          ¿No estás seguro qué plan elegir?
        </h3>
        <p className="text-muted-foreground mb-4">
          Programa una consulta gratuita y te ayudaremos a encontrar el plan perfecto para ti
        </p>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          Consulta Gratuita
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          * Todos los planes incluyen garantía de satisfacción de 30 días. 
          Puedes cancelar en cualquier momento sin compromiso.
        </p>
      </div>
    </div>
  );
}
