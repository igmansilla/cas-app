import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { Button } from "../components/ui/button";
import { TablaPlanes } from '../components/pagos/TablaPlanes';
import { WizardPlanPago } from '../components/pagos/WizardPlanPago';
import { usePlanes, useCrearPlan } from '../hooks/usePagos';
import { type PlanPago, type PlanPagoRequest } from '../api/schemas/pagos';
import { toast } from 'sonner';
import { type RouterContext } from './__root';

export const Route = createFileRoute('/_auth/definicion-planes')({
  beforeLoad: ({ context }) => {
    // Basic check, though sidebar also hides it.
    const { auth } = context as RouterContext;
    const user = auth.user;
    const groups = user?.groups || [];
    if (!groups.includes('CONSEJO')) {
         console.warn('User not in CONSEJO group', groups);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { planes, cargando: cargandoPlanes, error } = usePlanes();
  const { crearPlan, cargando: creando } = useCrearPlan();
  
  // Update disabled for now as Wizard is simplified for Creation primarily
  // Editing a plan via Wizard implies re-walking steps. 
  // We will currently limit Wizard to Creation, or re-use logic.
  // User request focused on "creating a new plan".
  
  const [wizardAbierto, setWizardAbierto] = useState(false);

  const handleNuevoPlan = () => {
    setWizardAbierto(true);
  };

  const handleEditarPlan = (_plan: PlanPago) => {
       toast.info("Edición via Wizard próximamente. Use 'Nuevo' para crear.");
       // Ideally passing data to Wizard form defaultValues
  };
  
  const handleGuardar = async (datos: PlanPagoRequest) => {
    try {
        await crearPlan(datos);
        toast.success("Plan creado exitosamente");
        setWizardAbierto(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar plan");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de Pago</h1>
          <p className="text-muted-foreground">Configuración de los planes disponibles para inscripción.</p>
        </div>
        <Button onClick={handleNuevoPlan}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {error ? (
        <div className="text-red-500">Error al cargar planes</div>
      ) : (
        <div className="relative">
          {cargandoPlanes && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">Cargando...</div>}
          <TablaPlanes 
              planes={planes} 
              onEditar={handleEditarPlan} 
          />
        </div>
      )}

      <WizardPlanPago
        abierto={wizardAbierto}
        cargando={creando}
        onCerrar={() => setWizardAbierto(false)}
        onGuardar={handleGuardar}
      />
    </div>
  );
}
