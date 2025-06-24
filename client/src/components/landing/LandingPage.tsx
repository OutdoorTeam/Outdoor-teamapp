import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Users, Target, Heart, Instagram, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingContent {
  id: number;
  section: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
}

interface PlanConfig {
  id: number;
  name: string;
  description: string;
  price: number;
  benefits: string[];
  is_active: number;
}

export function LandingPage() {
  const [content, setContent] = React.useState<LandingContent[]>([]);
  const [plans, setPlans] = React.useState<PlanConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, plansRes] = await Promise.all([
          fetch('/api/landing-content'),
          fetch('/api/plan-configs')
        ]);
        
        const contentData = await contentRes.json();
        const plansData = await plansRes.json();
        
        setContent(contentData);
        setPlans(plansData.filter((plan: PlanConfig) => plan.is_active));
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroContent = content.find(c => c.section === 'hero');
  const servicesContent = content.find(c => c.section === 'services');
  const questionContent = content.find(c => c.section === 'question');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {heroContent?.title || 'Transforma tu vida con Outdoor Team'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {heroContent?.content || 'Descubre nuestro método integral para alcanzar tus objetivos de salud y bienestar'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
              Comenzar Ahora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6">
              Ver Planes
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {servicesContent?.title || 'Nuestros Servicios'}
            </h2>
            <p className="text-xl text-muted-foreground">
              {servicesContent?.content || 'Ofrecemos soluciones personalizadas para cada etapa de tu transformación'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-card border-border text-center group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Planificación Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Planes de entrenamiento y nutrición adaptados específicamente a tus objetivos y estilo de vida.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Programa TOTUM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema integral que combina entrenamiento personalizado con plan nutricional completo.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border text-center group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Desarrollo de Hábitos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  App con sistema de puntos para crear hábitos saludables y mantener la motivación diaria.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Elige tu Plan
            </h2>
            <p className="text-xl text-muted-foreground">
              Encuentra la opción perfecta para comenzar tu transformación
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`bg-card border-border ${index === 1 ? 'border-primary scale-105' : ''} relative`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Más Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary">
                    ${plan.price}
                    <span className="text-lg text-muted-foreground">/mes</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-foreground">
                        <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${index === 1 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    Elegir Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Síguenos en Instagram
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Mantente inspirado con contenido diario sobre fitness, nutrición y bienestar
          </p>
          
          <Card className="bg-card border-border max-w-md mx-auto">
            <CardContent className="p-8">
              <Instagram className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">@outdoor.team</h3>
              <p className="text-muted-foreground mb-6">
                Tips diarios, transformaciones reales y motivación constante
              </p>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 w-full">
                <Instagram className="h-5 w-5 mr-2" />
                Seguir en Instagram
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Question Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8">
            {questionContent?.title || '¿Qué estás haciendo hoy por tu salud?'}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {questionContent?.content || 'Tu bienestar comienza con una decisión. ¿Estás listo para dar el primer paso?'}
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-6">
            Comenzar Mi Transformación
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">Outdoor Team</h3>
          <p className="text-muted-foreground mb-6">
            Transformando vidas a través del movimiento y la alimentación consciente
          </p>
          <div className="flex justify-center gap-6">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Política de Privacidad
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Términos de Servicio
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Contacto
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
