/**
 * Step Devolución - Políticas de reembolso.
 */
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Card, CardContent } from '../../../ui/card';
import { Undo2 } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES, ultimoDiaMes } from '../wizard-types';

export function StepDevolucion({ form }: WizardStepProps) {
    return (
        <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600">
                    <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Políticas de Devolución</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Reglas de reembolso si un acampante se da de baja.</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <span className="text-lg flex-shrink-0">💰</span>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Si un acampante solicita darse de baja, el porcentaje de devolución dependerá del mes en que lo solicite.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <form.Field name="mesLimiteDevolucion100">
                            {(field: any) => {
                                const mes = field.state.value;
                                return (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                                            100% Devolución hasta
                                        </Label>
                                        <Select value={String(mes)} onValueChange={(v) => field.handleChange(Number(v))}>
                                            <SelectTrigger className="border-l-4 border-l-green-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <div className="text-[10px] leading-tight">
                                            <p className="font-bold text-green-700">Hasta el {ultimoDiaMes(mes)}/{mes} 23:59hs</p>
                                            <p className="text-muted-foreground">Reembolso total del saldo a favor</p>
                                        </div>
                                    </div>
                                );
                            }}
                        </form.Field>

                        <form.Field name="mesLimiteDevolucion50">
                            {(field: any) => {
                                const mes = field.state.value;
                                return (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px] font-bold">½</span>
                                            50% Devolución hasta
                                        </Label>
                                        <Select value={String(mes)} onValueChange={(v) => field.handleChange(Number(v))}>
                                            <SelectTrigger className="border-l-4 border-l-yellow-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <div className="text-[10px] leading-tight">
                                            <p className="font-bold text-yellow-700">Hasta el {ultimoDiaMes(mes)}/{mes} 23:59hs</p>
                                            <p className="text-muted-foreground">Reembolso parcial del saldo a favor</p>
                                        </div>
                                    </div>
                                );
                            }}
                        </form.Field>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center text-white text-[10px] font-bold">✗</span>
                        Después del mes de 50%, no se realiza devolución (0%).
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
