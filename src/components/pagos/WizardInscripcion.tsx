/**
 * Wizard de Inscripción - Mobile First
 * 
 * Guía al usuario paso a paso para entender el plan, simular pagos y confirmar.
 * Usa stepperize para el manejo de pasos.
 */

import { useState } from "react";
import { type PlanPago, type InscripcionRequest } from "../../api/schemas/pagos";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { 
    CheckCircle2, 
    Calendar, 
    DollarSign, 
    ChevronRight, 
    ShieldCheck, 
    AlertTriangle,
    ChevronDown,
    Clock
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { InscripcionStepper } from "./wizard-inscripcion-stepper";

interface WizardInscripcionProps {
  abierto: boolean;
  plan: PlanPago | null;
  cargando: boolean;
  idUsuario: string;
  onCerrar: () => void;
  onConfirmar: (datos: InscripcionRequest) => void;
}

const MESES_NUMERO: Record<number, string> = {
  1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
  5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
  9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic',
};

const MESES_LARGO: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const MESES_ENUM: Record<number, string> = {
  1: 'JANUARY', 2: 'FEBRUARY', 3: 'MARCH', 4: 'APRIL',
  5: 'MAY', 6: 'JUNE', 7: 'JULY', 8: 'AUGUST',
  9: 'SEPTEMBER', 10: 'OCTOBER', 11: 'NOVEMBER', 12: 'DECEMBER',
};

function getMesNumero(mes: string | number): number {
    if (typeof mes === 'number') return mes;
    const map: Record<string, number> = {
      'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
      'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
      'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12,
    };
    return map[mes.toUpperCase()] || 1;
}

export function WizardInscripcion({
  abierto,
  plan,
  cargando,
  idUsuario,
  onCerrar,
  onConfirmar,
}: WizardInscripcionProps) {
  if (!plan) return null;

  return (
    <InscripcionStepper.Scoped>
      <WizardInscripcionContent 
        abierto={abierto}
        plan={plan}
        cargando={cargando}
        idUsuario={idUsuario}
        onCerrar={onCerrar}
        onConfirmar={onConfirmar}
      />
    </InscripcionStepper.Scoped>
  );
}

function WizardInscripcionContent({
  abierto,
  plan,
  cargando,
  idUsuario,
  onCerrar,
  onConfirmar,
}: WizardInscripcionProps & { plan: PlanPago }) {
  const stepper = InscripcionStepper.useStepper();
  const [aceptado, setAceptado] = useState(false);
  const [reglasAbiertas, setReglasAbiertas] = useState(false);

  const handleClose = () => {
    stepper.reset();
    setAceptado(false);
    setReglasAbiertas(false);
    onCerrar();
  };

  // Cálculos de fechas y cuotas - FIXED
  const mesActual = new Date().getMonth() + 1;
  const mesInicioPlan = getMesNumero(plan.mesInicio);
  const mesInicioReal = Math.max(mesInicioPlan, mesActual);
  
  const cuotasTotales = plan.maxCuotas || 10;
  const cuotasAtrasadas = mesInicioReal > mesInicioPlan ? mesInicioReal - mesInicioPlan : 0;
  // FIX: Calculate remaining correctly
  const cuotasRestantes = Math.max(0, cuotasTotales - cuotasAtrasadas);
  const montoEstimadoMensual = Number(plan.montoTotal) / cuotasTotales;

  const planDestino = plan.planDestino as PlanPago | undefined;
  const esPlanA = plan.estrategia === 'PLAN_A';
  const esPlanB = plan.estrategia === 'PLAN_B';
  const esPlanC = plan.estrategia === 'PLAN_C';
  
  const planLabel = esPlanA ? 'Plan A' : (esPlanB ? 'Plan B' : 'Plan C');

  const handleConfirmar = () => {
    if (!idUsuario) return;
    onConfirmar({
        idUsuario,
        codigoPlan: plan.codigo,
        mesInicio: MESES_ENUM[mesInicioReal] || 'JANUARY',
        cuotasDeseadas: cuotasTotales
    });
  };

  // Generate timeline bubbles
  const timelineMeses = Array.from({ length: cuotasTotales }, (_, i) => {
    const mes = ((mesInicioPlan - 1 + i) % 12) + 1;
    const esPagado = false; // Future: from backend
    const esAtrasado = i < cuotasAtrasadas;
    const esPrimerCuota = i === cuotasAtrasadas;
    return { mes, esPagado, esAtrasado, esPrimerCuota, index: i + 1 };
  });

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full h-full sm:h-auto sm:max-w-[500px] max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header with stepper */}
        <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-center text-base">{plan.nombre}</DialogTitle>
          <div className="flex justify-center gap-6 pt-3">
            {stepper.all.map((step, idx) => {
                const currentIndex = stepper.all.indexOf(stepper.current);
                const isCompleted = idx < currentIndex;
                const isCurrent = stepper.current.id === step.id;
                
                return (
                    <div key={step.id} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'}
                        `}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {step.title}
                        </span>
                    </div>
                );
            })}
          </div>
        </DialogHeader>

        <div className="p-4 flex-1 overflow-y-auto">
            {stepper.switch({
                // STEP 1: HERO + QUICK FACTS + COLLAPSIBLE RULES
                detalles: () => (
                    <div className="space-y-4">
                        {/* Hero Section */}
                        <div className="text-center py-6 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
                            <Badge variant="outline" className="mb-2">{planLabel}</Badge>
                            <p className="text-4xl font-bold text-primary">${Number(plan.montoTotal).toLocaleString('es-AR')}</p>
                            <p className="text-sm text-muted-foreground mt-1">Total Ciclo {plan.anio}</p>
                        </div>

                        {/* Quick Facts - 3 mini cards */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-muted/50 rounded-lg p-3">
                                <Calendar className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Vigencia</p>
                                <p className="text-sm font-semibold">{MESES_NUMERO[getMesNumero(plan.mesInicio)]} - {MESES_NUMERO[getMesNumero(plan.mesFin)]}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <DollarSign className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Cuotas</p>
                                <p className="text-sm font-semibold">{cuotasTotales} cuotas</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Vence día</p>
                                <p className="text-sm font-semibold">{plan.diaVencimiento}</p>
                            </div>
                        </div>

                        {/* Collapsible Rules for Plan A */}
                        {esPlanA && plan.mesInicioControlAtraso && (
                            <Collapsible open={reglasAbiertas} onOpenChange={setReglasAbiertas}>
                                <CollapsibleTrigger asChild>
                                    <button className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg text-left">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-orange-600" />
                                            <span className="font-medium text-sm text-orange-800 dark:text-orange-200">Condiciones del {planLabel}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${reglasAbiertas ? 'rotate-180' : ''}`} />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2">
                                    <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg p-3 space-y-3 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-orange-500">•</span>
                                            <p className="text-orange-800 dark:text-orange-200">
                                                Tener <strong>{plan.cuotasMinimasAntesControl} cuotas pagas</strong> antes de <strong>{MESES_LARGO[plan.mesInicioControlAtraso]}</strong>.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-orange-500">•</span>
                                            <p className="text-orange-800 dark:text-orange-200">
                                                No acumular más de <strong>{plan.mesesAtrasoParaTransicion} meses</strong> de deuda.
                                            </p>
                                        </div>
                                        {(esPlanA || esPlanB) && planDestino && (
                                            <div className="pt-2 border-t border-orange-200/50">
                                                <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Si no cumplís, pasás al {planDestino.nombre} (${Number(planDestino.montoTotal).toLocaleString('es-AR')})
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )}

                        {esPlanC && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                                Plan de inscripción tardía última instancia.
                            </div>
                        )}
                    </div>
                ),

                // STEP 2: VISUAL TIMELINE
                compromiso: () => (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-bold">Tu Cronograma</h3>
                            <p className="text-sm text-muted-foreground">
                                Hoy: <strong>{MESES_LARGO[mesActual]}</strong>
                            </p>
                        </div>

                        {/* Timeline Bubbles */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {timelineMeses.map((item) => (
                                <div 
                                    key={item.index}
                                    className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center text-xs font-medium border-2 transition-all
                                        ${item.esAtrasado 
                                            ? 'bg-orange-100 border-orange-400 text-orange-700' 
                                            : item.esPrimerCuota 
                                                ? 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/20' 
                                                : 'bg-muted/50 border-muted-foreground/20 text-muted-foreground'
                                        }
                                    `}
                                >
                                    <span className="font-bold">{MESES_NUMERO[item.mes]}</span>
                                    <span className="text-[9px] opacity-70">#{item.index}</span>
                                    {item.esPrimerCuota && (
                                        <span className="absolute -bottom-5 text-[10px] text-primary font-semibold whitespace-nowrap">
                                            Tu inicio
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold text-primary">{cuotasRestantes}</p>
                                <p className="text-xs text-muted-foreground">cuotas a pagar</p>
                            </div>
                            <div className={`rounded-xl p-4 text-center ${cuotasAtrasadas > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                                <p className={`text-3xl font-bold ${cuotasAtrasadas > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {cuotasAtrasadas}
                                </p>
                                <p className={`text-xs ${cuotasAtrasadas > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {cuotasAtrasadas > 0 ? 'cuotas atrasadas' : '¡Al día!'}
                                </p>
                            </div>
                        </div>

                        {cuotasAtrasadas > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                                Al inscribirte, se generarán las {cuotasAtrasadas} cuotas pendientes para ponerte al día.
                            </p>
                        )}

                        {/* Monthly estimate */}
                        <div className="text-center pt-2 text-sm text-muted-foreground">
                            Cuota estimada: <strong className="text-foreground">~${Math.round(montoEstimadoMensual).toLocaleString('es-AR')}/mes</strong>
                        </div>
                    </div>
                ),

                // STEP 3: CONFIRMATION
                confirmacion: () => (
                    <div className="space-y-6 py-4">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold">¡Listo para inscribirte!</h3>
                        </div>

                        {/* Summary */}
                        <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Plan</span>
                                <span className="font-medium">{plan.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tu inicio</span>
                                <span className="font-medium">{MESES_LARGO[mesInicioReal]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cuotas</span>
                                <span className="font-medium">{cuotasRestantes} + {cuotasAtrasadas} atrasadas</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-primary">${Number(plan.montoTotal).toLocaleString('es-AR')}</span>
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <Checkbox 
                                id="terminos" 
                                checked={aceptado}
                                onCheckedChange={(c) => setAceptado(c as boolean)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="terminos" className="text-xs leading-relaxed cursor-pointer font-normal text-muted-foreground">
                                Acepto el compromiso de pago y las condiciones del plan.
                            </Label>
                        </div>
                    </div>
                ),
            })}
        </div>

        {/* Footer with navigation */}
        <DialogFooter className="p-4 pt-2 border-t sticky bottom-0 bg-background flex-row gap-2">
            {stepper.isFirst ? (
                <Button variant="ghost" onClick={handleClose} className="flex-1">Cancelar</Button>
            ) : (
                <Button variant="outline" onClick={() => stepper.prev()} className="flex-1">Atrás</Button>
            )}

            {stepper.isLast ? (
                <Button onClick={handleConfirmar} disabled={!aceptado || cargando} className="flex-1">
                    {cargando ? "..." : "Confirmar"}
                </Button>
            ) : (
                <Button onClick={() => stepper.next()} className="flex-1">
                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
