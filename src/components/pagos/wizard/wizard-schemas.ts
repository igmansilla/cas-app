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

// Reglas de Transición (Múltiples planes de contingencia)
export const ReglasTransicionSchema = object({
    reglasTransicion: optional(
        array(
            object({
                montoTotalDestino: pipe(number(), minValue(0, 'El monto no puede ser negativo')),
                codigoDestino: optional(string()),
                nombreDestino: optional(string()),
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
