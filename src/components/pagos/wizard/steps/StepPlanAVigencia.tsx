/**
 * Step Plan A - Vigencia.
 */
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { CalendarDays } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES } from '../wizard-types';
import { TimelinePreview } from '../components/TimelinePreview';

export function StepPlanAVigencia({ form }: WizardStepProps) {
    const anioPlan = form.getFieldValue('anio') || new Date().getFullYear();

    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Plan A - Vigencia</h3>
                    <p className="text-xs text-muted-foreground">Define cuándo empieza y termina el plan de pagos.</p>
                </div>
            </div>

            <div className="space-y-6">
                <form.Subscribe selector={(state: any) => [state.values.mesInicioHabilitado, state.values.mesFinHabilitado]}>
                    {([inicio, fin]: any[]) => (
                        <TimelinePreview start={inicio} end={fin} />
                    )}
                </form.Subscribe>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field name="mesInicioHabilitado">
                        {(field: any) => (
                            <div className="space-y-2">
                                <Label>Mes Inicio (Primera Cuota)</Label>
                                <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                    <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MESES.map(m => (
                                            <SelectItem key={m.val} value={String(m.val)}>
                                                {m.label} <span className="text-muted-foreground text-xs ml-1">({anioPlan})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="mesFinHabilitado">
                        {(field: any) => {
                            const inicio = form.getFieldValue('mesInicioHabilitado');
                            return (
                                <div className="space-y-2">
                                    <Label>Mes Fin (Última Cuota)</Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {MESES.map(m => {
                                                const isNextYear = inicio && m.val < inicio;
                                                const yearDisplay = isNextYear ? anioPlan + 1 : anioPlan;
                                                const highlight = isNextYear ? "text-orange-600 font-medium" : "text-muted-foreground";
                                                return (
                                                    <SelectItem key={m.val} value={String(m.val)}>
                                                        {m.label} <span className={`${highlight} text-xs ml-1`}>({yearDisplay})</span>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        }}
                    </form.Field>
                </div>

                <form.Field name="diaVencimiento">
                    {(field: any) => (
                        <div className="space-y-2">
                            <Label>Día de Vencimiento Mensual</Label>
                            <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar día" /></SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 15, 20, 25].map(d => <SelectItem key={d} value={String(d)}>Día {d} de cada mes</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Fecha límite de pago para cada cuota.</p>
                        </div>
                    )}
                </form.Field>
            </div>
        </div>
    );
}
