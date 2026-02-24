/**
 * Step Revisión - Confirmación final.
 */
import { CheckCircle2 } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES, ultimoDiaMes } from '../wizard-types';
import { type ReglaTransicionRequest } from '../../../../api/schemas/pagos';

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
                                        {MESES.find((m: any) => m.val === values.mesInicioHabilitado)?.label} - {MESES.find((m: any) => m.val === values.mesFinHabilitado)?.label}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Reglas de Transición */}
                        {values.reglasTransicion && values.reglasTransicion.length > 0 && (
                            <div className="md:col-span-2 space-y-4">
                                <h4 className="font-semibold text-violet-600 border-b pb-2">Reglas de Transición (Planes de Contingencia)</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {values.reglasTransicion.map((regla: ReglaTransicionRequest, i: number) => (
                                        <div key={i} className="p-4 rounded-lg border bg-violet-50/30">
                                            <h5 className="font-semibold text-violet-800 mb-2 font-sm flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-[10px]">{i + 1}</span>
                                                Destino: {regla.codigoDestino || 'Auto-generado'}
                                            </h5>
                                            <dl className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Monto Total</dt>
                                                    <dd className="font-medium text-violet-700">${formatCurrency(regla.montoTotalDestino)}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Control desde</dt>
                                                    <dd className="font-medium">{MESES.find(m => m.val === regla.mesInicioControl)?.label}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Cuotas exigibles</dt>
                                                    <dd className="font-medium">{regla.cuotasMinimasRequeridas}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Meses de atraso</dt>
                                                    <dd className="font-medium text-red-600">{regla.mesesAtrasoParaMigrar} o más</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Devolución */}
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-semibold text-green-600 mb-3">Políticas de Devolución</h4>
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">100% hasta</dt>
                                    <dd className="font-medium text-green-600">
                                        {ultimoDiaMes(values.mesLimiteDevolucion100)}/{values.mesLimiteDevolucion100} 23:59hs
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">50% hasta</dt>
                                    <dd className="font-medium text-yellow-600">
                                        {ultimoDiaMes(values.mesLimiteDevolucion50)}/{values.mesLimiteDevolucion50} 23:59hs
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </form.Subscribe>
        </div>
    );
}
