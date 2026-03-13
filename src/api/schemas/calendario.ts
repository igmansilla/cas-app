/**
 * Schemas de Valibot para el módulo de Calendario
 */

import { 
  boolean,
  object, 
  string, 
  number, 
  optional, 
  nullable,
  array, 
  pipe, 
  minLength,
  check,
  forward,
  type InferOutput 
} from 'valibot';

// ============================================
// Schemas de Respuesta de la API
// ============================================

/**
 * Schema para tipo de evento del backend
 */
export const TipoEventoBackendSchema = object({
  codigo: optional(string()),
  etiqueta: optional(string()),
  formato: optional(string()),
});

export type TipoEventoBackend = InferOutput<typeof TipoEventoBackendSchema>;

/**
 * Schema para tipo de evento normalizado (para UI)
 */
export const TipoEventoSchema = object({
  codigo: string(),
  etiqueta: string(),
});

export type TipoEvento = InferOutput<typeof TipoEventoSchema>;

/**
 * Schema para evento del calendario
 */
export const EventoSchema = object({
  id: nullable(number()), // null para eventos virtuales
  serieId: optional(nullable(number())),
  virtual: optional(boolean()),
  titulo: string(),
  descripcion: nullable(string()),
  tipo: string(),
  naturaleza: optional(string()),
  fechaInicio: string(),
  fechaFin: string(),
  ubicacion: nullable(string()),
  latitud: optional(nullable(number())),
  longitud: optional(nullable(number())),
  urlMapa: optional(nullable(string())),
  participantes: optional(array(string())),
  grupoId: optional(nullable(string())),
  grupoNombre: optional(nullable(string())),
  departamentoId: optional(nullable(number())),
  departamentoNombre: optional(nullable(string())),
  plantillaAnualId: optional(nullable(number())),
  periodicidad: optional(nullable(string())),
  diaSemana: optional(nullable(string())),
  horaInicio: optional(nullable(string())), // Formato HH:mm:ss
  horaFin: optional(nullable(string())),
  enlaceVideollamada: optional(nullable(string())),
  audiencia: optional(nullable(string())),
  visibilidad: optional(nullable(string())),
  estadoEvento: optional(nullable(string())),
  publicoObjetivo: optional(nullable(string())),
  politicaNotificacion: optional(nullable(string())),
  fechaCreacion: optional(string()),
  fechaActualizacion: optional(string()),
});

export type Evento = InferOutput<typeof EventoSchema>;

export type EstadoAsistenciaReunion = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';

export const ReunionInstanciaSchema = object({
  id: number(),
  reunionId: number(),
  titulo: string(),
  grupoId: optional(nullable(string())),
  grupoNombre: optional(nullable(string())),
  departamentoId: optional(nullable(number())),
  departamentoNombre: optional(nullable(string())),
  fechaInicio: string(),
  fechaFin: string(),
  ubicacion: optional(nullable(string())),
  enlaceVideollamada: optional(nullable(string())),
  presentes: number(),
  ausentes: number(),
  justificados: number(),
  totalAsistencias: number(),
  asistenciaTomada: boolean(),
});

export type ReunionInstancia = InferOutput<typeof ReunionInstanciaSchema>;

export const AsistenciaReunionItemSchema = object({
  usuarioUid: string(),
  nombreMostrar: optional(nullable(string())),
  email: optional(nullable(string())),
  estado: string(),
});

export type AsistenciaReunionItem = InferOutput<typeof AsistenciaReunionItemSchema>;

export const AsistenciaReunionDetalleSchema = object({
  instanciaId: number(),
  reunionId: number(),
  titulo: string(),
  fechaInicio: string(),
  fechaFin: string(),
  presentes: number(),
  ausentes: number(),
  justificados: number(),
  total: number(),
  asistentes: array(AsistenciaReunionItemSchema),
});

export type AsistenciaReunionDetalle = InferOutput<typeof AsistenciaReunionDetalleSchema>;

export const ActualizarAsistenciaReunionRequestSchema = object({
  asistentes: array(object({
    usuarioUid: string(),
    nombreMostrar: optional(string()),
    email: optional(string()),
    estado: string(),
  })),
});

export type ActualizarAsistenciaReunionRequest = InferOutput<typeof ActualizarAsistenciaReunionRequestSchema>;

// ============================================
// Schemas de Formulario
// ============================================

/**
 * Schema para validación del formulario de evento
 */
export const EventoFieldSchema = object({
  titulo: pipe(string(), minLength(3, 'El título debe tener al menos 3 caracteres')),
  descripcion: string(),
  tipo: pipe(string(), minLength(1, 'Debes seleccionar un tipo')),
  fechaInicio: pipe(string(), minLength(1, 'Fecha inicio requerida')),
  fechaFin: pipe(string(), minLength(1, 'Fecha fin requerida')),
  ubicacion: string(),
  latitud: optional(number()),
  longitud: optional(number()),
  urlMapa: optional(string()),
  naturaleza: optional(string()),
  // Campos de recurrencia
  periodicidad: optional(string()),
  diaSemana: optional(string()),
  horaInicio: optional(string()),
  horaFin: optional(string()),
  enlaceVideollamada: optional(string()),
  publicoObjetivo: optional(string()),
  politicaNotificacion: optional(string()),
  grupoId: optional(string()),
  departamentoId: optional(string()),
  plantillaAnualId: optional(number()),
});

export const EventoFormSchema = pipe(
  EventoFieldSchema,
  forward(
    check(
      (input) => {
        const inicio = new Date(input.fechaInicio);
        const fin = new Date(input.fechaFin);
        return fin > inicio;
      },
      'La fecha de fin debe ser posterior a la fecha de inicio'
    ),
    ['fechaFin']
  ),
  check(
    (input) => {
      if ((input.naturaleza || 'EVENTO') === 'REUNION') {
        return !!input.grupoId;
      }
      return true;
    },
    'La reunión necesita un grupo'
  ),
  check(
    (input) => {
      const naturaleza = input.naturaleza || 'EVENTO';
      const tieneDepto = Boolean(input.departamentoId);
      if (naturaleza === 'EVENTO') return tieneDepto;
      if (naturaleza === 'REUNION' && !input.grupoId) return tieneDepto;
      return true;
    },
    'Selecciona un departamento'
  ),
  check(
    (input) => {
      if ((input.naturaleza || 'EVENTO') !== 'REUNION') return true;
      if (!input.horaInicio || !input.horaFin) return true;
      return input.horaFin > input.horaInicio;
    },
    'La hora de fin debe ser posterior a la hora de inicio'
  )
);

export type EventoFormData = InferOutput<typeof EventoFormSchema>;

// ============================================
// Schemas de Request
// ============================================

/**
 * Schema para request de creación/actualización de evento
 */
export const EventoRequestSchema = object({
  titulo: string(),
  descripcion: optional(string()),
  tipo: string(),
  fechaInicio: string(),
  fechaFin: string(),
  ubicacion: optional(string()),
  latitud: optional(number()),
  longitud: optional(number()),
  urlMapa: optional(string()),
  participantes: optional(array(string())),
  naturaleza: optional(string()),
  grupoId: optional(string()),
  departamentoId: optional(number()),
  plantillaAnualId: optional(number()),
  periodicidad: optional(string()),
  diaSemana: optional(string()),
  horaInicio: optional(string()),
  horaFin: optional(string()),
  enlaceVideollamada: optional(string()),
  audiencia: optional(string()),
  visibilidad: optional(string()),
  estadoEvento: optional(string()),
  publicoObjetivo: optional(string()),
  politicaNotificacion: optional(string()),
});

export type EventoRequest = InferOutput<typeof EventoRequestSchema>;

// ============================================
// Tipos para evento formateado (UI)
// ============================================

export interface EventoCalendarioFormateado {
  id: string; // "id" o "virtual-key"
  realId?: number;
  serieId?: number;
  title: string;
  start: Date;
  end: Date;
  descripcion: string;
  tipo: string;
  naturaleza?: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  urlMapa?: string;
  participantes?: string[];
  periodicidad?: string;
  diaSemana?: string;
  horaInicio?: string;
  horaFin?: string;
  grupoId?: string;
   grupoNombre?: string | null;
   departamentoId?: number | null;
   departamentoNombre?: string | null;
  plantillaAnualId?: number | null;
  enlaceVideollamada?: string;
  audiencia?: string;
  visibilidad?: string;
  estadoEvento?: string;
  publicoObjetivo?: string;
  politicaNotificacion?: string;
  esVirtual?: boolean;
}

// ============================================
// Tipos para planificación anual
// ============================================

export const PlantillaEventoAnualSchema = object({
  id: number(),
  codigo: string(),
  etiqueta: string(),
  departamentoId: number(),
  departamento: string(),
  descripcion: string(),
  naturaleza: string(),
  critico: boolean(),
  programado: boolean(),
  eventoId: nullable(number()),
  publicoObjetivo: optional(nullable(string())),
  politicaNotificacion: optional(nullable(string())),
});

/**
 * Plantilla de evento anual con estado de programación.
 */
export interface PlantillaEventoAnual {
  id: number;
  codigo: string;
  etiqueta: string;
  departamentoId: number;
  departamento: string;
  descripcion: string;
  /** "evento" (puntual departamental) o "reunion" (periódica) */
  naturaleza: 'evento' | 'reunion';
  critico: boolean;
  programado: boolean;
  eventoId: number | null;
  publicoObjetivo?: string | null;
  politicaNotificacion?: string | null;
}

