import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Upload, Download, Search, UserPlus, Calendar } from 'lucide-react';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  plan_asignado: number | null;
  fecha_vencimiento: string | null;
  sections: {
    training: boolean;
    nutrition: boolean;
    breaks: boolean;
    meditation: boolean;
  };
}

export function UnifiedUserManagement() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = React.useState(false);
  const [newExpirationDate, setNewExpirationDate] = React.useState('');

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

  const updateUserSubscription = async (userId: number, status: 'active' | 'expired', expirationDate?: string) => {
    try {
      const response = await fetch('/api/admin/user-subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription_status: status,
          fecha_vencimiento: status === 'active' ? expirationDate : null
        })
      });

      if (!response.ok) throw new Error('Failed to update user subscription');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  };

  const getSubscriptionStatus = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return 'expired';

    const today = new Date();
    const vencimiento = parseISO(fechaVencimiento);
    const sevenDaysFromNow = addDays(today, 7);

    if (isBefore(vencimiento, today)) {
      return 'expired';
    } else if (isBefore(vencimiento, sevenDaysFromNow)) {
      return 'expiring';
    } else {
      return 'active';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <Badge className="bg-red-600 text-white">Vencida</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-600 text-white">Por vencer</Badge>;
      case 'active':
        return <Badge className="bg-green-600 text-white">Activa</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Sin datos</Badge>;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('usersFile', file);

    try {
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to import users');
      
      alert('Usuarios importados exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error importing users:', error);
      alert('Error al importar usuarios');
    }

    // Reset input
    event.target.value = '';
  };

  const exportUsers = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Plan', 'Fecha Vencimiento', 'Estado', 'Entrenamiento', 'Nutrición', 'Pausas', 'Meditación'].join(','),
      ...users.map(user => {
        const status = getSubscriptionStatus(user.fecha_vencimiento);
        return [
          user.nombre,
          user.email,
          user.plan_asignado ? `Plan ${user.plan_asignado}` : 'Sin plan',
          user.fecha_vencimiento || 'N/A',
          status === 'active' ? 'Activa' : status === 'expiring' ? 'Por vencer' : 'Vencida',
          user.sections.training ? 'Sí' : 'No',
          user.sections.nutrition ? 'Sí' : 'No',
          user.sections.breaks ? 'Sí' : 'No',
          user.sections.meditation ? 'Sí' : 'No'
        ].join(',')
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openSubscriptionDialog = (user: UserData) => {
    setSelectedUser(user);
    const status = getSubscriptionStatus(user.fecha_vencimiento);
    if (status === 'active' || status === 'expiring') {
      setNewExpirationDate(user.fecha_vencimiento || '');
    } else {
      // Set default expiration to 30 days from now
      const futureDate = addDays(new Date(), 30);
      setNewExpirationDate(format(futureDate, 'yyyy-MM-dd'));
    }
    setIsSubscriptionDialogOpen(true);
  };

  const handleSubscriptionUpdate = async () => {
    if (!selectedUser) return;

    const status = getSubscriptionStatus(selectedUser.fecha_vencimiento);
    const newStatus = status === 'expired' ? 'active' : 'expired';
    
    const expirationDate = newStatus === 'active' ? newExpirationDate : undefined;
    
    try {
      await updateUserSubscription(selectedUser.id, newStatus, expirationDate);
      setIsSubscriptionDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando usuarios...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestión Unificada de Usuarios
          </span>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="user-import"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('user-import')?.click()}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={exportUsers}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-input border-border text-foreground"
            />
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block rounded-lg border-2 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/20 border-b-2 border-primary/30">
                  <TableHead className="text-foreground font-bold">Usuario</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Estado</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Plan</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Entrenamiento</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Nutrición</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Pausas</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Meditación</TableHead>
                  <TableHead className="text-foreground font-bold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => {
                  const status = getSubscriptionStatus(user.fecha_vencimiento);
                  return (
                    <TableRow
                      key={user.id}
                      className={`
                        hover:bg-muted/50 transition-colors border-b border-border
                        ${index % 2 === 0 ? 'bg-card' : 'bg-background/30'}
                        ${status === 'expired' ? 'bg-red-950/20' : ''}
                        ${status === 'expiring' ? 'bg-yellow-950/20' : ''}
                      `}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{user.nombre}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(status)}
                          {user.fecha_vencimiento && (
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(user.fecha_vencimiento), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={user.plan_asignado ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                          {user.plan_asignado ? `Plan ${user.plan_asignado}` : 'Sin plan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.sections.training}
                          onCheckedChange={(checked) => toggleUserAccess(user.id, 'training', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.sections.nutrition}
                          onCheckedChange={(checked) => toggleUserAccess(user.id, 'nutrition', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.sections.breaks}
                          onCheckedChange={(checked) => toggleUserAccess(user.id, 'breaks', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.sections.meditation}
                          onCheckedChange={(checked) => toggleUserAccess(user.id, 'meditation', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubscriptionDialog(user)}
                          className={`${status === 'active' ? 'border-yellow-600 text-yellow-600 hover:bg-yellow-600' : 'border-green-600 text-green-600 hover:bg-green-600'} hover:text-white`}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {status === 'active' ? 'Expirar' : 'Activar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden space-y-4">
            {filteredUsers.map((user) => {
              const status = getSubscriptionStatus(user.fecha_vencimiento);
              return (
                <Card key={user.id} className={`bg-background/50 border-border ${status === 'expired' ? 'border-red-600/50' : status === 'expiring' ? 'border-yellow-600/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-primary text-lg">{user.nombre}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(status)}
                          {user.fecha_vencimiento && (
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(user.fecha_vencimiento), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={user.plan_asignado ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                        {user.plan_asignado ? `Plan ${user.plan_asignado}` : 'Sin plan'}
                      </Badge>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Accesos:</h4>
                        {[
                          { key: 'training', label: 'Entrenamiento' },
                          { key: 'nutrition', label: 'Nutrición' },
                          { key: 'breaks', label: 'Pausas Activas' },
                          { key: 'meditation', label: 'Meditación' }
                        ].map((section) => (
                          <div key={section.key} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                            <span className="text-foreground font-medium">{section.label}</span>
                            <Switch
                              checked={user.sections[section.key as keyof typeof user.sections]}
                              onCheckedChange={(checked) => toggleUserAccess(user.id, section.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => openSubscriptionDialog(user)}
                        className={`w-full ${status === 'active' ? 'border-yellow-600 text-yellow-600 hover:bg-yellow-600' : 'border-green-600 text-green-600 hover:bg-green-600'} hover:text-white`}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {status === 'active' ? 'Cambiar suscripción' : 'Activar suscripción'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-sm text-muted-foreground">
            Total de usuarios: {filteredUsers.length}
          </div>
        </div>
      </CardContent>

      {/* Subscription Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Gestionar Suscripción - {selectedUser?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">Estado actual:</Label>
                  <div>{getStatusBadge(getSubscriptionStatus(selectedUser.fecha_vencimiento))}</div>
                  {selectedUser.fecha_vencimiento && (
                    <div className="text-sm text-muted-foreground">
                      Vence: {format(parseISO(selectedUser.fecha_vencimiento), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>

                {(getSubscriptionStatus(selectedUser.fecha_vencimiento) === 'expired' || 
                  getSubscriptionStatus(selectedUser.fecha_vencimiento) === 'expiring' ||
                  getSubscriptionStatus(selectedUser.fecha_vencimiento) === 'active') && (
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate" className="text-foreground">
                      {getSubscriptionStatus(selectedUser.fecha_vencimiento) === 'expired' ? 'Nueva fecha de vencimiento:' : 'Actualizar fecha de vencimiento:'}
                    </Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={newExpirationDate}
                      onChange={(e) => setNewExpirationDate(e.target.value)}
                      className="bg-input border-border text-foreground"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubscriptionUpdate}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={getSubscriptionStatus(selectedUser.fecha_vencimiento) !== 'expired' && !newExpirationDate}
                  >
                    {getSubscriptionStatus(selectedUser.fecha_vencimiento) === 'expired' ? 'Activar' : 'Actualizar'}
                  </Button>
                  {getSubscriptionStatus(selectedUser.fecha_vencimiento) !== 'expired' && (
                    <Button
                      onClick={() => updateUserSubscription(selectedUser.id, 'expired')}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      Expirar
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsSubscriptionDialogOpen(false)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
