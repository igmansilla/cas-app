import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  useMisInscripciones,
  usePlanes,
  useInscribirse,
  useCrearIntencionPago
} from '../hooks/usePagos';
import { ListaPlanesDisponibles } from '../components/pagos/ListaPlanesDisponibles';
import { WizardInscripcion } from '../components/pagos/WizardInscripcion';
import { MiPlanPago } from '../components/pagos/MiPlanPago';
import { InscripcionesHijos } from '../components/pagos/InscripcionesHijos';
import { type PlanPago, type InscripcionRequest, type Cuota } from '../api/schemas/pagos';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

export const Route = createFileRoute('/_auth/pagos')({
  component: RouteComponent,
});

function RouteComponent() {
  const auth = useAuth();
  const idUsuario = auth.user?.uid || "";

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
    } catch (err: any) {
      console.error(err);
      // Mostrar mensaje de error del backend
      const mensaje = err?.response?.data?.detail
        || err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || "Error al realizar la inscripción";
      toast.error(mensaje);
    }
  };

  const handlePagarCuota = async (cuota: Cuota, idInscripcion: number) => {
    try {
      if (cuota.esPagable === false) {
        toast.error("Debés pagar en orden: primero la próxima cuota pendiente.");
        return;
      }

      // Validar que la cuota tenga ID
      if (!cuota.id) {
        toast.error("Error: Cuota sin identificador válido");
        return;
      }

      setPagandoCuota(cuota.secuencia);
      const respuesta = await crearIntencion({
        idInscripcion,
        idsCuotas: [cuota.id],
        metodo: 'MERCADOPAGO' as any
      });

      if (respuesta.urlRedireccion) {
        // Redirect to Mercado Pago
        window.location.href = respuesta.urlRedireccion;
      } else {
        toast.error("No se recibió link de pago");
      }
    } catch (err: any) {
      console.error(err);
      const mensaje = err?.response?.data?.detail
        || err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || "Error al iniciar el pago";
      toast.error(mensaje);
    } finally {
      setPagandoCuota(null);
    }
  };

  // Mostrar todos los planes activos - la validación de fecha se hace en el backend
  const planesDisponibles = planes.filter(p => p.activo);

  // Render Logic

  // 1. Loading
  if (cargandoInscripciones) {
    return <div className="p-8 text-center text-muted-foreground">Cargando pagos...</div>;
  }

  // 2. Not Enrolled -> Show Plans
  if (inscripciones.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2 mobile-screen-title">
          <h1 className="text-3xl font-bold tracking-tight">Planes Vigentes</h1>
          <p className="text-muted-foreground">Elige un plan de pago para el campamento.</p>
        </div>

        {cargandoPlanes ? (
          <div>Cargando planes disponibles...</div>
        ) : planesDisponibles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay planes disponibles en este momento.</p>
          </div>
        ) : (
          <ListaPlanesDisponibles
            planes={planesDisponibles}
            onInscribirse={handleInscribirseClick}
          />
        )}

        <WizardInscripcion
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
      <div className="space-y-2 mobile-screen-title">
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

      {/* Sección para padres: ver inscripciones de hijos */}
      <InscripcionesHijos />
    </div>
  );
}
