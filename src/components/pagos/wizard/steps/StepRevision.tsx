/**
 * Step Revisión - Confirmación final con resumen de Plan A, B, C y reglas de migración.
 */
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES, ultimoDiaMes } from '../wizard-types';

export function StepRevision({ form }: WizardStepProps) {
    const fmt = (val: number) => {
        if (!val && val !== 0) return "";
        return Number(val).toLocaleString("es-AR");
    };

    const cuotas = (ini: number, fin: number) => {
        if (!ini || !fin) return 0;
        return fin >= ini ? (fin - ini + 1) : (12 - ini + 1) + fin;
    };

    const mesLabel = (val: number) => MESES.find(m => m.val === val)?.label || '?';

    return (
        <div className="grid gap-3 sm:gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Revisión Final</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Confirmá los datos antes de crear los planes.</p>
                </div>
            </div>

            <form.Subscribe selector={(state: any) => state.values}>
                {(v: any) => {
                    const cA = cuotas(v.mesInicioHabilitado, v.mesFinHabilitado);
                    const cB = cuotas(v.planB_mesInicioHabilitado, v.planB_mesFinHabilitado);
                    const cC = cuotas(v.planC_mesInicioHabilitado, v.planC_mesFinHabilitado);

                    return (
                        <div className="grid gap-3">
                            {/* Plan Cards - stacked on mobile */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                {/* Plan A */}
                                <PlanCard
                                    label="A" name={v.nombreParaMostrar}
                                    monto={v.montoTotal} cuotas={cA}
                                    inicio={mesLabel(v.mesInicioHabilitado)} fin={mesLabel(v.mesFinHabilitado)}
                                    colorBorder="border-l-orange-500" colorText="text-orange-600"
                                    colorBadgeBg="bg-orange-100" colorBadgeText="text-orange-700"
                                    fmt={fmt}
                                />
                                {/* Plan B */}
                                <PlanCard
                                    label="B" name={v.planB_nombreParaMostrar}
                                    monto={v.planB_montoTotal} cuotas={cB}
                                    inicio={mesLabel(v.planB_mesInicioHabilitado)} fin={mesLabel(v.planB_mesFinHabilitado)}
                                    colorBorder="border-l-orange-600" colorText="text-orange-700"
                                    colorBadgeBg="bg-orange-50" colorBadgeText="text-orange-800"
                                    fmt={fmt}
                                />
                                {/* Plan C */}
                                <PlanCard
                                    label="C" name={v.planC_nombreParaMostrar}
                                    monto={v.planC_montoTotal} cuotas={cC}
                                    inicio={mesLabel(v.planC_mesInicioHabilitado)} fin={mesLabel(v.planC_mesFinHabilitado)}
                                    colorBorder="border-l-red-500" colorText="text-red-600"
                                    colorBadgeBg="bg-red-100" colorBadgeText="text-red-700"
                                    fmt={fmt}
                                />
                            </div>

                            {/* Migraciones */}
                            <div className="p-3 rounded-lg border bg-card">
                                <h4 className="font-semibold text-purple-600 mb-2 text-sm">Reglas de Migración</h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <MigCard
                                        from="A" to="B"
                                        mes={mesLabel(v.migA_mesInicioControl)}
                                        cuotas={v.migA_cuotasMinimasRequeridas}
                                        atraso={v.migA_mesesAtrasoParaMigrar}
                                    />
                                    <MigCard
                                        from="B" to="C"
                                        mes={mesLabel(v.migB_mesInicioControl)}
                                        cuotas={v.migB_cuotasMinimasRequeridas}
                                        atraso={v.migB_mesesAtrasoParaMigrar}
                                    />
                                </div>
                            </div>

                            {/* Devolución */}
                            <div className="p-3 rounded-lg border bg-card">
                                <h4 className="font-semibold text-green-600 mb-2 text-sm">Devoluciones</h4>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs sm:text-sm">
                                    <span><span className="text-muted-foreground">100% hasta</span> <strong className="text-green-600">{ultimoDiaMes(v.mesLimiteDevolucion100)}/{v.mesLimiteDevolucion100}</strong></span>
                                    <span><span className="text-muted-foreground">50% hasta</span> <strong className="text-yellow-600">{ultimoDiaMes(v.mesLimiteDevolucion50)}/{v.mesLimiteDevolucion50}</strong></span>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </form.Subscribe>
        </div>
    );
}

// Mini-card de plan
function PlanCard({ label, name, monto, cuotas, inicio, fin, colorBorder, colorText, colorBadgeBg, colorBadgeText, fmt }: {
    label: string; name: string; monto: number; cuotas: number; inicio: string; fin: string;
    colorBorder: string; colorText: string; colorBadgeBg: string; colorBadgeText: string;
    fmt: (v: number) => string;
}) {
    return (
        <div className={`p-3 rounded-lg border bg-card border-l-4 ${colorBorder}`}>
            <h4 className={`font-semibold ${colorText} mb-2 flex items-center gap-1.5 text-sm`}>
                <span className={`w-5 h-5 rounded-full ${colorBadgeBg} flex items-center justify-center text-[10px] font-bold ${colorBadgeText}`}>{label}</span>
                {name}
            </h4>
            <dl className="space-y-0.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className={`font-medium ${colorText}`}>${fmt(monto)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Cuotas</dt>
                    <dd className="font-medium">{cuotas} × ${fmt(Math.round(monto / (cuotas || 1)))}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Vigencia</dt>
                    <dd className="font-medium">{inicio} – {fin}</dd>
                </div>
            </dl>
        </div>
    );
}

// Mini-card de migración
function MigCard({ from, to, mes, cuotas, atraso }: { from: string; to: string; mes: string; cuotas: number; atraso: number }) {
    return (
        <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-semibold text-purple-700 flex-shrink-0 mt-0.5">
                {from} <ArrowRight className="w-3 h-3" /> {to}
            </div>
            <div className="text-muted-foreground leading-relaxed">
                Si en <strong>{mes}</strong> debe ≥ <strong>{cuotas}</strong> cuotas y tiene <strong>{atraso}+</strong> meses de atraso.
            </div>
        </div>
    );
}
