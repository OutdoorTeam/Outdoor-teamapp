import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, Dumbbell, Utensils, Coffee, Brain } from 'lucide-react';

interface UserAccess {
  id: number;
  nombre: string;
  email: string;
  plan_asignado: number | null;
  sections: {
    training: boolean;
    nutrition: boolean;
    breaks: boolean;
    meditation: boolean;
  };
}

export function UserAccessManager() {
  const [users, setUsers] = React.useState<UserAccess[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/user-access');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserAccess = async (userId: number, section: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/user-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          section_name: section,
          is_enabled: enabled ? 1 : 0
        })
      });

      if (!response.ok) throw new Error('Failed to update user access');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user access:', error);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'training': return <Dumbbell className="h-4 w-4" />;
      case 'nutrition': return <Utensils className="h-4 w-4" />;
      case 'breaks': return <Coffee className="h-4 w-4" />;
      case 'meditation': return <Brain className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSectionName = (section: string) => {
    switch (section) {
      case 'training': return 'Entrenamiento';
      case 'nutrition': return 'Nutrición';
      case 'breaks': return 'Pausas Activas';
      case 'meditation': return 'Meditación';
      default: return section;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando usuarios...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Gestión de Accesos por Usuario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Desktop View */}
          <div className="hidden md:block rounded-lg border-2 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/20 border-b-2 border-primary/30">
                  <TableHead className="text-foreground font-bold">Usuario</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Plan</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Entrenamiento</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Nutrición</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Pausas</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Meditación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={`
                      hover:bg-muted/50 transition-colors border-b border-border
                      ${index % 2 === 0 ? 'bg-card' : 'bg-background/30'}
                    `}
                  >
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium text-foreground">{user.nombre}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge className={user.plan_asignado ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                        {user.plan_asignado ? `Plan ${user.plan_asignado}` : 'Sin plan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Switch
                        checked={user.sections.training}
                        onCheckedChange={(checked) => toggleUserAccess(user.id, 'training', checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Switch
                        checked={user.sections.nutrition}
                        onCheckedChange={(checked) => toggleUserAccess(user.id, 'nutrition', checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Switch
                        checked={user.sections.breaks}
                        onCheckedChange={(checked) => toggleUserAccess(user.id, 'breaks', checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Switch
                        checked={user.sections.meditation}
                        onCheckedChange={(checked) => toggleUserAccess(user.id, 'meditation', checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="bg-background/50 border-border">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="font-bold text-primary text-lg">{user.nombre}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge className={`mt-2 ${user.plan_asignado ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {user.plan_asignado ? `Plan ${user.plan_asignado}` : 'Sin plan'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Accesos:</h4>
                      {(['training', 'nutrition', 'breaks', 'meditation'] as const).map((section) => (
                        <div key={section} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                            {getSectionIcon(section)}
                            <span className="text-foreground font-medium">{getSectionName(section)}</span>
                          </div>
                          <Switch
                            checked={user.sections[section]}
                            onCheckedChange={(checked) => toggleUserAccess(user.id, section, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            Total de usuarios: {users.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}