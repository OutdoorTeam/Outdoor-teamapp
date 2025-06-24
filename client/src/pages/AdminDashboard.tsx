import * as React from 'react';
import { UnifiedUserManagement } from '../components/admin/UnifiedUserManagement';
import { PersonalizedPlanImporter } from '../components/admin/PersonalizedPlanImporter';
import { PlanConfigManager } from '../components/admin/PlanConfigManager';
import { ActiveBreaksManager } from '../components/admin/ActiveBreaksManager';
import { DailyWorkoutManager } from '../components/admin/DailyWorkoutManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileUp, Settings, Coffee, Calendar, Utensils, Dumbbell } from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('users');

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'import-training', label: 'Planes Entrenamiento', icon: Dumbbell },
    { id: 'import-nutrition', label: 'Planes Nutrición', icon: Utensils },
    { id: 'daily-workout', label: 'Entrenamiento Diario', icon: Calendar },
    { id: 'breaks', label: 'Pausas Activas', icon: Coffee },
    { id: 'plans', label: 'Configuración Planes', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UnifiedUserManagement />;
      case 'import-training':
        return (
          <Card className="bg-card border-border border-2">
            <CardHeader>
              <CardTitle className="text-foreground text-xl flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-primary" />
                Importar Planes de Entrenamiento Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalizedPlanImporter type="training" />
            </CardContent>
          </Card>
        );
      case 'import-nutrition':
        return (
          <Card className="bg-card border-border border-2">
            <CardHeader>
              <CardTitle className="text-foreground text-xl flex items-center gap-2">
                <Utensils className="h-6 w-6 text-primary" />
                Importar Planes de Nutrición Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalizedPlanImporter type="nutrition" />
            </CardContent>
          </Card>
        );
      case 'daily-workout':
        return <DailyWorkoutManager />;
      case 'breaks':
        return <ActiveBreaksManager />;
      case 'plans':
        return <PlanConfigManager />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        <div className="text-primary font-medium">Outdoor Team Admin</div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
              size="sm"
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}
