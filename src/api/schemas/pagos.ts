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
  type InferOutput
} from 'valibot';
// Enums
// ============================================

export enum EstrategiaPlan {
  CUOTA_FIJA = 'CUOTA_FIJA',
  MONTO_DIVIDIDO = 'MONTO_DIVIDIDO'
}

export const EstrategiaPlanSchema = enum_(EstrategiaPlan);

// Helper for Java Month enum (backend returns strings like "JANUARY", etc or logic might map int to string)
// Frontend checks PlanPagoRequest uses 1-12 ints, PlanPagoModel uses Month enum strings.
// We will use string for model, int for request.

// ============================================
// Schemas: Plan de Pago (Model / Response)
// ============================================

export const PlanPagoSchema = object({
  id: optional(number()), // Added ID
  codigo: string(),
  nombre: string(),
  anio: number(),
  montoTotal: number(),
  minCuotas: optional(number()),
  maxCuotas: optional(number()),
  mesInicio: string(), // Month enum string e.g 'MARCH'
  mesFin: string(),    // Month enum string
  activo: boolean(),
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
});

export type PlanPagoRequest = InferOutput<typeof PlanPagoRequestSchema>;

// ============================================
// Schemas: Cuota
// ============================================

export const CuotaSchema = object({
  nroCuota: number(),
  vencimiento: string(), // ISO Date
  montoOriginal: number(),
  montoActual: number(),
  estado: string(), // 'PENDIENTE', 'PAGADA', 'VENCIDA'
  fechaPago: optional(string()),
});

export type Cuota = InferOutput<typeof CuotaSchema>;

// ============================================
// Schemas: Inscripción
// ============================================

export const InscripcionSchema = object({
  idInscripcion: number(),
  plan: PlanPagoSchema,
  estado: string(),
  fechaInscripcion: string(),
  cuotas: array(CuotaSchema),
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

export const IntencionPagoRequestSchema = object({
  idInscripcion: number(),
  nroCuota: number(),
});

export type IntencionPagoRequest = InferOutput<typeof IntencionPagoRequestSchema>;

export const IntencionPagoResponseSchema = object({
  id: number(),
  preferenceId: optional(string()),
  urlRedireccion: optional(string()), // For MP Redirect
  monto: number(),
  idInscripcion: number(),
});

export type IntencionPagoResponse = InferOutput<typeof IntencionPagoResponseSchema>;
