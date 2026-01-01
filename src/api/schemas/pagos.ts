/**
 * Schemas de Valibot para el módulo de Pagos
 */

import {
  object,
  string,
  number,
  boolean,
  optional,
  array,
  enum_,
  nullable,
  union,
  pipe,
  transform,
  any,
  type InferOutput
} from 'valibot';

// ============================================
// Enums
// ============================================

export enum EstrategiaPlan {
  PLAN_A = 'PLAN_A',    // Plan principal con descuento
  PLAN_B = 'PLAN_B'     // Plan contingencia/tardío
}

export const EstrategiaPlanSchema = enum_(EstrategiaPlan);

// Audiencia del plan - a qué tipo de usuario va dirigido
export enum AudienciaPlan {
  ACAMPANTE = 'ACAMPANTE',    // Plan para acampantes/hijos
  DIRIGENTE = 'DIRIGENTE',    // Plan para dirigentes
  BASE = 'BASE'   // Plan para staff de base (padres en cocina, etc.)
}

export const AudienciaPlanSchema = enum_(AudienciaPlan);

// Helper for Java Money JSON structure
const MoneyJsonSchema = object({
  source: string(),
  parsedValue: number()
});

// Helper for Months (can be string 'JULY' or number 7)
const MonthSchema = union([string(), number()]);

// ============================================
// Schemas: Plan de Pago (Model / Response)
// ============================================

export const PlanPagoSchema = object({
  id: optional(number()),
  codigo: string(),
  nombre: string(),
  anio: number(),
  // Transform complex money object to simple number if needed, or accept number directly
  montoTotal: union([
    number(),
    pipe(
      MoneyJsonSchema,
      transform((input) => input.parsedValue)
    )
  ]),
  moneda: optional(string()), // Added
  diaVencimiento: optional(number()), // Added
  montoCuotaFija: optional(number()), // Added
  estrategia: optional(EstrategiaPlanSchema),
  audiencia: optional(enum_(AudienciaPlan)),
  // Recursively optional planDestino or just any for now to avoid complexity
  planDestino: optional(any()),
  minCuotas: optional(number()),
  maxCuotas: optional(number()),
  mesInicio: MonthSchema,
  mesFin: MonthSchema,
  activo: boolean(),
  // Campos de vinculación Plan A → Plan B
  planDestinoId: optional(nullable(number())),
  planDestinoCodigo: optional(nullable(string())),
  mesInicioControlAtraso: optional(nullable(number())),
  cuotasMinimasAntesControl: optional(nullable(number())),
  mesesAtrasoParaTransicion: optional(nullable(number())),
  // Política de devolución por baja
  mesLimiteDevolucion100: optional(nullable(number())),
  mesLimiteDevolucion50: optional(nullable(number())),
  // Restricción de inscripción
  mesLimiteInscripcion: optional(nullable(number())),
});

export type PlanPago = InferOutput<typeof PlanPagoSchema>;

// ============================================
// Schemas: Plan de Pago (Request / Form)
// ============================================

export const PlanPagoRequestSchema = object({
  codigo: string(),
  anio: number(),
  nombreParaMostrar: string(),
  montoTotal: number(),
  moneda: string(),
  estrategia: EstrategiaPlanSchema,
  diaVencimiento: number(),
  montoCuotaFija: optional(number()),
  mesInicioHabilitado: number(), // 1-12
  mesFinHabilitado: number(),    // 1-12
  minCuotas: optional(number()),
  maxCuotas: optional(number()),
  activo: boolean(),
  // Audiencia del plan
  audiencia: optional(enum_(AudienciaPlan)),

  // Campos para crear Plan B automáticamente (solo cuando estrategia = PLAN_A)
  montoTotalPlanB: optional(number()),
  codigoPlanB: optional(string()),
  nombrePlanB: optional(string()),

  // Reglas de transición
  mesInicioControlAtraso: optional(number()),      // Mes a partir del cual aplica control de atraso (ej: 7 = Julio)
  cuotasMinimasAntesControl: optional(number()),   // Cuotas mínimas antes del mes de control
  mesesAtrasoParaTransicion: optional(number()),   // Meses de atraso para activar transición (default: 2)

  // Política de devoluc ión por baja
  mesLimiteDevolucion100: optional(number()),      // Hasta este mes: 100% devolución
  mesLimiteDevolucion50: optional(number()),       // Hasta este mes: 50% devolución

  // Restricción de inscripción
  mesLimiteInscripcion: optional(number()),        // Mes límite para inscribirse (1-12)
});

export type PlanPagoRequest = InferOutput<typeof PlanPagoRequestSchema>;

// ============================================
// Schemas: Cuota
// ============================================

export const CuotaSchema = object({
  id: optional(number()),
  secuencia: number(), // Backend usa "secuencia", no "nroCuota"
  fechaVencimiento: string(), // Backend usa "fechaVencimiento", no "vencimiento"
  monto: union([
    number(),
    pipe(
      MoneyJsonSchema,
      transform((input) => input.parsedValue)
    )
  ]),
  estado: string(), // 'PLANIFICADA', 'HABILITADA', 'ATRASADA', 'PAGADA', 'REGULARIZADA'
  fechaPago: optional(nullable(string())),
  metodoPago: optional(nullable(string())),
  notasAdmin: optional(nullable(string())), // Backend cambió nombre de notasAdministrativas
  esPagable: optional(boolean()), // Nuevo campo que indica si la cuota puede ser pagada

  // Alias para compatibilidad con componentes existentes
  nroCuota: optional(number()), // Deprecated, usar secuencia
});

export type Cuota = InferOutput<typeof CuotaSchema>;

// ============================================
// Schemas: Inscripción
// ============================================

export const InscripcionSchema = object({
  idInscripcion: number(),
  cuotas: array(CuotaSchema),
  estado: string(),

  // Información del plan
  nombrePlan: optional(string()),
  codigoPlan: optional(string()),
  montoTotal: optional(union([
    number(),
    pipe(
      MoneyJsonSchema,
      transform((input) => input.parsedValue)
    )
  ])),
  totalCuotas: optional(number()),
  // mesAlta puede venir como string ("DECEMBER") o número (12)
  mesAlta: optional(union([string(), number()])),

  // Estadísticas de progreso
  cuotasPagadas: optional(number()),
  cuotasPendientes: optional(number()),
  cuotasVencidas: optional(number()),
  montoPagado: optional(union([
    number(),
    pipe(
      MoneyJsonSchema,
      transform((input) => input.parsedValue)
    )
  ])),
  montoRestante: optional(union([
    number(),
    pipe(
      MoneyJsonSchema,
      transform((input) => input.parsedValue)
    )
  ])),

  // Reglas de transición (solo para Plan A)
  mesInicioControlAtraso: optional(nullable(number())),
  cuotasMinimasAntesControl: optional(nullable(number())),
  mesesAtrasoParaTransicion: optional(nullable(number())),
  planDestinoCodigo: optional(nullable(string())),

  // Legacy fields for backwards compatibility
  plan: optional(PlanPagoSchema),
  fechaInscripcion: optional(string()),
});

export type Inscripcion = InferOutput<typeof InscripcionSchema>;

// ============================================
// Schemas: Inscripción Request
// ============================================

export const InscripcionRequestSchema = object({
  idUsuario: string(),
  codigoPlan: string(),
  mesInicio: string(), // Month name e.g. "MARCH"
  cuotasDeseadas: number(),
});

export type InscripcionRequest = InferOutput<typeof InscripcionRequestSchema>;

// ============================================
// Schemas: Intención de Pago
// ============================================

// Enum for Payment Methods matching backend
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  MERCADOPAGO = 'MERCADOPAGO'
}

export const IntencionPagoRequestSchema = object({
  idInscripcion: number(),
  idsCuotas: array(number()), // Backend expects list of IDs
  metodo: enum_(MetodoPago)
});

export type IntencionPagoRequest = InferOutput<typeof IntencionPagoRequestSchema>;

export const IntencionPagoResponseSchema = object({
  id: number(),
  preferenceId: optional(nullable(string())),
  urlRedireccion: optional(nullable(string())),
  monto: optional(number()), // Backend does not return this currently
  idInscripcion: number(),
  estado: optional(string())
});

export type IntencionPagoResponse = InferOutput<typeof IntencionPagoResponseSchema>;

// ============================================
// Schemas: Admin / Tesorería
// ============================================

// States matching backend enums
export enum EstadoInscripcion {
  ACTIVA = 'ACTIVA',
  MOVIDA_PLAN_B = 'MOVIDA_PLAN_B',
  CANCELADA = 'CANCELADA'
}

export enum EstadoFinanciero {
  AL_DIA = 'AL_DIA',
  MOROSO = 'MOROSO',
  MIGRADO = 'MIGRADO'
}

// Admin inscription response (matches InscripcionAdminResponse.java)
export const InscripcionAdminSchema = object({
  idInscripcion: number(),
  usuarioUid: string(),
  usuarioNombre: string(),
  usuarioDni: optional(nullable(string())),
  usuarioEmail: optional(nullable(string())),
  usuarioTelefono: optional(nullable(string())),
  planId: number(),
  codigoPlan: string(),
  nombrePlan: string(),
  estadoInscripcion: enum_(EstadoInscripcion),
  estadoFinanciero: enum_(EstadoFinanciero),
  cuotasPagadas: number(),
  totalCuotas: number(),
  cuotasVencidas: number(),
  montoPagado: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  montoTotal: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  montoRestante: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  proximoVencimiento: optional(nullable(string())),
  fechaInscripcion: optional(nullable(string())),
  fechaMigracion: optional(nullable(string()))
});

export type InscripcionAdmin = InferOutput<typeof InscripcionAdminSchema>;

// Financial summary for dashboard (matches ResumenFinancieroResponse.java)
export const ResumenFinancieroSchema = object({
  recaudacionTotal: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  recaudacionPendiente: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  tasaMorosidad: number(),
  inscripcionesActivas: number(),
  totalInscripciones: number()
});

export type ResumenFinanciero = InferOutput<typeof ResumenFinancieroSchema>;

// Manual payment request
export const RegistroPagoManualRequestSchema = object({
  idCuota: number(),
  notas: string(),
  metodo: string() // 'EFECTIVO', 'TRANSFERENCIA', etc.
});

export type RegistroPagoManualRequest = InferOutput<typeof RegistroPagoManualRequestSchema>;

// Filter params for admin inscription queries
export interface AdminInscripcionFilters {
  plan?: string;
  estadoInscripcion?: EstadoInscripcion;
  estadoFinanciero?: EstadoFinanciero;
  q?: string;
}

// ============================================
// Schemas: Solicitud de Baja
// ============================================

export enum EstadoSolicitudBaja {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  PROCESADA = 'PROCESADA',
  RECHAZADA = 'RECHAZADA'
}

export const SolicitudBajaSchema = object({
  id: number(),
  inscripcionId: number(),
  mesAviso: number(),
  porcentajeDevolucion: number(),
  montoPagado: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  montoADevolver: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  estado: string(),
  creadoEn: optional(nullable(string())),
});

export type SolicitudBaja = InferOutput<typeof SolicitudBajaSchema>;

// Admin version with more details
export const SolicitudBajaAdminSchema = object({
  id: number(),
  inscripcionId: number(),
  solicitanteUid: string(),
  mesAviso: number(),
  porcentajeDevolucion: number(),
  montoPagado: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  montoADevolver: union([
    number(),
    pipe(MoneyJsonSchema, transform((input) => input.parsedValue))
  ]),
  estado: string(),
  motivo: optional(nullable(string())),
  notasTesorero: optional(nullable(string())),
  procesadoPorUid: optional(nullable(string())),
  creadoEn: optional(nullable(string())),
  procesadoEn: optional(nullable(string())),
  codigoPlan: string(),
  nombrePlan: string(),
});

export type SolicitudBajaAdmin = InferOutput<typeof SolicitudBajaAdminSchema>;

export interface SolicitudBajaRequest {
  motivo?: string;
}
