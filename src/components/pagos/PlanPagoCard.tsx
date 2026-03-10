import { Trophy, Medal, Lock, LockOpen } from "lucide-react";
import { type PlanPago, AudienciaPlan, EstrategiaPlan } from "../../api/schemas/pagos";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { getAudienciaInfo } from "./utils/audienciaUtils";

export interface PlanPagoCardProps {
  plan: PlanPago;
  abierto: boolean;
  mensaje: string;
  onInscribirse: (plan: PlanPago) => void;
}

export function PlanPagoCard({ plan, abierto, mensaje, onInscribirse }: PlanPagoCardProps) {
  const esPlanA = plan.estrategia === EstrategiaPlan.PLAN_A;
  const esPlanB = plan.estrategia === EstrategiaPlan.PLAN_B;
  const esPlanC = plan.estrategia === EstrategiaPlan.PLAN_C;
  
  let cardColors = 'border-slate-300/50 hover:border-slate-400 bg-gradient-to-br from-slate-100/50 to-transparent dark:from-slate-800/20';
  let priceColor = 'text-slate-600 dark:text-slate-300';
  let iconColor = 'text-slate-500';
  let buttonColors = 'group-hover:bg-slate-500 group-hover:text-white group-hover:border-slate-500';
  
  if (esPlanA) {
      // Oro / Gold
      cardColors = 'border-yellow-400/50 hover:border-yellow-500 bg-gradient-to-br from-yellow-50/50 to-transparent dark:from-yellow-950/20';
      priceColor = 'text-yellow-700 dark:text-yellow-400';
      iconColor = 'text-yellow-500';
      buttonColors = 'group-hover:bg-yellow-500 group-hover:text-white group-hover:border-yellow-500';
  } else if (esPlanB) {
      // Plata / Silver
      cardColors = 'border-slate-300/50 hover:border-slate-400 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/20';
      priceColor = 'text-slate-700 dark:text-slate-300';
      iconColor = 'text-slate-400';
      buttonColors = 'group-hover:bg-slate-500 group-hover:text-white group-hover:border-slate-500';
  } else if (esPlanC) {
      // Bronce / Bronze
      cardColors = 'border-orange-400/50 hover:border-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20';
      priceColor = 'text-orange-700 dark:text-orange-400';
      iconColor = 'text-orange-500';
      buttonColors = 'group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500';
  }

  const audienciaInfo = getAudienciaInfo(plan.audiencia as AudienciaPlan | undefined);
  const AudienciaIcon = audienciaInfo.icon;

  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group ${cardColors}`}
      onClick={() => abierto && onInscribirse(plan)}
    >
      {/* Estado de inscripción */}
      <div className="absolute top-2 left-2">
        <Badge
          variant={abierto ? "default" : "secondary"}
          className={`flex items-center gap-1 text-[10px] ${
            abierto 
              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200'
              : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200'
          }`}
        >
          {abierto ? <LockOpen className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {abierto ? 'Abierto' : 'Cerrado'}
        </Badge>
        {mensaje && (
          <p className="text-[9px] text-muted-foreground mt-0.5">{mensaje}</p>
        )}
      </div>

      {/* Top Badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
        <Badge
          variant="outline"
          className={`${audienciaInfo.bgClass} ${audienciaInfo.textClass} ${audienciaInfo.borderClass} flex items-center gap-1 text-[10px]`}
        >
          <AudienciaIcon className="w-3 h-3" />
          {audienciaInfo.label}
        </Badge>
      </div>

      <CardHeader className="pb-2 pt-10">
        <CardTitle className={`text-lg flex items-center gap-2 ${!abierto && 'opacity-60'}`}>
          {esPlanA && <Trophy className={`w-5 h-5 ${iconColor}`} />}
          {esPlanB && <Medal className={`w-5 h-5 ${iconColor}`} />}
          {esPlanC && <Medal className={`w-5 h-5 ${iconColor}`} />}
          {plan.nombre}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ciclo {plan.anio}</p>
      </CardHeader>

      <CardContent className={`pb-2 ${!abierto && 'opacity-60'}`}>
        <p className={`text-3xl font-bold ${priceColor}`}>
          ${Number(plan.montoTotal).toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-muted-foreground">
          {plan.maxCuotas} cuotas
        </p>
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
          className={`w-full transition-colors ${!abierto ? 'opacity-50 cursor-not-allowed' : buttonColors}`}
          variant="outline"
          disabled={!abierto}
          onClick={(e) => { e.stopPropagation(); if (abierto) onInscribirse(plan); }}
        >
          {abierto ? 'Ver detalles' : 'Inscripción cerrada'}
        </Button>
      </CardFooter>
    </Card>
  );
}
