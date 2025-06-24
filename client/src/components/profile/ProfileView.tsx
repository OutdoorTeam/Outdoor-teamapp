import * as React from 'react';
import { useProfile } from '../../hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Target, TrendingUp, Footprints, CheckCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export function ProfileView() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando perfil...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="text-center py-8 text-muted-foreground">No se pudo cargar el perfil</div>;
  }

  const diasRestantes = profile.subscription_end_date
    ? differenceInDays(parseISO(profile.subscription_end_date), new Date())
    : null;

  const getSubscriptionStatus = () => {
    if (!diasRestantes) return { status: 'inactive', color: 'bg-muted text-muted-foreground' };
    
    if (diasRestantes < 0) {
      return { status: 'expired', color: 'bg-red-600 text-white' };
    } else if (diasRestantes <= 7) {
      return { status: 'expiring', color: 'bg-yellow-600 text-white' };
    } else {
      return { status: 'active', color: 'bg-green-600 text-white' };
    }
  };

  const subscriptionInfo = getSubscriptionStatus();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>

      {/* Información del Usuario */}
      <Card className="bg-card border-border border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-xl">
            <User className="h-6 w-6 text-primary" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre</label>
                <div className="text-lg font-medium text-foreground">{profile.name}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <div className="text-lg text-foreground">{profile.email}</div>
              </div>
              {profile.age && (
                <div>
                  <label className="text-sm text-muted-foreground">Edad</label>
                  <div className="text-lg text-foreground">{profile.age} años</div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.objetivo && (
                <div>
                  <label className="text-sm text-muted-foreground">Objetivo</label>
                  <div className="text-lg text-foreground">{profile.objetivo}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Plan Actual</label>
                <div className="text-lg text-foreground">
                  {profile.plan_name || 'Sin plan asignado'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Suscripción */}
      <Card className="bg-card border-border border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Estado de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Estado:</span>
              <Badge className={subscriptionInfo.color}>
                {subscriptionInfo.status === 'active' && 'Activa'}
                {subscriptionInfo.status === 'expiring' && 'Por vencer'}
                {subscriptionInfo.status === 'expired' && 'Vencida'}
                {subscriptionInfo.status === 'inactive' && 'Inactiva'}
              </Badge>
            </div>

            {profile.subscription_end_date && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Fecha de vencimiento:</span>
                  <span className="text-foreground font-medium">
                    {format(parseISO(profile.subscription_end_date), 'dd/MM/yyyy')}
                  </span>
                </div>

                {diasRestantes !== null && diasRestantes >= 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">Días restantes:</span>
                      <span className={`font-bold ${diasRestantes <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {diasRestantes} días
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, Math.min(100, (diasRestantes / 30) * 100))} 
                      className="h-2"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de Progreso */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pasos Diarios */}
        <Card className="bg-card border-border border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Footprints className="h-5 w-5 text-primary" />
              Progreso de Pasos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Promedio diario:</span>
                <span className="text-2xl font-bold text-primary">
                  {profile.stats.average_daily_steps.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta: 8,000 pasos</span>
                  <span className="text-foreground">
                    {Math.round((profile.stats.average_daily_steps / 8000) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (profile.stats.average_daily_steps / 8000) * 100)} 
                  className="h-3"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                Basado en los últimos 30 días
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hábitos Completados */}
        <Card className="bg-card border-border border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              Cumplimiento de Hábitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Porcentaje:</span>
                <span className="text-2xl font-bold text-primary">
                  {Math.round(profile.stats.habits_completion_rate)}%
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta: 80%</span>
                  <span className="text-foreground">
                    {Math.round((profile.stats.habits_completion_rate / 80) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (profile.stats.habits_completion_rate / 80) * 100)} 
                  className="h-3"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                Basado en los últimos 30 días
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Semanal */}
      <Card className="bg-primary/10 border-primary/30 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resumen de Esta Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.stats.weekly_total_points}</div>
              <div className="text-sm text-muted-foreground">Puntos totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.stats.weekly_habits_completed}</div>
              <div className="text-sm text-muted-foreground">Hábitos completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.stats.weekly_meditation_sessions}</div>
              <div className="text-sm text-muted-foreground">Sesiones de meditación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.stats.current_streak}</div>
              <div className="text-sm text-muted-foreground">Días consecutivos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}