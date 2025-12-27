/**
 * Step Revisión - Confirmación final.
 */
import { CheckCircle2 } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES } from '../wizard-types';

export function StepRevision({ form }: WizardStepProps) {
    const formatCurrency = (val: number) => {
        if (!val && val !== 0) return "";
        return Number(val).toLocaleString("es-AR");
    };

    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Revisión Final</h3>
                    <p className="text-xs text-muted-foreground">Confirma los datos antes de crear los planes.</p>
                </div>
            </div>

            <form.Subscribe selector={(state: any) => state.values}>
                {(values: any) => (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Plan A */}
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">A</span>
                                Plan A
                            </h4>
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Nombre</dt>
                                    <dd className="font-medium">{values.nombreParaMostrar}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Monto Total</dt>
                                    <dd className="font-medium text-green-600">${formatCurrency(values.montoTotal)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Vigencia</dt>
                                    <dd className="font-medium">
                                        {MESES.find(m => m.val === values.mesInicioHabilitado)?.label} - {MESES.find(m => m.val === values.mesFinHabilitado)?.label}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Plan B */}
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs">B</span>
                                Plan B
                            </h4>
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Monto Total</dt>
                                    <dd className="font-medium text-orange-600">${formatCurrency(values.montoTotalPlanB)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Recargo</dt>
                                    <dd className="font-medium">+${formatCurrency((values.montoTotalPlanB || 0) - (values.montoTotal || 0))}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Migración */}
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-semibold text-violet-600 mb-3">Políticas de Migración</h4>
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Control desde</dt>
                                    <dd className="font-medium">{MESES.find(m => m.val === values.mesInicioControlAtraso)?.label}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Cuotas mínimas</dt>
                                    <dd className="font-medium">{values.cuotasMinimasAntesControl}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Tolerancia</dt>
                                    <dd className="font-medium">{values.mesesAtrasoParaTransicion} meses</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Devolución */}
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-semibold text-green-600 mb-3">Políticas de Devolución</h4>
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">100% hasta</dt>
                                    <dd className="font-medium text-green-600">{MESES.find(m => m.val === values.mesLimiteDevolucion100)?.label}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">50% hasta</dt>
                                    <dd className="font-medium text-yellow-600">{MESES.find(m => m.val === values.mesLimiteDevolucion50)?.label}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </form.Subscribe>
        </div>
    );
}
