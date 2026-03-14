import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ServerCog } from 'lucide-react';

import { sistemaService } from '../api/services/sistema';
import { sistemaKeys } from '../api/query-keys/sistema.keys';
import { ServiciosExternosStatusPanel } from '../components/sistema/ServiciosExternosStatusPanel';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/_auth/sistema')({
  component: RouteComponent,
});

function RouteComponent() {
  const { hasRole } = useAuth();
  const canAccess = hasRole('admin');

  const query = useQuery({
    queryKey: sistemaKeys.serviciosExternosStatus,
    queryFn: () => sistemaService.obtenerEstadoServiciosExternos(),
    enabled: canAccess,
    staleTime: 30_000,
  });

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No tenes acceso a Sistema</CardTitle>
            <CardDescription>
              Esta superficie queda reservada para administradores del sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-2xl text-cyan-900">
            <ServerCog className="h-6 w-6" />
            Sistema
          </CardTitle>
          <CardDescription className="text-cyan-800">
            Control centralizado del estado de secretos, tokens y configuraciones externas.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void query.refetch();
          }}
          disabled={query.isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          {query.isFetching ? 'Actualizando...' : 'Refrescar estado'}
        </Button>
      </div>

      {query.isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cargando estado de servicios externos...
          </CardContent>
        </Card>
      )}

      {query.error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el estado de servicios</AlertTitle>
          <AlertDescription>
            Revisa conectividad o permisos de admin e intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {query.data && <ServiciosExternosStatusPanel estado={query.data} />}
    </div>
  );
}
