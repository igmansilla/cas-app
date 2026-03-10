/**
 * Wizard para Creación de Planes de Pago - Plan A + Plan B + Plan C
 * 
 * Flujo lineal (5 pasos principales):
 * 1. Plan A: Datos, Vigencia, Monto, Migración A→B (4 sub-steps)
 * 2. Plan B: Datos, Vigencia, Monto, Migración B→C (4 sub-steps)
 * 3. Plan C: Datos, Vigencia, Monto (3 sub-steps, sin migración)
 * 4. Devolución
 * 5. Revisión
 */

import React, { useState } from 'react';
import { useForm } from "@tanstack/react-form";
import { type PlanPagoRequest, type ReglaTransicionRequest, EstrategiaPlan, AudienciaPlan } from "../../../api/schemas/pagos";

import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { LayoutList, DollarSign, CalendarDays, GitBranch, Undo2, FileCheck, CheckCircle2, ChevronRight } from "lucide-react";

import { PLAN_SUBSTEPS_WITH_MIGRATION, PLAN_SUBSTEPS } from './wizard-types';
import { GlobalStepper } from './wizard-stepper';
import { StepPlanConfig } from './steps/StepPlanConfig';
import {
    StepDevolucion,
    StepRevision,
} from './steps';

// Iconos por step principal
const STEP_ICONS: Record<string, any> = {
    planA: LayoutList,
    planB: LayoutList,
    planC: LayoutList,
    devolucion: Undo2,
    revision: FileCheck,
};

// Colores por step principal (degradé naranja a rojo)
const STEP_COLORS: Record<string, string> = {
    planA: 'bg-orange-500',
    planB: 'bg-orange-600',
    planC: 'bg-red-500',
    devolucion: 'bg-red-600',
    revision: 'bg-red-700',
};

// Color schemes para StepPlanConfig
const COLOR_SCHEMES = {
    A: { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50', border: 'border-orange-200' },
    B: { bg: 'bg-orange-600', text: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200' },
    C: { bg: 'bg-red-500', text: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200' },
};

// Sub-step labels con iconos
const SUBSTEP_LABELS = [
    { key: 'datos', title: 'Datos', icon: LayoutList },
    { key: 'vigencia', title: 'Vigencia', icon: CalendarDays },
    { key: 'monto', title: 'Monto', icon: DollarSign },
    { key: 'migracion', title: 'Migración', icon: GitBranch },
];

interface WizardPlanPagoProps {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar: (data: PlanPagoRequest) => void;
    cargando?: boolean;
}

export function WizardPlanPago(props: WizardPlanPagoProps) {
    return (
        <GlobalStepper.Scoped>
            <WizardPlanPagoContent {...props} />
        </GlobalStepper.Scoped>
    );
}

function WizardPlanPagoContent({ abierto, onCerrar, onGuardar, cargando }: WizardPlanPagoProps) {
    const stepper = GlobalStepper.useStepper();

    // Sub-steps independientes por plan
    const [planASubStep, setPlanASubStep] = useState<number>(0);
    const [planBSubStep, setPlanBSubStep] = useState<number>(0);
    const [planCSubStep, setPlanCSubStep] = useState<number>(0);
    const [subStepErrors, setSubStepErrors] = useState<Record<string, Record<number, boolean>>>({});
    const [globalStepErrors, setGlobalStepErrors] = useState<Record<string, boolean>>({});

    const isPlanStep = (id: string) => ['planA', 'planB', 'planC'].includes(id);
    const hasMigration = (id: string) => id === 'planA' || id === 'planB';

    const getSubStepsForStep = (id: string) => hasMigration(id) ? PLAN_SUBSTEPS_WITH_MIGRATION : PLAN_SUBSTEPS;
    const getSubStep = (id: string) => {
        if (id === 'planA') return planASubStep;
        if (id === 'planB') return planBSubStep;
        if (id === 'planC') return planCSubStep;
        return 0;
    };
    const setSubStep = (id: string, val: number) => {
        if (id === 'planA') setPlanASubStep(val);
        if (id === 'planB') setPlanBSubStep(val);
        if (id === 'planC') setPlanCSubStep(val);
    };
    const getFieldPrefix = (id: string) => {
        if (id === 'planB') return 'planB_';
        if (id === 'planC') return 'planC_';
        return '';
    };
    const getPlanId = (id: string): 'A' | 'B' | 'C' => {
        if (id === 'planB') return 'B';
        if (id === 'planC') return 'C';
        return 'A';
    };

    const form = useForm({
        defaultValues: {
            // Plan A
            codigo: "",
            anio: new Date().getFullYear(),
            nombreParaMostrar: "Plan A",
            audiencia: AudienciaPlan.ACAMPANTE,
            montoTotal: 1375000,
            moneda: "ARS",
            estrategia: EstrategiaPlan.PLAN_A,
            diaVencimiento: 10,
            montoCuotaFija: undefined,
            mesInicioHabilitado: 3,
            mesFinHabilitado: 1,
            minCuotas: 11,
            maxCuotas: 11,
            activo: true,

            // Plan B
            planB_nombreParaMostrar: "Plan B",
            planB_montoTotal: 1856200,
            planB_mesInicioHabilitado: 8,
            planB_mesFinHabilitado: 1,

            // Plan C
            planC_nombreParaMostrar: "Plan C",
            planC_montoTotal: 2000000,
            planC_mesInicioHabilitado: 12,
            planC_mesFinHabilitado: 1,

            // Migración A→B
            migA_mesInicioControl: 8,
            migA_cuotasMinimasRequeridas: 6,
            migA_mesesAtrasoParaMigrar: 2,

            // Migración B→C
            migB_mesInicioControl: 12,
            migB_cuotasMinimasRequeridas: 1,
            migB_mesesAtrasoParaMigrar: 1,

            // Reglas (se construyen automáticamente)
            reglasTransicion: [] as ReglaTransicionRequest[],

            // Devoluciones
            mesLimiteDevolucion100: 9,
            mesLimiteDevolucion50: 10,
            mesLimiteInscripcion: 10,
        } as any,
        onSubmit: async ({ value }) => {
            onGuardar(prepareData(value));
        },
    });

    const prepareData = (values: any): PlanPagoRequest => {
        const finalData = { ...values };
        const start = finalData.mesInicioHabilitado;
        const end = finalData.mesFinHabilitado;
        const totalMonths = end >= start ? (end - start + 1) : (12 - start + 1) + end;

        // Fix #5: Usar valores del formulario si el admin los definió, sino default a totalMonths
        if (!finalData.minCuotas || finalData.minCuotas < 1) finalData.minCuotas = totalMonths;
        if (!finalData.maxCuotas || finalData.maxCuotas < 1) finalData.maxCuotas = totalMonths;

        const audienciaPrefix = finalData.audiencia ? finalData.audiencia.substring(0, 3).toUpperCase() : 'GEN';
        if (!finalData.codigo) finalData.codigo = `PLAN-A-${audienciaPrefix}-${finalData.anio}`;

        // Construir reglas de transición
        const reglasTransicion: ReglaTransicionRequest[] = [
            // A → B
            {
                montoTotalDestino: values.planB_montoTotal,
                codigoDestino: `PLAN-B-${audienciaPrefix}-${finalData.anio}`,
                nombreDestino: values.planB_nombreParaMostrar,
                estrategiaDestino: EstrategiaPlan.PLAN_B,
                mesInicioHabilitadoDestino: values.planB_mesInicioHabilitado,
                mesFinHabilitadoDestino: values.planB_mesFinHabilitado,
                mesInicioControl: values.migA_mesInicioControl,
                cuotasMinimasRequeridas: values.migA_cuotasMinimasRequeridas,
                mesesAtrasoParaMigrar: values.migA_mesesAtrasoParaMigrar,
            },
            // B → C
            {
                montoTotalDestino: values.planC_montoTotal,
                codigoDestino: `PLAN-C-${audienciaPrefix}-${finalData.anio}`,
                nombreDestino: values.planC_nombreParaMostrar,
                estrategiaDestino: EstrategiaPlan.PLAN_C,
                mesInicioHabilitadoDestino: values.planC_mesInicioHabilitado,
                mesFinHabilitadoDestino: values.planC_mesFinHabilitado,
                mesInicioControl: values.migB_mesInicioControl,
                cuotasMinimasRequeridas: values.migB_cuotasMinimasRequeridas,
                mesesAtrasoParaMigrar: values.migB_mesesAtrasoParaMigrar,
            },
        ];
        finalData.reglasTransicion = reglasTransicion;

        // Limpiar campos con prefijo que no van al backend
        const cleanedData: any = {};
        Object.keys(finalData).forEach(key => {
            if (!key.startsWith('planB_') && !key.startsWith('planC_') && !key.startsWith('migA_') && !key.startsWith('migB_')) {
                cleanedData[key] = finalData[key];
            }
        });
        return cleanedData as PlanPagoRequest;
    };

    const handleNext = async () => {
        const currentStepId = stepper.current.id;

        if (isPlanStep(currentStepId)) {
            const currentSubStep = getSubStep(currentStepId);
            const subSteps = getSubStepsForStep(currentStepId);
            const prefix = getFieldPrefix(currentStepId);

            // Validar sub-step actual
            let hasErrors = false;
            if (currentSubStep === 0) {
                const nameField = `${prefix}nombreParaMostrar`;
                await form.validateField(nameField as any, 'change');
                hasErrors = (form.getFieldMeta(nameField as any)?.errors || []).length > 0;
                if (currentStepId === 'planA') {
                    await form.validateField('anio', 'change');
                    hasErrors = hasErrors || (form.getFieldMeta('anio')?.errors || []).length > 0;
                }
            }
            if (currentSubStep === 2) {
                const montoField = `${prefix}montoTotal`;
                await form.validateField(montoField as any, 'change');
                hasErrors = (form.getFieldMeta(montoField as any)?.errors || []).length > 0;
            }

            setSubStepErrors(prev => ({
                ...prev,
                [currentStepId]: { ...(prev[currentStepId] || {}), [currentSubStep]: hasErrors }
            }));
            if (hasErrors) return;

            // Avanzar sub-step
            if (currentSubStep < subSteps.length - 1) {
                setSubStep(currentStepId, currentSubStep + 1);
                return;
            }
            setSubStep(currentStepId, 0);
        }

        setGlobalStepErrors(prev => ({ ...prev, [currentStepId]: false }));
        stepper.next();
    };

    const handleBack = () => {
        const currentStepId = stepper.current.id;

        if (isPlanStep(currentStepId)) {
            const currentSubStep = getSubStep(currentStepId);
            if (currentSubStep > 0) {
                setSubStep(currentStepId, currentSubStep - 1);
                return;
            }
        }

        if (stepper.isFirst && getSubStep(currentStepId) === 0) {
            onCerrar();
            return;
        }

        // Volver al último sub-step del step anterior si es un plan
        const currentIndex = stepper.all.indexOf(stepper.current);
        if (currentIndex > 0) {
            const prevStep = stepper.all[currentIndex - 1];
            if (isPlanStep(prevStep.id)) {
                const prevSubSteps = getSubStepsForStep(prevStep.id);
                setSubStep(prevStep.id, prevSubSteps.length - 1);
            }
        }

        stepper.prev();
    };

    const handleConfirmar = () => {
        const { values } = form.state;
        onGuardar(prepareData(values));
    };

    const isFirstStep = stepper.isFirst && planASubStep === 0;

    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
            <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Nuevo Plan de Pago</DialogTitle>
                </DialogHeader>

                {/* ===== Navegación Principal - Mobile First ===== */}
                <nav aria-label="Pasos del Plan" className="my-3 sm:my-4">
                    <ol className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto pb-1">
                        {stepper.all.map((step, index, array) => {
                            const Icon = STEP_ICONS[step.id];
                            const currentIndex = stepper.all.indexOf(stepper.current);
                            const isCompleted = index < currentIndex;
                            const isCurrent = stepper.current.id === step.id;
                            const stepColor = STEP_COLORS[step.id] || 'bg-primary';

                            return (
                                <React.Fragment key={step.id}>
                                    <li className="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[3rem] sm:min-w-0 sm:flex-row sm:gap-1.5">
                                        <button
                                            type="button"
                                            disabled={index >= currentIndex}
                                            className={`flex size-7 sm:size-8 items-center justify-center rounded-full transition-all
                                                ${isCompleted ? `${stepColor} text-white cursor-pointer hover:opacity-80` : ''}
                                                ${isCurrent ? `${stepColor} text-white ring-2 ring-offset-1 ring-current shadow-md` : ''}
                                                ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                                                ${globalStepErrors[step.id] ? 'bg-red-500 text-white ring-2 ring-red-300' : ''}`}
                                            onClick={() => index < currentIndex && stepper.goTo(step.id as any)}
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                        </button>
                                        <span className={`text-[9px] sm:text-xs font-medium leading-none text-center sm:text-left
                                            ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.title}
                                        </span>
                                    </li>
                                    {index < array.length - 1 && (
                                        <div className={`flex-1 h-[2px] min-w-[8px] sm:min-w-[16px] self-center mb-3 sm:mb-0 ${isCompleted ? stepColor : 'bg-muted'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </ol>
                </nav>

                {/* ===== Sub-steps (solo para pasos tipo plan) ===== */}
                {isPlanStep(stepper.current.id) && (() => {
                    const subSteps = getSubStepsForStep(stepper.current.id);
                    const currentSubStep = getSubStep(stepper.current.id);
                    const planId = getPlanId(stepper.current.id);
                    const colors = COLOR_SCHEMES[planId];

                    return (
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                            {subSteps.map((sub, idx) => {
                                const labelData = SUBSTEP_LABELS.find(l => l.key === sub);
                                if (!labelData) return null;
                                const SubIcon = labelData.icon;
                                const isActive = idx === currentSubStep;
                                const isComplete = idx < currentSubStep;
                                const hasError = subStepErrors[stepper.current.id]?.[idx];

                                return (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => idx < currentSubStep && setSubStep(stepper.current.id, idx)}
                                        className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all
                                            ${hasError ? 'bg-red-500 text-white ring-2 ring-red-300 animate-pulse' :
                                                isActive ? `${colors.bg} text-white shadow-md` :
                                                isComplete ? `${colors.bgLight} ${colors.text} cursor-pointer hover:opacity-80` :
                                                    'bg-muted text-muted-foreground'}`}
                                    >
                                        <SubIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        {labelData.title}
                                        {isComplete && !hasError && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* ===== Contenido del step ===== */}
                <form
                    onSubmit={(e) => e.preventDefault()}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className="space-y-4 sm:space-y-6 py-2 sm:py-4"
                >
                    {stepper.switch({
                        planA: () => (
                            <StepPlanConfig
                                form={form}
                                planId="A"
                                subStep={planASubStep}
                                fieldPrefix=""
                                colorScheme={COLOR_SCHEMES.A}
                                planDestinoLabel="B"
                            />
                        ),
                        planB: () => (
                            <StepPlanConfig
                                form={form}
                                planId="B"
                                subStep={planBSubStep}
                                fieldPrefix="planB_"
                                colorScheme={COLOR_SCHEMES.B}
                                planDestinoLabel="C"
                            />
                        ),
                        planC: () => (
                            <StepPlanConfig
                                form={form}
                                planId="C"
                                subStep={planCSubStep}
                                fieldPrefix="planC_"
                                colorScheme={COLOR_SCHEMES.C}
                            />
                        ),
                        devolucion: () => <StepDevolucion form={form} />,
                        revision: () => <StepRevision form={form} />,
                    })}

                    <DialogFooter className="flex justify-between sm:justify-between pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleBack} className="text-sm">
                            {isFirstStep ? "Cancelar" : "Atrás"}
                        </Button>

                        {stepper.isLast ? (
                            <Button type="button" size="sm" onClick={handleConfirmar} disabled={cargando} className="text-sm">
                                {cargando ? "Guardando..." : "Confirmar y Crear"}
                            </Button>
                        ) : (
                            <Button type="button" size="sm" onClick={handleNext} className="text-sm">
                                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
