import { useState } from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '../ui/button';
import { TablaPlanes } from './TablaPlanes';
import { WizardPlanPago } from './WizardPlanPago';
import { EditarPlanDialog } from './EditarPlanDialog';
import {
  useAdminPlanes,
  useCrearPlan,
  useToggleEstadoPlan,
} from '../../hooks/usePagos';
import { type PlanPago, type PlanPagoRequest } from '../../api/schemas/pagos';
import { toast } from 'sonner';

export function DefinicionPlanesPageContent() {
  const { planes, cargando: cargandoPlanes, error } = useAdminPlanes();
  const { crearPlan, cargando: creando } = useCrearPlan();
  const { toggleEstado } = useToggleEstadoPlan();

  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [planEditar, setPlanEditar] = useState<PlanPago | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditarPlan = (plan: PlanPago) => {
    setPlanEditar(plan);
    setEditDialogOpen(true);
  };

  const handleToggleEstado = async (plan: PlanPago) => {
    try {
      if (!plan.id) return;
      await toggleEstado({ id: plan.id, activo: !plan.activo });
      toast.success(`Plan ${plan.activo ? 'desactivado' : 'activado'} exitosamente`);
    } catch (err) {
      console.error(err);
      toast.error('Error al cambiar estado del plan');
    }
  };

  const handleGuardarNuevo = async (datos: PlanPagoRequest) => {
    try {
      await crearPlan(datos);
      toast.success('Plan creado exitosamente');
      setWizardAbierto(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar plan');
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-emerald-100 bg-white/85 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Planes de Pago</h2>
          <p className="text-sm text-muted-foreground">
            Configuración de los planes disponibles para inscripción.
          </p>
        </div>
        <Button onClick={() => setWizardAbierto(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {error ? (
        <div className="text-red-500">Error al cargar planes</div>
      ) : cargandoPlanes && (!planes || planes.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p>Cargando planes...</p>
        </div>
      ) : (
        <div className="relative">
          {cargandoPlanes && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-lg border flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Actualizando...</span>
              </div>
            </div>
          )}
          <TablaPlanes
            planes={planes}
            onEditar={handleEditarPlan}
            onToggleEstado={handleToggleEstado}
          />
        </div>
      )}

      {wizardAbierto && (
        <WizardPlanPago
          abierto={wizardAbierto}
          cargando={creando}
          onCerrar={() => setWizardAbierto(false)}
          onGuardar={handleGuardarNuevo}
        />
      )}

      <EditarPlanDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setPlanEditar(null);
        }}
        plan={planEditar}
      />
    </div>
  );
}