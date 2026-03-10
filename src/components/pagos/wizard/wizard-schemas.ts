/**
 * Schemas de validación Valibot para el Wizard de Planes de Pago.
 */
import {
    pipe,
    minLength,
    minValue,
    number,
    string,
    object,
    boolean,
    optional,
    array,
    enum_,
} from "valibot";

import { EstrategiaPlan } from '../../../api/schemas/pagos';

// ===== Schemas Genéricos para cualquier Plan (A, B, C) =====

// Datos básicos de un plan
export const PlanDatosSchema = object({
    nombreParaMostrar: pipe(string(), minLength(3, 'El nombre es obligatorio (min 3 caracteres)')),
    anio: pipe(number(), minValue(2020, 'Año inválido')),
});

// Vigencia de un plan
export const PlanVigenciaSchema = object({
    mesInicioHabilitado: number(),
    mesFinHabilitado: number(),
    diaVencimiento: number(),
});

// Monto de un plan
export const PlanMontoSchema = object({
    montoTotal: pipe(number(), minValue(1000, 'El monto debe ser al menos 1000')),
    activo: boolean(),
});

// ===== Aliases para compatibilidad con código existente =====
export const PlanADatosSchema = PlanDatosSchema;
export const PlanAVigenciaSchema = PlanVigenciaSchema;
export const PlanAMontoSchema = PlanMontoSchema;

// Reglas de Transición (Múltiples planes de contingencia)
export const ReglasTransicionSchema = object({
    reglasTransicion: optional(
        array(
            object({
                montoTotalDestino: pipe(number(), minValue(0, 'El monto no puede ser negativo')),
                codigoDestino: optional(string()),
                nombreDestino: optional(string()),
                estrategiaDestino: optional(enum_(EstrategiaPlan)),
                mesInicioHabilitadoDestino: optional(number()),
                mesFinHabilitadoDestino: optional(number()),
                mesInicioControl: number(),
                cuotasMinimasRequeridas: pipe(number(), minValue(1, 'Mínimo 1 cuota')),
                mesesAtrasoParaMigrar: pipe(number(), minValue(1, 'Mínimo 1 mes')),
            })
        )
    )
});

// Devolución
export const DevolucionSchema = object({
    mesLimiteDevolucion100: number(),
    mesLimiteDevolucion50: number(),
});
