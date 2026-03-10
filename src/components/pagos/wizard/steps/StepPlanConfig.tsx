/**
 * StepPlanConfig - Componente genérico para configurar un plan de pago (A, B o C).
 * 
 * Plan A y B: 4 sub-steps (Datos, Vigencia, Monto, Migración).
 * Plan C: 3 sub-steps (Datos, Vigencia, Monto) — no tiene migración, es el último plan.
 */
import React from 'react';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Switch } from '../../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Card, CardContent } from '../../../ui/card';
import { LayoutList, CalendarDays, DollarSign, GitBranch, AlertTriangle } from 'lucide-react';
import { MESES } from '../wizard-types';
import { AudienciaPlan } from '../../../../api/schemas/pagos';
import { TimelinePreview } from '../components/TimelinePreview';

interface StepPlanConfigProps {
    form: any;
    planId: 'A' | 'B' | 'C';
    subStep: number;
    /** Prefijo de los campos del form. '' para Plan A, 'planB_' o 'planC_' para B/C. */
    fieldPrefix: string;
    /** Plan destino al que migra (ej: Plan A migra a B, Plan B migra a C). Solo para A y B. */
    planDestinoLabel?: string;
    colorScheme: {
        bg: string;
        text: string;
        bgLight: string;
        border: string;
    };
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
    A: 'Plan principal con descuento para inscripciones tempranas.',
    B: 'Plan contingencia para quienes se inscriben a mitad de año o migran desde Plan A.',
    C: 'Plan de inscripción tardía para los últimos meses.',
};

export function StepPlanConfig({ form, planId, subStep, fieldPrefix, colorScheme, planDestinoLabel }: StepPlanConfigProps) {
    if (subStep === 0) return <PlanDatos form={form} planId={planId} fieldPrefix={fieldPrefix} colorScheme={colorScheme} />;
    if (subStep === 1) return <PlanVigencia form={form} planId={planId} fieldPrefix={fieldPrefix} colorScheme={colorScheme} />;
    if (subStep === 2) return <PlanMonto form={form} planId={planId} fieldPrefix={fieldPrefix} colorScheme={colorScheme} />;
    if (subStep === 3 && planDestinoLabel) return <PlanMigracion form={form} planId={planId} fieldPrefix={fieldPrefix} colorScheme={colorScheme} planDestinoLabel={planDestinoLabel} />;
    return <PlanMonto form={form} planId={planId} fieldPrefix={fieldPrefix} colorScheme={colorScheme} />;
}

// ===== Sub-step: Datos =====
function PlanDatos({ form, planId, fieldPrefix, colorScheme }: Omit<StepPlanConfigProps, 'subStep'>) {
    const f = (name: string) => `${fieldPrefix}${name}`;

    return (
        <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className={`p-1.5 sm:p-2 rounded-full ${colorScheme.bgLight} ${colorScheme.text}`}>
                    <LayoutList className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Plan {planId} — Datos</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{PLAN_DESCRIPTIONS[planId]}</p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                <form.Field
                    name={f('nombreParaMostrar')}
                    validators={{
                        onChange: ({ value }: { value: string }) =>
                            value.length < 3 ? 'El nombre debe tener al menos 3 caracteres' : undefined
                    }}
                >
                    {(field: any) => (
                        <div className="space-y-1.5">
                            <Label htmlFor={`nombre-${planId}`} className="text-sm">Nombre del Plan</Label>
                            <Input
                                id={`nombre-${planId}`}
                                placeholder={`Ej. Plan ${planId} — Campamento 2026`}
                                value={field.state.value}
                                onChange={e => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                className={`text-base sm:text-lg ${field.state.meta.errors?.length ? "border-red-500" : ""}`}
                            />
                            {field.state.meta.errors?.length > 0 && (
                                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                            )}
                        </div>
                    )}
                </form.Field>

                {/* Año y Audiencia solo se muestran en Plan A (los demás heredan) */}
                {planId === 'A' && (
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 sm:gap-6 items-start">
                        <form.Field
                            name="anio"
                            validators={{
                                onChange: ({ value }: { value: number }) =>
                                    value < 2020 ? 'Año inválido' : undefined
                            }}
                        >
                            {(field: any) => (
                                <div className="space-y-1.5">
                                    <Label htmlFor="anio" className="text-sm">Año</Label>
                                    <Input
                                        type="number"
                                        id="anio"
                                        value={field.state.value}
                                        onChange={e => field.handleChange(Number(e.target.value))}
                                        className={`text-center font-mono text-lg ${field.state.meta.errors?.length ? "border-red-500" : ""}`}
                                    />
                                    {field.state.meta.errors?.length > 0 && (
                                        <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="audiencia">
                            {(field: any) => (
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Audiencia</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { value: AudienciaPlan.ACAMPANTE, label: 'Acampante', icon: '🏕️' },
                                            { value: AudienciaPlan.DIRIGENTE, label: 'Dirigente', icon: '🎯' },
                                            { value: AudienciaPlan.BASE, label: 'Base', icon: '👨‍🍳' },
                                        ].map((opt) => {
                                            const isSelected = field.state.value === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => field.handleChange(opt.value)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border-2 transition-all duration-200 text-sm ${isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                                        : 'bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50'
                                                        }`}
                                                >
                                                    <span className="text-base sm:text-lg">{opt.icon}</span>
                                                    <span className={`font-medium ${isSelected ? '' : 'text-foreground'}`}>
                                                        {opt.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </form.Field>
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== Sub-step: Vigencia =====
function PlanVigencia({ form, planId, fieldPrefix, colorScheme }: Omit<StepPlanConfigProps, 'subStep'>) {
    const f = (name: string) => `${fieldPrefix}${name}`;
    const anioPlan = form.getFieldValue('anio') || new Date().getFullYear();

    return (
        <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className={`p-1.5 sm:p-2 rounded-full ${colorScheme.bgLight} ${colorScheme.text}`}>
                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Plan {planId} — Vigencia</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Cuándo empieza y termina el plan de pagos.</p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                <form.Subscribe selector={(state: any) => [state.values[f('mesInicioHabilitado')], state.values[f('mesFinHabilitado')]]}>
                    {([inicio, fin]: any[]) => (
                        <TimelinePreview start={inicio} end={fin} />
                    )}
                </form.Subscribe>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <form.Field name={f('mesInicioHabilitado')}>
                        {(field: any) => (
                            <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm">Primera Cuota</Label>
                                <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                    <SelectTrigger className="bg-muted/20 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MESES.map(m => (
                                            <SelectItem key={m.val} value={String(m.val)}>
                                                {m.label} <span className="text-muted-foreground text-xs">({anioPlan})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name={f('mesFinHabilitado')}>
                        {(field: any) => {
                            const inicio = form.getFieldValue(f('mesInicioHabilitado'));
                            return (
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm">Última Cuota</Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger className="bg-muted/20 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {MESES.map(m => {
                                                const isNextYear = inicio && m.val < inicio;
                                                const yearDisplay = isNextYear ? anioPlan + 1 : anioPlan;
                                                const highlight = isNextYear ? "text-orange-600 font-medium" : "text-muted-foreground";
                                                return (
                                                    <SelectItem key={m.val} value={String(m.val)}>
                                                        {m.label} <span className={`${highlight} text-xs`}>({yearDisplay})</span>
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

                {/* Día de vencimiento solo en Plan A (los demás heredan) */}
                {planId === 'A' && (
                    <form.Field name="diaVencimiento">
                        {(field: any) => (
                            <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm">Día de Vencimiento</Label>
                                <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                    <SelectTrigger className="text-sm"><SelectValue placeholder="Seleccionar día" /></SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 15, 20, 25].map(d => <SelectItem key={d} value={String(d)}>Día {d} de cada mes</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">Fecha límite de pago para cada cuota.</p>
                            </div>
                        )}
                    </form.Field>
                )}

                {/* Fix #5: Rango de cuotas configurable (solo Plan A) */}
                {planId === 'A' && (
                    <form.Subscribe selector={(state: any) => [state.values[f('mesInicioHabilitado')], state.values[f('mesFinHabilitado')]]}>
                        {([inicio, fin]: any[]) => {
                            const totalMonths = fin >= inicio ? (fin - inicio + 1) : (12 - inicio + 1) + fin;
                            return (
                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-semibold">Rango de Cuotas</Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        El acampante podrá elegir entre un mínimo y máximo de cuotas al inscribirse.
                                        La vigencia permite hasta {totalMonths} cuotas.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <form.Field name="minCuotas">
                                            {(field: any) => (
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] text-muted-foreground">Mínimo</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={totalMonths}
                                                        value={field.state.value || ''}
                                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                                        className="text-sm"
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field name="maxCuotas">
                                            {(field: any) => (
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] text-muted-foreground">Máximo</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={totalMonths}
                                                        value={field.state.value || ''}
                                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                                        className="text-sm"
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                    </div>
                                </div>
                            );
                        }}
                    </form.Subscribe>
                )}

                {/* Fix #11: Límite de inscripción (solo Plan A) */}
                {planId === 'A' && (
                    <form.Field name="mesLimiteInscripcion">
                        {(field: any) => (
                            <div className="space-y-1.5">
                                <Label className="text-xs sm:text-sm font-semibold">Límite de Inscripción</Label>
                                <Select
                                    value={field.state.value ? String(field.state.value) : '10'}
                                    onValueChange={(v) => field.handleChange(Number(v))}
                                >
                                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MESES.map(m => (
                                            <SelectItem key={m.val} value={String(m.val)}>
                                                Hasta {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                    Mes límite para inscribirse a este plan. Después de esta fecha, no se aceptan nuevas inscripciones.
                                </p>
                            </div>
                        )}
                    </form.Field>
                )}
            </div>
        </div>
    );
}

// ===== Sub-step: Monto =====
function PlanMonto({ form, planId, fieldPrefix, colorScheme }: Omit<StepPlanConfigProps, 'subStep'>) {
    const f = (name: string) => `${fieldPrefix}${name}`;

    const formatCurrency = (val: number) => {
        if (!val && val !== 0) return "";
        return Number(val).toLocaleString("es-AR");
    };

    const parseCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = e.target.value.replace(/\D/g, "");
        return clean ? Number(clean) : 0;
    };

    return (
        <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className={`p-1.5 sm:p-2 rounded-full ${colorScheme.bgLight} ${colorScheme.text}`}>
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Plan {planId} — Monto</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Costo total del plan.</p>
                </div>
            </div>

            <div className="space-y-4">
                <form.Field
                    name={f('montoTotal')}
                    validators={{
                        onChange: ({ value }: { value: number }) =>
                            value < 1000 ? 'El monto debe ser al menos $1.000' : undefined
                    }}
                >
                    {(field: any) => (
                        <div className="space-y-2">
                            <Label htmlFor={`monto-${planId}`} className="text-sm">Monto Total</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id={`monto-${planId}`}
                                    value={formatCurrency(field.state.value)}
                                    onChange={e => field.handleChange(parseCurrency(e))}
                                    className={`pl-7 text-lg font-semibold ${field.state.meta.errors?.length ? "border-red-500" : ""}`}
                                />
                            </div>
                            {field.state.meta.errors?.length > 0 && (
                                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                            )}

                            {/* Cálculo de cuota */}
                            <form.Subscribe selector={(state: any) => [state.values[f('mesInicioHabilitado')], state.values[f('mesFinHabilitado')]]}>
                                {([inicio, fin]: any[]) => {
                                    if (!inicio || !fin || !field.state.value) return null;
                                    const totalMeses = fin >= inicio ? (fin - inicio + 1) : (12 - inicio + 1) + fin;
                                    const cuota = Math.round(field.state.value / totalMeses);
                                    return (
                                        <div className={`p-2.5 sm:p-3 rounded-lg ${colorScheme.bgLight} border ${colorScheme.border}`}>
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">{totalMeses} cuotas de </span>
                                                <span className={`font-bold ${colorScheme.text}`}>${formatCurrency(cuota)}</span>
                                            </p>
                                        </div>
                                    );
                                }}
                            </form.Subscribe>
                        </div>
                    )}
                </form.Field>

                {/* Switch de activo solo en Plan A */}
                {planId === 'A' && (
                    <form.Field name="activo">
                        {(field: any) => (
                            <div className="flex items-center space-x-2 pt-2 p-3 sm:p-4 bg-muted/30 rounded-lg">
                                <Switch id="activo" checked={field.state.value} onCheckedChange={field.handleChange} />
                                <Label htmlFor="activo" className="cursor-pointer text-sm">Habilitar plan inmediatamente</Label>
                            </div>
                        )}
                    </form.Field>
                )}
            </div>
        </div>
    );
}

// ===== Sub-step: Migración (solo Plan A y Plan B) =====
function PlanMigracion({ form, planId, colorScheme, planDestinoLabel }: Omit<StepPlanConfigProps, 'subStep'> & { planDestinoLabel: string }) {
    const migPrefix = planId === 'A' ? 'migA_' : 'migB_';

    return (
        <div className="grid gap-4 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className={`p-1.5 sm:p-2 rounded-full ${colorScheme.bgLight} ${colorScheme.text}`}>
                    <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-medium">Plan {planId} → Plan {planDestinoLabel}</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                        Condiciones para migrar del Plan {planId} al Plan {planDestinoLabel}.
                    </p>
                </div>
            </div>

            <Card className={`border ${colorScheme.border}`}>
                <CardContent className="pt-4 space-y-4">
                    {/* Explicación */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                            Si un acampante no cumple con los pagos del Plan {planId}, se migra
                            automáticamente al Plan {planDestinoLabel}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mes de control */}
                        <form.Field name={`${migPrefix}mesInicioControl`}>
                            {(field: any) => (
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm font-semibold">Controlar desde el mes...</Label>
                                    <Select
                                        value={field.state.value ? String(field.state.value) : undefined}
                                        onValueChange={(v) => field.handleChange(Number(v))}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Mes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MESES.map(m => (
                                                <SelectItem key={m.val} value={String(m.val)}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </form.Field>

                        {/* Meses de atraso */}
                        <form.Field name={`${migPrefix}mesesAtrasoParaMigrar`}>
                            {(field: any) => (
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm font-semibold">Con atraso de...</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={field.state.value || ''}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            className="w-16 sm:w-20 text-sm"
                                        />
                                        <span className="text-xs sm:text-sm text-muted-foreground">meses o más</span>
                                    </div>
                                </div>
                            )}
                        </form.Field>

                        {/* Cuotas mínimas requeridas */}
                        <form.Field name={`${migPrefix}cuotasMinimasRequeridas`}>
                            {(field: any) => (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs sm:text-sm font-semibold">Exigir pago mínimo de...</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={field.state.value || ''}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            className="w-16 sm:w-20 text-sm"
                                        />
                                        <span className="text-xs sm:text-sm text-muted-foreground">cuotas al mes de control</span>
                                    </div>
                                </div>
                            )}
                        </form.Field>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
