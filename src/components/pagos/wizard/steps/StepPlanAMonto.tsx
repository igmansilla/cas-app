/**
 * Step Plan A - Monto.
 */
import React from 'react';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Switch } from '../../../ui/switch';
import { DollarSign } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';

export function StepPlanAMonto({ form }: WizardStepProps) {
    const formatCurrency = (val: number) => {
        if (!val && val !== 0) return "";
        return Number(val).toLocaleString("es-AR");
    };

    const parseCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = e.target.value.replace(/\D/g, "");
        return clean ? Number(clean) : 0;
    };

    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <DollarSign className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Plan A - Monto</h3>
                    <p className="text-xs text-muted-foreground">Define el costo total del plan principal.</p>
                </div>
            </div>

            <div className="space-y-4">
                <form.Field
                    name="montoTotal"
                    validators={{
                        onChange: ({ value }: { value: number }) =>
                            value < 1000 ? 'El monto debe ser al menos $1.000' : undefined
                    }}
                >
                    {(field: any) => (
                        <div className="space-y-2">
                            <Label htmlFor="montoTotal">Monto Total Plan A</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="montoTotal"
                                    value={formatCurrency(field.state.value)}
                                    onChange={e => field.handleChange(parseCurrency(e))}
                                    className={`pl-7 text-lg font-semibold ${field.state.meta.errors?.length ? "border-red-500" : ""}`}
                                />
                            </div>
                            {field.state.meta.errors?.length > 0 && (
                                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                            )}
                        </div>
                    )}
                </form.Field>

                <form.Field name="activo">
                    {(field: any) => (
                        <div className="flex items-center space-x-2 pt-2 p-4 bg-muted/30 rounded-lg">
                            <Switch id="activo" checked={field.state.value} onCheckedChange={field.handleChange} />
                            <Label htmlFor="activo" className="cursor-pointer">Habilitar plan inmediatamente para inscripciones</Label>
                        </div>
                    )}
                </form.Field>
            </div>
        </div>
    );
}
