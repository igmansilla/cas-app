/**
 * Step Devolución - Políticas de reembolso.
 */
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Card, CardContent } from '../../../ui/card';
import { Undo2 } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES } from '../wizard-types';

export function StepDevolucion({ form }: WizardStepProps) {
    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <Undo2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Políticas de Devolución</h3>
                    <p className="text-xs text-muted-foreground">Configura las reglas de reembolso si un acampante se da de baja.</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                            <span className="text-xl">💰</span>
                            ¿Cómo funciona?
                        </h5>
                        <p className="text-sm text-muted-foreground">
                            Si un acampante solicita darse de baja, el porcentaje de devolución dependerá del mes en que lo solicite.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <form.Field name="mesLimiteDevolucion100">
                            {(field: any) => (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                                        100% Devolución hasta
                                    </Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger className="border-l-4 border-l-green-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-green-600">Reembolso total del saldo a favor</p>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="mesLimiteDevolucion50">
                            {(field: any) => (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px] font-bold">½</span>
                                        50% Devolución hasta
                                    </Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger className="border-l-4 border-l-yellow-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-yellow-600">Reembolso parcial del saldo a favor</p>
                                </div>
                            )}
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
