/**
 * Servicios API para el módulo de Revisión de Carpas
 */

import { apiBaseURL, client } from '../client';
import type {
  Carpa,
  Revision,
  FotoRevision,
  ResumenCarpas,
  EstadoCarpa,
  EstadoComponente,
  TipoComponente,
} from '../schemas/carpas';

// ============================================
// Tipos de Request
// ============================================

export interface CrearCarpaRequest {
  nombre: string;
  marca?: string;
  modelo?: string;
  capacidad?: number;
}

export interface ActualizarCarpaRequest {
  nombre?: string;
  marca?: string;
  modelo?: string;
  capacidad?: number;
}

export interface ComponenteRevisionRequest {
  tipoComponente: TipoComponente;
  estado: EstadoComponente;
  observacion?: string;
}

export interface CrearRevisionRequest {
  fechaRevision: string;
  estadoGeneral: EstadoCarpa;
  observacionesGenerales?: string;
  componentes: ComponenteRevisionRequest[];
}

// ============================================
// Servicio de Carpas
// ============================================

export const carpasService = {
  // ========================================
  // Carpas
  // ========================================

  /**
   * Lista todas las carpas con su última revisión
   */
  listarCarpas: async (): Promise<Carpa[]> => {
    const response = await client.get('/dirigente/carpas');
    return response.data;
  },

  /**
   * Crea una nueva carpa
   */
  crearCarpa: async (data: CrearCarpaRequest): Promise<Carpa> => {
    const response = await client.post('/dirigente/carpas', data);
    return response.data;
  },

  /**
   * Actualiza una carpa existente
   */
  actualizarCarpa: async (id: number, data: ActualizarCarpaRequest): Promise<Carpa> => {
    const response = await client.put(`/dirigente/carpas/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una carpa
   */
  eliminarCarpa: async (id: number): Promise<void> => {
    await client.delete(`/dirigente/carpas/${id}`);
  },

  // ========================================
  // Revisiones
  // ========================================

  /**
   * Lista revisiones de una carpa
   */
  listarRevisiones: async (carpaId: number): Promise<Revision[]> => {
    const response = await client.get(`/dirigente/carpas/${carpaId}/revisiones`);
    return response.data;
  },

  /**
   * Crea una nueva revisión
   */
  crearRevision: async (carpaId: number, data: CrearRevisionRequest): Promise<Revision> => {
    const response = await client.post(`/dirigente/carpas/${carpaId}/revisiones`, data);
    return response.data;
  },

  /**
   * Obtiene el detalle de una revisión
   */
  obtenerRevision: async (revisionId: number): Promise<Revision> => {
    const response = await client.get(`/dirigente/carpas/revisiones/${revisionId}`);
    return response.data;
  },

  // ========================================
  // Fotos
  // ========================================

  /**
   * Sube una foto a una revisión
   */
  subirFoto: async (revisionId: number, file: File, descripcion?: string): Promise<FotoRevision> => {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }
    const response = await client.post(
      `/dirigente/carpas/revisiones/${revisionId}/fotos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * Elimina una foto
   */
  eliminarFoto: async (revisionId: number, fotoId: number): Promise<void> => {
    await client.delete(`/dirigente/carpas/revisiones/${revisionId}/fotos/${fotoId}`);
  },

  /**
   * Retorna la URL para ver la foto original
   */
  getFotoUrl: (revisionId: number, fotoId: number): string => {
    return `${apiBaseURL}/dirigente/carpas/revisiones/${revisionId}/fotos/${fotoId}`;
  },

  /**
   * Retorna la URL para ver el thumbnail
   */
  getThumbnailUrl: (revisionId: number, fotoId: number): string => {
    return `${apiBaseURL}/dirigente/carpas/revisiones/${revisionId}/fotos/${fotoId}/thumbnail`;
  },

  // ========================================
  // Resumen
  // ========================================

  /**
   * Obtiene estadísticas generales
   */
  getResumen: async (): Promise<ResumenCarpas> => {
    const response = await client.get('/dirigente/carpas/resumen');
    return response.data;
  },
};
