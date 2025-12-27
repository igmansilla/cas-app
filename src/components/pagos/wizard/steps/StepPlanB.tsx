/**
 * Step Plan B.
 */
import React from 'react';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { DollarSign } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';

export function StepPlanB({ form }: WizardStepProps) {
    const montoTotalA = form.getFieldValue('montoTotal') || 0;

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
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                    <DollarSign className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Plan B - Plan Contingencia</h3>
                    <p className="text-xs text-muted-foreground">Se activa automáticamente cuando hay atrasos en Plan A.</p>
                </div>
            </div>

            <div className="space-y-4">
                <form.Field
                    name="montoTotalPlanB"
                    validators={{
                        onChange: ({ value, fieldApi }: { value: number; fieldApi: any }) => {
                            const montoA = fieldApi.form.getFieldValue('montoTotal') || 0;
                            if (value <= montoA) return 'El monto del Plan B debe ser mayor al Plan A';
                            return undefined;
                        }
                    }}
                >
                    {(field: any) => (
                        <div className="space-y-2">
                            <Label htmlFor="montoTotalPlanB">Monto Total Plan B</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="montoTotalPlanB"
                                    value={formatCurrency(field.state.value)}
                                    onChange={e => field.handleChange(parseCurrency(e))}
                                    className={`pl-7 text-lg font-semibold ${field.state.meta.errors?.length ? "border-red-500" : ""}`}
                                />
                            </div>
                            {field.state.meta.errors?.length > 0 && (
                                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                            )}
                            {field.state.value > 0 && montoTotalA > 0 && field.state.value > montoTotalA && (
                                <p className="text-xs text-orange-600 font-medium mt-1">
                                    Recargo: +${formatCurrency(field.state.value - montoTotalA)}
                                </p>
                            )}
                        </div>
                    )}
                </form.Field>

                <form.Field name="nombrePlanB">
                    {(field: any) => (
                        <div className="space-y-2">
                            <Label htmlFor="nombrePlanB">Nombre Plan B (opcional)</Label>
                            <Input
                                id="nombrePlanB"
                                placeholder="Se genera automáticamente"
                                value={field.state.value}
                                onChange={e => field.handleChange(e.target.value)}
                            />
                        </div>
                    )}
                </form.Field>
            </div>
        </div>
    );
}
