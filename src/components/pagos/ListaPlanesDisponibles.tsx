/**
 * Lista de Planes Disponibles para Inscripción
 * Muestra todos los planes con estado visual de inscripción abierta/cerrada
 */

import { Crown } from "lucide-react";
import { type PlanPago } from "../../api/schemas/pagos";
import { PlanPagoCard } from "./PlanPagoCard";

/** 
 * Calcula si un plan tiene inscripción abierta.
 * El límite se calcula como mesInicioControlAtraso - 1.
 */
function calcularEstadoPlan(plan: PlanPago): { abierto: boolean; mensaje: string } {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1; // 1-12
  
  // Si no tiene año definido, asumir abierto
  if (!plan.anio) return { abierto: true, mensaje: '' };
  
  // Si el plan es de un año futuro, abierto
  if (plan.anio > anioActual) return { abierto: true, mensaje: '' };
  
  // Si el plan es de un año pasado, cerrado
  if (plan.anio < anioActual) return { abierto: false, mensaje: `Ciclo ${plan.anio} finalizado` };
  
  // Calcular mes límite: mesInicioControlAtraso - 1
  // Si no hay mesInicioControlAtraso, usamos mesLimiteInscripcion como fallback temporal
  const mesLimite = plan.mesInicioControlAtraso 
    ? plan.mesInicioControlAtraso - 1 
    : plan.mesLimiteInscripcion;
  
  if (!mesLimite) return { abierto: true, mensaje: '' };
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Si ya pasó el mes límite, cerrado
  if (mesActual > mesLimite) {
    return { abierto: false, mensaje: `Inscripción cerró en ${meses[mesLimite - 1]}` };
  }
  
  return { abierto: true, mensaje: `Hasta ${meses[mesLimite - 1]}` };
}

interface ListaPlanesDisponiblesProps {
  planes: PlanPago[];
  onInscribirse: (plan: PlanPago) => void;
}

export function ListaPlanesDisponibles({ planes, onInscribirse }: ListaPlanesDisponiblesProps) {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();

  // Filtrar solo planes de años pasados (esos sí los ocultamos)
  const planesVisibles = planes.filter(plan => !plan.anio || plan.anio >= anioActual);

  if (planesVisibles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted-foreground/2 rounded-xl bg-muted/5 text-center space-y-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative p-6 bg-background rounded-full shadow-sm border">
            <Crown className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
            Próximamente Temporada {anioActual}
          </h3>
          <p className="text-muted-foreground">
            Estamos terminando de definir los planes para este año. 
            ¡Muy pronto vas a poder inscribirte!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {planesVisibles.map((plan) => {
        const { abierto, mensaje } = calcularEstadoPlan(plan);

        return (
          <PlanPagoCard
            key={plan.codigo}
            plan={plan}
            abierto={abierto}
            mensaje={mensaje}
            onInscribirse={onInscribirse}
          />
        );
      })}
    </div>
  );
}

