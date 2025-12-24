/**
 * Schemas de Valibot para el módulo de Calendario
 */

import { 
  object, 
  string, 
  number, 
  optional, 
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
  id: number(),
  titulo: string(),
  descripcion: optional(string()),
  tipo: string(),
  fechaInicio: string(),
  fechaFin: string(),
  ubicacion: optional(string()),
  participantes: optional(array(string())),
  fechaCreacion: optional(string()),
  fechaActualizacion: optional(string()),
});

export type Evento = InferOutput<typeof EventoSchema>;

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
  participantes: optional(array(string())),
});

export type EventoRequest = InferOutput<typeof EventoRequestSchema>;

// ============================================
// Tipos para evento formateado (UI)
// ============================================

export interface EventoCalendarioFormateado {
  id: string;
  title: string;
  start: Date;
  end: Date;
  descripcion: string;
  tipo: string;
  ubicacion?: string;
  participantes?: string[];
}
