/**
 * Lista de Planes Disponibles para Inscripción
 */

import { type PlanPago } from "../../api/schemas/pagos";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface ListaPlanesDisponiblesProps {
  planes: PlanPago[];
  onInscribirse: (plan: PlanPago) => void;
}

const MESES_NUMERO: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

// Helper para convertir mes a nombre
function getMesNombre(mes: string | number | undefined): string {
  if (mes === undefined || mes === null) return 'N/A';
  if (typeof mes === 'number') return MESES_NUMERO[mes] || `Mes ${mes}`;
  // Si es string tipo "APRIL", extraer
  const mesUpper = mes.toUpperCase();
  const mesesMap: Record<string, string> = {
    'JANUARY': 'Enero', 'FEBRUARY': 'Febrero', 'MARCH': 'Marzo', 'APRIL': 'Abril',
    'MAY': 'Mayo', 'JUNE': 'Junio', 'JULY': 'Julio', 'AUGUST': 'Agosto',
    'SEPTEMBER': 'Septiembre', 'OCTOBER': 'Octubre', 'NOVEMBER': 'Noviembre', 'DECEMBER': 'Diciembre',
  };
  return mesesMap[mesUpper] || mes;
}

export function ListaPlanesDisponibles({ planes, onInscribirse }: ListaPlanesDisponiblesProps) {
  if (planes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium">No hay planes disponibles</h3>
        <p className="text-muted-foreground">En este momento no hay planes de pago habilitados para inscripción.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {planes.map((plan) => {
        const esPlanA = plan.estrategia === 'PLAN_A';
        const planB = plan.planDestino as PlanPago | undefined;
        
        return (
          <Card key={plan.codigo} className="flex flex-col relative overflow-hidden group hover:border-primary/50 transition-all border-2">
            {/* Strategy Indicator */}
            <div className="absolute top-0 right-0 p-2">
               <Badge 
                 variant="secondary" 
                 className={esPlanA 
                   ? "bg-primary/10 text-primary border-primary/20" 
                   : "bg-orange-100 text-orange-700 border-orange-200"
                 }
               >
                  {esPlanA ? 'PLAN A' : 'PLAN B'}
               </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                 {esPlanA 
                   ? <ShieldCheck className="w-5 h-5 text-primary" />
                   : <AlertTriangle className="w-5 h-5 text-orange-500" />
                 }
                 {plan.nombre}
              </CardTitle>
              <CardDescription>Plan anual {plan.anio}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
               <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Monto Total:</span>
                      <span className="text-xl font-bold text-primary">${Number(plan.montoTotal).toLocaleString('es-AR')}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Cuotas:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {plan.minCuotas === plan.maxCuotas 
                          ? `${plan.maxCuotas} cuotas`
                          : `${plan.minCuotas} a ${plan.maxCuotas} cuotas`
                        }
                      </Badge>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Vigencia:</span>
                      <span className="text-sm font-medium">
                        {getMesNombre(plan.mesInicio)} - {getMesNombre(plan.mesFin)}
                      </span>
                   </div>
               </div>

               {/* Reglas solo para Plan A */}
               {esPlanA && plan.mesInicioControlAtraso && (
                 <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                       <Zap className="w-3 h-3 text-orange-500" /> 
                       Condiciones para mantener este plan
                    </p>
                    <div className="text-[11px] space-y-1 text-muted-foreground leading-tight">
                       <p className="flex items-start gap-1">
                          <span className="text-primary font-bold">•</span>
                          <span>Tener al menos <strong>{plan.cuotasMinimasAntesControl} cuotas pagadas</strong> para <strong>{MESES_NUMERO[plan.mesInicioControlAtraso]}</strong>.</span>
                       </p>
                       <p className="flex items-start gap-1">
                          <span className="text-primary font-bold">•</span>
                          <span>A partir de {MESES_NUMERO[plan.mesInicioControlAtraso]}, no acumular más de <strong>{plan.mesesAtrasoParaTransicion} meses</strong> de atraso.</span>
                       </p>
                       {planB && (
                         <div className="text-orange-700 dark:text-orange-400 font-medium pt-2 mt-2 border-t border-muted-foreground/20 space-y-1">
                            <p className="flex items-start gap-1">
                               <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                               <span>Si no cumplís las condiciones, pasarás automáticamente al <strong>{planB.nombre}</strong>:</span>
                            </p>
                            <p className="ml-4 text-[10px]">
                              ${Number(planB.montoTotal).toLocaleString('es-AR')} en {planB.minCuotas} a {planB.maxCuotas} cuotas ({getMesNombre(planB.mesInicio)} - {getMesNombre(planB.mesFin)})
                            </p>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {/* Info para Plan B */}
               {!esPlanA && (
                 <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                       Este plan está disponible para inscripciones tardías (a partir de Julio) o para quienes no cumplieron las condiciones del Plan A.
                    </p>
                 </div>
               )}
            </CardContent>

            <CardFooter>
              <Button className="w-full font-bold shadow-lg" onClick={() => onInscribirse(plan)}>
                Inscribirme ahora
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

