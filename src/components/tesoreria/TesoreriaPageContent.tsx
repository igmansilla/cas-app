import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DashboardKPIs,
  FiltrosInscripciones,
  TablaInscripcionesAdmin,
  DetalleInscripto,
} from './index';
import {
  useInscripcionesAdmin,
  useMigraciones,
  useConfigFacturacion,
  useActualizarConfigFacturacion,
} from '../../hooks/usePagos';
import {
  type InscripcionAdmin,
  type AdminInscripcionFilters,
} from '../../api/schemas/pagos';
import { LayoutDashboard, Users, GitBranch } from 'lucide-react';
import { Switch } from '../ui/switch';

/**
 * Treasury and account review screen.
 * Provides financial dashboard, inscription management, and migration audit.
 */
export function TesoreriaPageContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<AdminInscripcionFilters>({});
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<InscripcionAdmin | null>(null);

  const { inscripciones, cargando } = useInscripcionesAdmin(filters);
  const { migraciones, cargando: cargandoMigraciones } = useMigraciones();
  const { config, cargando: cargandoConfig } = useConfigFacturacion();
  const { actualizarConfig, cargando: guardandoConfig } = useActualizarConfigFacturacion();
  const afipHabilitada = config?.afipHabilitada ?? false;

  return (
    <div className="space-y-6 rounded-3xl border border-emerald-100 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Tesorería</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de pagos, inscripciones y auditoría de cuentas.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Factura electrónica AFIP</p>
          <p className="text-sm text-muted-foreground">
            Al activarlo, todos los pagos emitirán factura electrónica. Si está desactivado, se envía un recibo no fiscal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Recibo</span>
          <Switch
            checked={afipHabilitada}
            disabled={cargandoConfig || guardandoConfig}
            onCheckedChange={(checked) => actualizarConfig({ afipHabilitada: checked })}
          />
          <span className="text-sm text-muted-foreground">Factura AFIP</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="inscripciones" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Inscripciones</span>
          </TabsTrigger>
          <TabsTrigger value="migraciones" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Migraciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardKPIs />

          <div className="bg-muted/30 rounded-lg p-6 text-center text-muted-foreground">
            <p>
              Usa la pestaña <strong>Inscripciones</strong> para gestionar pagos individuales.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="inscripciones" className="space-y-6">
          <FiltrosInscripciones
            filters={filters}
            onFiltersChange={setFilters}
          />

          <TablaInscripcionesAdmin
            inscripciones={inscripciones}
            cargando={cargando}
            onVerDetalle={setInscripcionSeleccionada}
          />
        </TabsContent>

        <TabsContent value="migraciones" className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">
              Auditoría de Migraciones
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Listado de usuarios migrados automáticamente a Plan B por el sistema de morosidad.
            </p>
          </div>

          <TablaInscripcionesAdmin
            inscripciones={migraciones}
            cargando={cargandoMigraciones}
            onVerDetalle={setInscripcionSeleccionada}
          />
        </TabsContent>
      </Tabs>

      <DetalleInscripto
        inscripcion={inscripcionSeleccionada}
        open={!!inscripcionSeleccionada}
        onClose={() => setInscripcionSeleccionada(null)}
      />
    </div>
  );
}