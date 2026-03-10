/**
 * Tipos y constantes del Wizard de Planes de Pago.
 * 
 * Plan A y Plan B tienen 4 sub-steps: Datos, Vigencia, Monto, Migración.
 * Plan C solo tiene 3 sub-steps: Datos, Vigencia, Monto (es el último plan).
 */

/** Sub-steps para planes que tienen regla de migración (A y B) */
export const PLAN_SUBSTEPS_WITH_MIGRATION = ['datos', 'vigencia', 'monto', 'migracion'] as const;
export type PlanSubStepWithMigration = typeof PLAN_SUBSTEPS_WITH_MIGRATION[number];

/** Sub-steps para el plan final (C) que no tiene migración */
export const PLAN_SUBSTEPS = ['datos', 'vigencia', 'monto'] as const;
export type PlanSubStep = typeof PLAN_SUBSTEPS[number];

/** @deprecated Usar PLAN_SUBSTEPS en su lugar */
export const PLAN_A_SUBSTEPS = PLAN_SUBSTEPS;
export type PlanASubStep = PlanSubStep;

export const MESES = [
    { val: 1, label: 'Ene' },
    { val: 2, label: 'Feb' },
    { val: 3, label: 'Mar' },
    { val: 4, label: 'Abr' },
    { val: 5, label: 'May' },
    { val: 6, label: 'Jun' },
    { val: 7, label: 'Jul' },
    { val: 8, label: 'Ago' },
    { val: 9, label: 'Sep' },
    { val: 10, label: 'Oct' },
    { val: 11, label: 'Nov' },
    { val: 12, label: 'Dic' },
];

/** Meses con nombres completos (para presentación) */
export const MESES_COMPLETOS = [
    { val: 1, label: 'Enero' },
    { val: 2, label: 'Febrero' },
    { val: 3, label: 'Marzo' },
    { val: 4, label: 'Abril' },
    { val: 5, label: 'Mayo' },
    { val: 6, label: 'Junio' },
    { val: 7, label: 'Julio' },
    { val: 8, label: 'Agosto' },
    { val: 9, label: 'Septiembre' },
    { val: 10, label: 'Octubre' },
    { val: 11, label: 'Noviembre' },
    { val: 12, label: 'Diciembre' },
];

export interface WizardStepProps {
    form: any;
}

/** Retorna el último día del mes (28, 29, 30 o 31) */
export function ultimoDiaMes(mes: number | undefined): number {
    if (!mes) return 30;
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return diasPorMes[mes - 1] ?? 30;
}
