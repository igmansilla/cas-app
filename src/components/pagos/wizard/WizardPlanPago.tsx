/**
 * Wizard para Creación de Planes de Pago - Plan A + Plan B Unificado
 * 
 * Flujo:
 * 1. Plan A: Datos + Vigencia + Monto (3 sub-steps)
 * 2. Plan B
 * 3. Migración
 * 4. Devolución
 * 5. Revisión
 */

import React, { useState } from 'react';
import { useForm } from "@tanstack/react-form";
import { type PlanPagoRequest, EstrategiaPlan, AudienciaPlan } from "../../../api/schemas/pagos";

import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Separator } from "../../ui/separator";
import { LayoutList, DollarSign, GitBranch, Undo2, FileCheck, CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";

import { PLAN_A_SUBSTEPS } from './wizard-types';
import { GlobalStepper } from './wizard-stepper';
import {
    StepPlanADatos,
    StepPlanAVigencia,
    StepPlanAMonto,
    StepPlanB,
    StepMigracion,
    StepDevolucion,
    StepRevision,
} from './steps';

const STEP_ICONS = {
    planA: LayoutList,
    planB: DollarSign,
    migracion: GitBranch,
    devolucion: Undo2,
    revision: FileCheck,
};

const PLAN_A_SUBSTEP_LABELS = {
    datos: { title: 'Datos', icon: LayoutList },
    vigencia: { title: 'Vigencia', icon: CalendarDays },
    monto: { title: 'Monto', icon: DollarSign },
};

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
    const [planASubStep, setPlanASubStep] = useState<number>(0);

    const form = useForm({
        defaultValues: {
            codigo: "",
            anio: new Date().getFullYear(),
            nombreParaMostrar: "Plan A",
            audiencia: AudienciaPlan.ACAMPANTE,
            montoTotal: 0,
            moneda: "ARS",
            estrategia: EstrategiaPlan.PLAN_A,
            diaVencimiento: 10,
            montoCuotaFija: undefined,
            mesInicioHabilitado: 4,
            mesFinHabilitado: 1,
            minCuotas: 10,
            maxCuotas: 10,
            activo: true,
            montoTotalPlanB: 0,
            codigoPlanB: "",
            nombrePlanB: "",
            mesInicioControlAtraso: 7,
            cuotasMinimasAntesControl: 4,
            mesesAtrasoParaTransicion: 2,
            mesLimiteDevolucion100: 9,
            mesLimiteDevolucion50: 10,
        } as PlanPagoRequest,
        onSubmit: async ({ value }) => {
            onGuardar(prepareData(value));
        },
    });

    const prepareData = (values: PlanPagoRequest) => {
        const finalData = { ...values };
        const start = finalData.mesInicioHabilitado;
        const end = finalData.mesFinHabilitado;
        const totalMonths = end >= start ? (end - start + 1) : (12 - start + 1) + end;
        finalData.minCuotas = totalMonths;
        finalData.maxCuotas = totalMonths;

        // Generar código único basado en: nombre + audiencia + año
        const nombreNormalizado = finalData.nombreParaMostrar
            .toUpperCase()
            .replace(/\s+/g, '-')
            .replace(/[^A-Z0-9-]/g, '')
            .substring(0, 20);

        // Incluir audiencia en el código para evitar colisiones
        const audienciaPrefix = finalData.audiencia ? finalData.audiencia.substring(0, 3) : 'GEN';

        if (!finalData.codigo) finalData.codigo = `${nombreNormalizado}-${audienciaPrefix}-A-${finalData.anio}`;
        if (!finalData.codigoPlanB) finalData.codigoPlanB = `${nombreNormalizado}-${audienciaPrefix}-B-${finalData.anio}`;
        if (!finalData.nombrePlanB) finalData.nombrePlanB = `${finalData.nombreParaMostrar} (Plan B)`;
        return finalData;
    };

    const handleNext = async () => {
        const currentStepId = stepper.current.id;

        // Validate current fields
        const isValid = await form.validateAllFields('change');
        if (!isValid) return;

        if (currentStepId === 'planA') {
            if (planASubStep < PLAN_A_SUBSTEPS.length - 1) {
                setPlanASubStep(planASubStep + 1);
                return;
            }
            setPlanASubStep(0);
        }

        stepper.next();
    };

    const handleBack = () => {
        const currentStepId = stepper.current.id;

        if (currentStepId === 'planA' && planASubStep > 0) {
            setPlanASubStep(planASubStep - 1);
            return;
        }

        if (stepper.isFirst && planASubStep === 0) {
            onCerrar();
            return;
        }

        if (stepper.current.id !== 'planA') {
            const prevStep = stepper.all[stepper.all.indexOf(stepper.current) - 1];
            if (prevStep?.id === 'planA') {
                setPlanASubStep(PLAN_A_SUBSTEPS.length - 1);
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
            <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Plan de Pago</DialogTitle>
                </DialogHeader>

                {/* Navegación Principal */}
                <nav aria-label="Pasos del Plan" className="my-4 px-2">
                    <ol className="flex items-center justify-between gap-1">
                        {stepper.all.map((step, index, array) => {
                            const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS];
                            const currentIndex = stepper.all.indexOf(stepper.current);
                            const isCompleted = index < currentIndex;
                            const isCurrent = stepper.current.id === step.id;

                            return (
                                <React.Fragment key={step.id}>
                                    <li className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            type="button"
                                            variant={isCompleted || isCurrent ? 'default' : 'secondary'}
                                            size="sm"
                                            className={`flex size-9 items-center justify-center rounded-full p-0 ${isCurrent ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                            onClick={() => index < currentIndex && stepper.goTo(step.id as any)}
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        </Button>
                                        <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.title}
                                        </span>
                                    </li>
                                    {index < array.length - 1 && (
                                        <Separator className={`flex-1 h-[2px] ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </ol>
                </nav>

                {/* Sub-steps for Plan A */}
                {stepper.current.id === 'planA' && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {PLAN_A_SUBSTEPS.map((sub, idx) => {
                            const SubIcon = PLAN_A_SUBSTEP_LABELS[sub].icon;
                            const isActive = idx === planASubStep;
                            const isComplete = idx < planASubStep;
                            return (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => idx < planASubStep && setPlanASubStep(idx)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isActive ? 'bg-primary text-primary-foreground shadow-md' :
                                            isComplete ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30' :
                                                'bg-muted text-muted-foreground'}`}
                                >
                                    <SubIcon className="w-3.5 h-3.5" />
                                    {PLAN_A_SUBSTEP_LABELS[sub].title}
                                    {isComplete && <CheckCircle2 className="w-3 h-3 ml-1" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-6 py-4 px-1">
                    {stepper.switch({
                        planA: () => {
                            if (planASubStep === 0) return <StepPlanADatos form={form} />;
                            if (planASubStep === 1) return <StepPlanAVigencia form={form} />;
                            return <StepPlanAMonto form={form} />;
                        },
                        planB: () => <StepPlanB form={form} />,
                        migracion: () => <StepMigracion form={form} />,
                        devolucion: () => <StepDevolucion form={form} />,
                        revision: () => <StepRevision form={form} />,
                    })}

                    <DialogFooter className="flex justify-between sm:justify-between px-1">
                        <Button type="button" variant="outline" onClick={handleBack}>
                            {isFirstStep ? "Cancelar" : "Atrás"}
                        </Button>

                        {stepper.isLast ? (
                            <Button type="button" onClick={handleConfirmar} disabled={cargando}>
                                {cargando ? "Guardando..." : "Confirmar y Crear"}
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleNext}>
                                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
