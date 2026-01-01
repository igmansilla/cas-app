/**
 * Lista de Planes Disponibles para Inscripción
 * Diseño minimalista - toda la info detallada está en el Wizard
 */

import { Crown, Star } from "lucide-react";
import { type PlanPago, AudienciaPlan } from "../../api/schemas/pagos";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { getAudienciaInfo } from "./utils/audienciaUtils";

interface ListaPlanesDisponiblesProps {
  planes: PlanPago[];
  onInscribirse: (plan: PlanPago) => void;
}

export function ListaPlanesDisponibles({ planes, onInscribirse }: ListaPlanesDisponiblesProps) {
  // Filtrar planes cuyo período de inscripción ya cerró
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1; // 1-12

  const planesVigentes = planes.filter(plan => {
    // Si no tiene año definido, mostrar por defecto
    if (!plan.anio) return true;
    
    // Si el plan es de un año futuro, mostrar
    if (plan.anio > anioActual) return true;
    
    // Si el plan es de un año pasado, ocultar
    if (plan.anio < anioActual) return false;
    
    // Mismo año: verificar mes límite de inscripción
    const mesLimite = plan.mesLimiteInscripcion;
    if (mesLimite === undefined || mesLimite === null) return true;
    
    // Si ya pasó el mes límite, ocultar
    return mesActual <= mesLimite;
  });

  if (planesVigentes.length === 0) {
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
      {planesVigentes.map((plan) => {
        const esPlanA = plan.estrategia === 'PLAN_A';
        const audienciaInfo = getAudienciaInfo(plan.audiencia as AudienciaPlan | undefined);
        const AudienciaIcon = audienciaInfo.icon;

        return (
          <Card 
            key={plan.codigo} 
            className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group
              ${esPlanA 
                ? 'border-amber-400/50 hover:border-amber-500 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20' 
                : 'border-slate-300/50 hover:border-slate-400 bg-gradient-to-br from-slate-100/50 to-transparent dark:from-slate-800/20'
              }
            `}
            onClick={() => onInscribirse(plan)}
          >
            {/* Top Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              <Badge
                variant="secondary"
                className={esPlanA
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200"
                  : "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200"
                }
              >
                {esPlanA ? 'PLAN A' : 'PLAN B'}
              </Badge>
              <Badge
                variant="outline"
                className={`${audienciaInfo.bgClass} ${audienciaInfo.textClass} ${audienciaInfo.borderClass} flex items-center gap-1 text-[10px]`}
              >
                <AudienciaIcon className="w-3 h-3" />
                {audienciaInfo.label}
              </Badge>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {esPlanA
                  ? <Crown className="w-5 h-5 text-amber-500" />
                  : <Star className="w-5 h-5 text-slate-400" />
                }
                {plan.nombre}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Ciclo {plan.anio}</p>
            </CardHeader>

            <CardContent className="pb-2">
              <p className={`text-3xl font-bold ${esPlanA ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                ${Number(plan.montoTotal).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.maxCuotas} cuotas
              </p>
            </CardContent>

            <CardFooter className="pt-2">
              <Button 
                className={`w-full transition-colors ${esPlanA 
                  ? 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500' 
                  : 'group-hover:bg-slate-500 group-hover:text-white group-hover:border-slate-500'
                }`}
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onInscribirse(plan); }}
              >
                Ver detalles
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
