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
} from "valibot";

// Plan A: Datos básicos
export const PlanADatosSchema = object({
    nombreParaMostrar: pipe(string(), minLength(3, 'El nombre es obligatorio (min 3 caracteres)')),
    anio: pipe(number(), minValue(2020, 'Año inválido')),
});

// Plan A: Vigencia
export const PlanAVigenciaSchema = object({
    mesInicioHabilitado: number(),
    mesFinHabilitado: number(),
    diaVencimiento: number(),
});

// Plan A: Monto
export const PlanAMontoSchema = object({
    montoTotal: pipe(number(), minValue(1000, 'El monto debe ser al menos 1000')),
    activo: boolean(),
});

// Plan B
export const PlanBSchema = object({
    montoTotalPlanB: pipe(number(), minValue(0, 'El monto no puede ser negativo')),
    nombrePlanB: optional(string()),
    codigoPlanB: optional(string()),
});

// Migración
export const MigracionSchema = object({
    mesInicioControlAtraso: number(),
    cuotasMinimasAntesControl: pipe(number(), minValue(1, 'Mínimo 1 cuota')),
    mesesAtrasoParaTransicion: pipe(number(), minValue(1, 'Mínimo 1 mes')),
});

// Devolución
export const DevolucionSchema = object({
    mesLimiteDevolucion100: number(),
    mesLimiteDevolucion50: number(),
});
