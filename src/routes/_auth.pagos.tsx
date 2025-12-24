import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  useMisInscripciones, 
  usePlanes, 
  useInscribirse, 
  useCuotas, 
  useCrearIntencionPago 
} from '../hooks/usePagos';
import { ListaPlanesDisponibles } from '../components/pagos/ListaPlanesDisponibles';
import { ModalInscripcion } from '../components/pagos/ModalInscripcion';
import { TablaCuotas } from '../components/pagos/TablaCuotas';
import { type PlanPago, type InscripcionRequest, type Cuota } from '../api/schemas/pagos';
import { toast } from 'sonner';
import { type RouterContext } from './__root';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute('/_auth/pagos')({
  component: RouteComponent,
});


function RouteComponent() {
  const context = Route.useRouteContext() as RouterContext;
  const idUsuario = context.auth.user?.uid || "";

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
          setPagandoCuota(cuota.nroCuota);
          const respuesta = await crearIntencion({
              idInscripcion,
              nroCuota: cuota.nroCuota
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
          setPagandoCuota(null); // Actually redirect might unmount, but good practice
      }
  };

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
           
           {cargandoPlanes ? (
               <div>Cargando planes disponibles...</div>
           ) : (
               <ListaPlanesDisponibles 
                  planes={planes} 
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

  // 3. Enrolled -> Show Dashboard of Enrollments
  // Assuming typically one active enrollment, but UI handles list
  return (
    <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Mis Pagos</h1>
        
        {inscripciones.map((inscripcion) => (
            <DetalleInscripcion 
                key={inscripcion.idInscripcion} 
                inscripcion={inscripcion}
                onPagar={handlePagarCuota} 
                pagandoId={pagandoCuota}
            />
        ))}
    </div>
  );
}

// Sub-component for Details + Installments to keep logic clean and handle useCuotas per enrollment
function DetalleInscripcion({ 
    inscripcion, 
    onPagar,
    pagandoId
}: { 
    inscripcion: any /* Inscripcion type imported above but recursive type issues sometimes, using explicit */,
    onPagar: (c: Cuota, id: number) => void,
    pagandoId: number | null
}) {
    // Fetch cuotas for this enrollment
    const { cuotas, cargando } = useCuotas(inscripcion.idInscripcion);
    
    // Sort cuotas by number
    const cuotasOrdenadas = [...cuotas].sort((a, b) => a.nroCuota - b.nroCuota);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{inscripcion.plan.nombre}</CardTitle>
                        <CardDescription>Inscrito el {new Date(inscripcion.fechaInscripcion).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge variant={inscripcion.estado === 'ACTIVA' ? 'default' : 'secondary'}>
                        {inscripcion.estado}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   <div>
                       <span className="text-muted-foreground block">Monto Total:</span>
                       <span className="font-semibold">${inscripcion.plan.montoTotal.toLocaleString()}</span>
                   </div>
                   {/* Add more summary stats if needed */}
                </div>

                <h3 className="font-semibold mb-4">Cuotas</h3>
                {cargando ? (
                    <div>Cargando cuotas...</div>
                ) : (
                    <TablaCuotas 
                        cuotas={cuotasOrdenadas} 
                        onPagar={(c) => onPagar(c, inscripcion.idInscripcion)}
                        pagandoId={pagandoId}
                    />
                )}
            </CardContent>
        </Card>
    );
}
