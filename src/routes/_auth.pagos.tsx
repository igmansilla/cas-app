import { useState } from 'react';
import { createFileRoute, useSearch, Link } from '@tanstack/react-router';
import { 
  useMisInscripciones, 
  usePlanes, 
  useInscribirse, 
  useCrearIntencionPago 
} from '../hooks/usePagos';
import { ListaPlanesDisponibles } from '../components/pagos/ListaPlanesDisponibles';
import { ModalInscripcion } from '../components/pagos/ModalInscripcion';
import { MiPlanPago } from '../components/pagos/MiPlanPago';
import { type PlanPago, type InscripcionRequest, type Cuota } from '../api/schemas/pagos';
import { toast } from 'sonner';
import { type RouterContext } from './__root';
import { AlertTriangle, Info, XCircle, Wrench } from 'lucide-react';

export const Route = createFileRoute('/_auth/pagos')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mes: search.mes ? Number(search.mes) : undefined,
      devMode: search.devMode === 'true' || search.devMode === '1'
    };
  }
});

// Constantes de meses límite según PDF
const MES_INICIO_PLAN_B = 7; // Julio
const MES_FIN_INSCRIPCIONES = 10; // Octubre

// Modo desarrollo: en dev muestra todos los planes sin restricciones de fecha
const IS_DEV = import.meta.env.DEV;

function RouteComponent() {
  const context = Route.useRouteContext() as RouterContext;
  const idUsuario = context.auth.user?.uid || "";
  
  // URL params para testing: ?mes=4 simula Abril, ?devMode=true desactiva restricciones
  const { mes: mesOverride, devMode } = useSearch({ from: '/_auth/pagos' });

  // Data fetching
  const { inscripciones, cargando: cargandoInscripciones } = useMisInscripciones();
  const { planes, cargando: cargandoPlanes } = usePlanes();
  
  // Mutations
  const { inscribirse, cargando: inscribiendo } = useInscribirse();
  const { crearIntencion } = useCrearIntencionPago();

  // State
  const [modalInscripcionAbierto, setModalInscripcionAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanPago | null>(null);
  const [pagandoCuota, setPagandoCuota] = useState<number | null>(null);

  // Current month (1-12) - puede ser overrideado via URL para testing
  const mesReal = new Date().getMonth() + 1;
  const mesActual = mesOverride || mesReal;
  
  // En modo dev o con devMode=true, mostrar todos los planes
  const ignorarRestricciones = IS_DEV || devMode;

  // Handlers
  const handleInscribirseClick = (plan: PlanPago) => {
    setPlanSeleccionado(plan);
    setModalInscripcionAbierto(true);
  };

  const handleConfirmarInscripcion = async (datos: InscripcionRequest) => {
    try {
      await inscribirse(datos);
      toast.success("Te has inscrito correctamente");
      setModalInscripcionAbierto(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al realizar la inscripción");
    }
  };

  const handlePagarCuota = async (cuota: Cuota, idInscripcion: number) => {
      try {
          // Validar que la cuota tenga ID
          if (!cuota.id) {
             toast.error("Error: Cuota sin identificador válido");
             return;
          }
          
          setPagandoCuota(cuota.secuencia);
          const respuesta = await crearIntencion({
              idInscripcion,
              idsCuotas: [cuota.id], 
              metodo: 'MERCADOPAGO' as any // Usamos 'MERCADOPAGO' literal o importamos enum si es necesario
          });
          
          if (respuesta.urlRedireccion) {
            // Redirect to Mercado Pago
            window.location.href = respuesta.urlRedireccion;
          } else {
             toast.error("No se recibió link de pago");
          }
      } catch (err) {
          console.error(err);
          toast.error("Error al iniciar el pago");
      } finally {
          setPagandoCuota(null);
      }
  };

  // Plan filtering based on current month (uses simulated month in dev mode)
  const planesDisponibles = planes.filter(p => {
    // Después de Octubre nadie puede inscribirse (excepto en modo dev)
    if (!ignorarRestricciones && mesActual > MES_FIN_INSCRIPCIONES) return false;
    
    // Antes de Julio: solo Plan A
    if (mesActual < MES_INICIO_PLAN_B) return p.estrategia === 'PLAN_A';
    
    // Julio a Octubre: solo Plan B
    return p.estrategia === 'PLAN_B';
  });

  // UI States
  const inscripcionesCerradas = !ignorarRestricciones && mesActual > MES_FIN_INSCRIPCIONES;
  const esPeriodoPlanB = mesActual >= MES_INICIO_PLAN_B && mesActual <= MES_FIN_INSCRIPCIONES;

  // Render Logic
  
  // 1. Loading
  if (cargandoInscripciones) {
      return <div className="p-8 text-center text-muted-foreground">Cargando pagos...</div>;
  }

  // 2. Not Enrolled -> Show Plans
  if (inscripciones.length === 0) {
      return (
        <div className="p-6 space-y-6">
           <div className="space-y-2">
             <h1 className="text-3xl font-bold tracking-tight">Planes Vigentes</h1>
             <p className="text-muted-foreground">Elige un plan de pago para el campamento.</p>
           </div>

           {/* Banner: Modo Desarrollo */}
           {ignorarRestricciones && (
             <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4 flex items-start gap-3">
               <Wrench className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
               <div className="flex-1">
                 <p className="font-semibold text-violet-800 dark:text-violet-200">
                   Modo Desarrollo
                 </p>
                 <p className="text-sm text-violet-700 dark:text-violet-300">
                   Las restricciones de fecha están desactivadas. Mes actual real: <strong>{mesReal}</strong> (Diciembre).
                   {mesOverride && <> Simulando mes: <strong>{mesOverride}</strong>.</>}
                 </p>
                 <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 flex gap-2">
                   Probar: 
                   <Link from="/pagos" search={(prev) => ({ ...prev, mes: 4 })} className="underline hover:text-violet-800">Abril (Plan A)</Link> 
                   • 
                   <Link from="/pagos" search={(prev) => ({ ...prev, mes: 8 })} className="underline hover:text-violet-800">Agosto (Plan B)</Link> 
                   • 
                   <Link from="/pagos" search={(prev) => ({ ...prev, mes: 11 })} className="underline hover:text-violet-800">Noviembre (cerrado)</Link>
                 </p>
               </div>
             </div>
           )}

           {/* Alerta: Inscripciones cerradas */}
           {inscripcionesCerradas && (
             <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
               <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
               <div>
                 <p className="font-semibold text-red-800 dark:text-red-200">
                   Inscripciones cerradas
                 </p>
                 <p className="text-sm text-red-700 dark:text-red-300">
                   El período de inscripción finalizó en Octubre. Contacta a los dirigentes para más información.
                 </p>
               </div>
             </div>
           )}

           {/* Alerta: Período Plan B */}
           {esPeriodoPlanB && !inscripcionesCerradas && (
             <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
               <div>
                 <p className="font-semibold text-orange-800 dark:text-orange-200">
                   Inscripción tardía
                 </p>
                 <p className="text-sm text-orange-700 dark:text-orange-300">
                   Las inscripciones a partir de Julio corresponden únicamente al Plan B. 
                   El Plan A estuvo disponible de Marzo a Junio.
                 </p>
               </div>
             </div>
           )}

           {/* Alerta informativa: Período Plan A */}
           {mesActual < MES_INICIO_PLAN_B && (
             <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
               <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
               <div>
                 <p className="text-sm text-blue-700 dark:text-blue-300">
                   <strong>Inscripción anticipada:</strong> Al inscribirte ahora accedés al Plan A con el mejor precio. 
                   Recordá mantener tus pagos al día para conservar este beneficio.
                 </p>
               </div>
             </div>
           )}
           
           {cargandoPlanes ? (
               <div>Cargando planes disponibles...</div>
           ) : (
               <ListaPlanesDisponibles 
                  planes={planesDisponibles} 
                  onInscribirse={handleInscribirseClick} 
               />
           )}

           <ModalInscripcion 
              abierto={modalInscripcionAbierto}
              plan={planSeleccionado}
              cargando={inscribiendo}
              idUsuario={idUsuario}
              onCerrar={() => setModalInscripcionAbierto(false)}
              onConfirmar={handleConfirmarInscripcion}
           />
        </div>
      );
  }

  // 3. Enrolled -> Show MiPlanPago component for each inscription
  return (
    <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Mis Pagos</h1>
          <p className="text-muted-foreground">Gestiona tu plan de pago y cuotas.</p>
        </div>
        
        {inscripciones.map((inscripcion) => (
            <MiPlanPago 
                key={inscripcion.idInscripcion} 
                inscripcion={inscripcion}
                onPagarCuota={(c) => handlePagarCuota(c, inscripcion.idInscripcion)} 
                pagandoCuotaId={pagandoCuota}
            />
        ))}
    </div>
  );
}


