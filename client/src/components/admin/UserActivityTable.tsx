import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserActivity {
  id: number;
  user_name: string;
  user_email: string;
  date: string;
  steps_count: number;
  habits_completed: number;
  total_points: number;
  daily_note: string | null;
}

export function UserActivityTable() {
  const [activities, setActivities] = React.useState<UserActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [userFilter, setUserFilter] = React.useState('');

  const fetchActivities = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/user-activities');
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || activity.date.includes(dateFilter);
    const matchesUser = !userFilter || activity.user_email === userFilter;
    
    return matchesSearch && matchesDate && matchesUser;
  });

  const uniqueUsers = [...new Set(activities.map(a => a.user_email))];

  const exportToCSV = () => {
    const headers = ['Usuario', 'Email', 'Fecha', 'Pasos', 'Hábitos', 'Puntos', 'Nota'];
    const csvContent = [
      headers.join(','),
      ...filteredActivities.map(activity => [
        activity.user_name,
        activity.user_email,
        activity.date,
        activity.steps_count,
        activity.habits_completed,
        activity.total_points,
        activity.daily_note ? `"${activity.daily_note.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actividad_usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando actividades...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Historial de Actividades
          </span>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-input border-border text-foreground"
          />
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Filtrar por usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los usuarios</SelectItem>
              {uniqueUsers.map(email => (
                <SelectItem key={email} value={email}>{email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile View */}
        <div className="block sm:hidden space-y-3">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-4 rounded-lg border-2 border-border bg-background/50">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-primary">{activity.user_name}</div>
                    <div className="text-sm text-muted-foreground">{activity.user_email}</div>
                    <div className="text-sm text-foreground">{activity.date}</div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {activity.total_points} pts
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Pasos</div>
                    <div className="font-bold text-foreground">{activity.steps_count.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Hábitos</div>
                    <div className="font-bold text-foreground">{activity.habits_completed}</div>
                  </div>
                </div>
                
                {activity.daily_note && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Nota del día:</div>
                    <div className="text-sm text-foreground">{activity.daily_note}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block rounded-lg border-2 border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/20 border-b-2 border-primary/30">
                <TableHead className="text-foreground font-bold">Usuario</TableHead>
                <TableHead className="text-foreground font-bold">Fecha</TableHead>
                <TableHead className="text-foreground font-bold text-center">Pasos</TableHead>
                <TableHead className="text-foreground font-bold text-center">Hábitos</TableHead>
                <TableHead className="text-foreground font-bold text-center">Puntos</TableHead>
                <TableHead className="text-foreground font-bold">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity, index) => (
                <TableRow
                  key={activity.id}
                  className={`
                    hover:bg-muted/50 transition-colors border-b border-border
                    ${index % 2 === 0 ? 'bg-card' : 'bg-background/30'}
                  `}
                >
                  <TableCell className="py-4">
                    <div>
                      <div className="font-medium text-foreground">{activity.user_name}</div>
                      <div className="text-sm text-muted-foreground">{activity.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{activity.date}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-primary">
                      {activity.steps_count.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-primary">{activity.habits_completed}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-primary text-primary-foreground">
                      {activity.total_points}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {activity.daily_note ? (
                      <div className="text-sm text-foreground truncate" title={activity.daily_note}>
                        {activity.daily_note}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          Mostrando {filteredActivities.length} de {activities.length} registros
        </div>
      </CardContent>
    </Card>
  );
}
