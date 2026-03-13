/**
 * Servicio de Calendario
 *
 * Gestiona todas las operaciones relacionadas con eventos del calendario
 * usando axios como cliente HTTP.
 */

import { parse, array } from 'valibot';
import { client } from '../client';
import { 
  AsistenciaReunionDetalleSchema,
  EventoSchema, 
  ReunionInstanciaSchema,
  TipoEventoSchema,
  type ActualizarAsistenciaReunionRequest,
  type AsistenciaReunionDetalle,
  type Evento, 
  type TipoEvento,
  type EventoRequest,
  type EventoCalendarioFormateado,
  type PlantillaEventoAnual,
  type ReunionInstancia,
} from '../schemas/calendario';
import type { FiltroEventos } from '../query-keys/calendario.keys';

// Schema para lista de eventos
const EventosSchema = array(EventoSchema);
const ReunionesInstanciasSchema = array(ReunionInstanciaSchema);

/**
 * Convierte un evento del backend al formato del calendario UI
 */
function aEventoCalendario(evento: Evento): EventoCalendarioFormateado {
  const serieId = evento.serieId ?? evento.id ?? undefined;
  const esVirtual = Boolean(evento.virtual ?? !evento.id);

  return {
    id: esVirtual ? `${serieId ?? 'virtual'}-${evento.fechaInicio}` : String(serieId ?? evento.id),
    title: evento.titulo,
    start: (() => {
      const d = new Date(evento.fechaInicio);
      // Si es exactamente medianoche UTC, es probable que sea un evento de día completo
      // o un vencimiento. Lo forzamos a medianoche local para evitar el shift al día anterior.
      if (evento.fechaInicio.endsWith('T00:00:00Z')) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
      return d;
    })(),
    end: (() => {
      const d = new Date(evento.fechaFin);
      if (evento.fechaFin.endsWith('T23:59:59Z')) {
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59);
      }
      return d;
    })(),
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
    ubicacion: evento.ubicacion ?? undefined,
    latitud: evento.latitud ?? undefined,
    longitud: evento.longitud ?? undefined,
    urlMapa: evento.urlMapa ?? undefined,
    participantes: evento.participantes,
    realId: serieId,
    serieId,
    naturaleza: evento.naturaleza,
    departamentoId: evento.departamentoId ?? undefined,
    departamentoNombre: evento.departamentoNombre ?? undefined,
    periodicidad: evento.periodicidad ?? undefined,
    diaSemana: evento.diaSemana ?? undefined,
    horaInicio: evento.horaInicio ?? undefined,
    horaFin: evento.horaFin ?? undefined,
    grupoId: evento.grupoId ?? undefined,
    grupoNombre: evento.grupoNombre ?? undefined,
    plantillaAnualId: evento.plantillaAnualId ?? undefined,
    enlaceVideollamada: evento.enlaceVideollamada ?? undefined,
    audiencia: evento.audiencia ?? undefined,
    visibilidad: evento.visibilidad ?? undefined,
    estadoEvento: evento.estadoEvento ?? undefined,
    publicoObjetivo: evento.publicoObjetivo ?? undefined,
    politicaNotificacion: evento.politicaNotificacion ?? undefined,
    esVirtual,
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

  /**
   * Obtiene la planificación anual con estado de programación
   * (solo accesible para DIRIGENTE/ADMIN)
   */
  obtenerPlanificacionAnual: async (anio: number): Promise<PlantillaEventoAnual[]> => {
    const response = await client.get(`/calendario/planificacion-anual?anio=${anio}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((item: Record<string, unknown>) => ({
      id: Number(item.id ?? 0),
      codigo: String(item.codigo ?? ''),
      etiqueta: String(item.etiqueta ?? ''),
      departamentoId: Number(item.departamentoId ?? 0),
      departamento: String(item.departamento ?? ''),
      descripcion: String(item.descripcion ?? ''),
      naturaleza: String(item.naturaleza ?? 'evento') as 'evento' | 'reunion',
      critico: Boolean(item.critico),
      programado: Boolean(item.programado),
      eventoId: item.eventoId != null ? Number(item.eventoId) : null,
      publicoObjetivo: item.publicoObjetivo ? String(item.publicoObjetivo) : null,
      politicaNotificacion: item.politicaNotificacion ? String(item.politicaNotificacion) : null,
    }));
  },

  listarInstanciasReunion: async (reunionId: number, filtro: FiltroEventos = {}): Promise<ReunionInstancia[]> => {
    const query = construirQueryEventos(filtro);
    const response = await client.get(`/calendario/reuniones/${reunionId}/instancias${query}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return parse(ReunionesInstanciasSchema, data);
  },

  listarSeriesReunion: async (filtro: FiltroEventos = {}): Promise<Evento[]> => {
    const query = construirQueryEventos(filtro);
    const response = await client.get(`/calendario/reuniones/series${query}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return parse(EventosSchema, data);
  },

  obtenerAsistenciaReunion: async (instanciaId: number): Promise<AsistenciaReunionDetalle> => {
    const response = await client.get(`/calendario/reuniones/instancias/${instanciaId}/asistencia`);
    return parse(AsistenciaReunionDetalleSchema, response.data);
  },

  actualizarAsistenciaReunion: async (
    instanciaId: number,
    request: ActualizarAsistenciaReunionRequest
  ): Promise<AsistenciaReunionDetalle> => {
    const response = await client.put(`/calendario/reuniones/instancias/${instanciaId}/asistencia`, request);
    return parse(AsistenciaReunionDetalleSchema, response.data);
  },
};
