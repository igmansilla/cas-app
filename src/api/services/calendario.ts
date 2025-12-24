/**
 * Servicio de Calendario
 *
 * Gestiona todas las operaciones relacionadas con eventos del calendario
 * usando axios como cliente HTTP.
 */

import { parse, array } from 'valibot';
import { client } from '../client';
import { 
  EventoSchema, 
  TipoEventoSchema,
  type Evento, 
  type TipoEvento,
  type EventoRequest,
  type EventoCalendarioFormateado 
} from '../schemas/calendario';
import type { FiltroEventos } from '../query-keys/calendario.keys';

// Schema para lista de eventos
const EventosSchema = array(EventoSchema);

/**
 * Convierte un evento del backend al formato del calendario UI
 */
function aEventoCalendario(evento: Evento): EventoCalendarioFormateado {
  return {
    id: String(evento.id),
    title: evento.titulo,
    start: new Date(evento.fechaInicio),
    end: new Date(evento.fechaFin),
    descripcion: evento.descripcion || "",
    // Normalizar `tipo` que puede venir como string o como objeto { codigo, etiqueta, formato }
    tipo: ((): string => {
      const t: unknown = (evento as Record<string, unknown>).tipo;
      if (!t && t !== "") return "";
      if (typeof t === "string") return t;
      // si viene como objeto, preferir `formato`, luego `codigo`, luego `etiqueta`
      const obj = t as Record<string, string>;
      return obj.formato ?? obj.codigo ?? obj.etiqueta ?? String(t);
    })(),
    ubicacion: evento.ubicacion,
    participantes: evento.participantes,
  };
}

/**
 * Convierte una lista de eventos del backend al formato del calendario UI
 */
function aEventosCalendario(eventos: Evento[]): EventoCalendarioFormateado[] {
  return eventos.map((e) => aEventoCalendario(e));
}

/**
 * Formatea una fecha para el query string (ISO 8601)
 */
function formatearFecha(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  return date.toISOString();
}

/**
 * Construye los query params para el filtro de eventos
 */
function construirQueryEventos(filtro: FiltroEventos): string {
  const params = new URLSearchParams();

  const desde = formatearFecha(filtro.desde);
  const hasta = formatearFecha(filtro.hasta);

  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  if (filtro.tipo) params.append("tipo", filtro.tipo);

  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Servicio de calendario
 */
export const calendarioService = {
  /**
   * Lista eventos con filtros opcionales
   */
  listarEventos: async (filtro: FiltroEventos = {}): Promise<Evento[]> => {
    const query = construirQueryEventos(filtro);
    const response = await client.get(`/calendario/eventos${query}`);
    
    // Handle HATEOAS or standard JSON response
    if (response.data?._embedded?.eventoCalendarioModels) {
      return parse(EventosSchema, response.data._embedded.eventoCalendarioModels);
    }
    
    if (Array.isArray(response.data)) {
      return parse(EventosSchema, response.data);
    }
    
    return [];
  },

  /**
   * Obtiene un evento por ID
   */
  obtenerEvento: async (id: number): Promise<Evento> => {
    const response = await client.get(`/calendario/eventos/${id}`);
    return parse(EventoSchema, response.data);
  },

  /**
   * Crea un nuevo evento (solo admin/dirigente)
   */
  crearEvento: async (evento: EventoRequest): Promise<Evento> => {
    const response = await client.post('/calendario/eventos', evento);
    return parse(EventoSchema, response.data);
  },

  /**
   * Actualiza un evento existente (solo admin/dirigente)
   */
  actualizarEvento: async (id: number, evento: EventoRequest): Promise<Evento> => {
    const response = await client.put(`/calendario/eventos/${id}`, evento);
    return parse(EventoSchema, response.data);
  },

  /**
   * Elimina un evento (solo admin/dirigente)
   */
  eliminarEvento: async (id: number): Promise<void> => {
    await client.delete(`/calendario/eventos/${id}`);
  },

  /**
   * Lista los tipos de evento disponibles
   */
  listarTiposEvento: async (): Promise<TipoEvento[]> => {
    const response = await client.get('/calendario/tipos');
    
    // El backend devuelve _embedded.tipoEventoModels
    const tiposBackend = response.data?._embedded?.tipoEventoModels || response.data || [];
    
    // Los campos ya coinciden con el schema (codigo, etiqueta)
    return (Array.isArray(tiposBackend) ? tiposBackend : []).map((tipo) => parse(TipoEventoSchema, tipo));
  },

  /**
   * Obtiene eventos de un mes específico
   */
  obtenerEventosMes: async (year: number, month: number): Promise<Evento[]> => {
    // month es 0-indexed en JavaScript, pero 1-indexed en la API
    const desde = new Date(year, month, 1);
    const hasta = new Date(year, month + 1, 0, 23, 59, 59); // Último día del mes

    return calendarioService.listarEventos({ desde, hasta });
  },

  /**
   * Obtiene eventos de hoy
   */
  obtenerEventosHoy: async (): Promise<Evento[]> => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const finDia = new Date(hoy);
    finDia.setHours(23, 59, 59, 999);

    return calendarioService.listarEventos({ desde: hoy, hasta: finDia });
  },

  /**
   * Obtiene próximos eventos
   */
  obtenerProximosEventos: async (dias: number = 30): Promise<Evento[]> => {
    const desde = new Date();
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + dias);

    return calendarioService.listarEventos({ desde, hasta });
  },

  // ============================================
  // Helpers para UI
  // ============================================

  /**
   * Convierte un evento del backend al formato del calendario UI
   */
  aEventoCalendario,

  /**
   * Convierte una lista de eventos del backend al formato del calendario UI
   */
  aEventosCalendario,
};
