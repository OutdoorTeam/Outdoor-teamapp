import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Monitor, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ActiveBreak {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  work_type: string;
  video_url: string | null;
  gif_url: string | null;
  instructions: string;
  is_active: number;
}

export function ActiveBreaksView() {
  const [breaks, setBreaks] = React.useState<ActiveBreak[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [expandedBreaks, setExpandedBreaks] = React.useState<Record<number, boolean>>({});

  const fetchBreaks = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/active-breaks');
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

  const toggleExpanded = (breakId: number) => {
    setExpandedBreaks(prev => ({
      ...prev,
      [breakId]: !prev[breakId]
    }));
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'desk':
        return <Monitor className="h-4 w-4" />;
      case 'standing':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getWorkTypeBadge = (workType: string) => {
    const config = {
      desk: { label: 'Escritorio', className: 'bg-blue-600 text-white' },
      standing: { label: 'De pie', className: 'bg-green-600 text-white' },
      general: { label: 'General', className: 'bg-purple-600 text-white' }
    };
    
    const { label, className } = config[workType] || config.general;
    
    return (
      <Badge className={className}>
        {getWorkTypeIcon(workType)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  const openVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  const filteredBreaks = breaks.filter(breakItem => 
    breakItem.is_active && (selectedType === 'all' || breakItem.work_type === selectedType)
  );

  const workTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'desk', label: 'Escritorio' },
    { value: 'standing', label: 'De pie' },
    { value: 'general', label: 'General' }
  ];

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando pausas activas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Pausas Activas</h1>
          <p className="text-muted-foreground mt-2">
            Ejercicios breves para mantenerte activo durante el trabajo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.value)}
              className={selectedType === type.value 
                ? "bg-primary text-primary-foreground" 
                : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              }
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBreaks.map((breakItem) => (
          <Card key={breakItem.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-foreground">{breakItem.title}</CardTitle>
                <div className="flex flex-col items-end gap-2">
                  {getWorkTypeBadge(breakItem.work_type)}
                  <Badge className="bg-primary/20 text-primary border border-primary/50">
                    <Clock className="h-3 w-3 mr-1" />
                    {breakItem.duration_minutes} min
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{breakItem.description}</p>
                
                <Collapsible 
                  open={expandedBreaks[breakItem.id]} 
                  onOpenChange={() => toggleExpanded(breakItem.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <span>Ver instrucciones</span>
                      {expandedBreaks[breakItem.id] ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-3">
                    <div className="p-4 bg-background/80 border border-border rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">Instrucciones:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {breakItem.instructions}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {breakItem.video_url && (
                  <Button 
                    onClick={() => openVideo(breakItem.video_url!)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ver Video Tutorial
                  </Button>
                )}

                {breakItem.gif_url && (
                  <div className="mt-4">
                    <img 
                      src={breakItem.gif_url} 
                      alt={breakItem.title}
                      className="w-full rounded-lg border border-border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBreaks.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay pausas activas disponibles
          </h3>
          <p className="text-muted-foreground">
            {selectedType === 'all' 
              ? 'No se encontraron pausas activas configuradas.'
              : `No hay pausas activas para el tipo "${workTypes.find(t => t.value === selectedType)?.label}".`
            }
          </p>
        </div>
      )}
    </div>
  );
}
