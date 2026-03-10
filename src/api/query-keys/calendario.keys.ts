/**
 * Query Keys para el módulo de Calendario
 * 
 * Centraliza todas las claves de TanStack Query para invalidación y caching consistente
 */

export interface FiltroEventos {
  desde?: Date | string;
  hasta?: Date | string;
  tipo?: string;
}

export const calendarioKeys = {
  todos: ['calendario'] as const,
  eventos: (filtro?: FiltroEventos) => [...calendarioKeys.todos, 'eventos', filtro] as const,
  evento: (id: number) => [...calendarioKeys.todos, 'evento', id] as const,
  tipos: () => [...calendarioKeys.todos, 'tipos'] as const,
  proximos: (dias: number) => [...calendarioKeys.todos, 'proximos', dias] as const,
  planificacion: (anio: number) => [...calendarioKeys.todos, 'planificacion', anio] as const,
  reuniones: () => [...calendarioKeys.todos, 'reuniones'] as const,
  reunionSeries: (filtro?: FiltroEventos) => [...calendarioKeys.reuniones(), 'series', filtro] as const,
  reunionInstancias: (reunionId: number, filtro?: FiltroEventos) =>
    [...calendarioKeys.reuniones(), 'instancias', reunionId, filtro] as const,
  reunionAsistencia: (instanciaId: number) =>
    [...calendarioKeys.reuniones(), 'asistencia', instanciaId] as const,
};
