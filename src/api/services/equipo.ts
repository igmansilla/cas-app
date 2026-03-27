/**
 * Servicios API para el módulo de Equipo de Montaña
 */

import { apiBaseURL, client } from '../client';
import type {
  CategoriaEquipo,
  ItemEquipo,
  ItemProgreso,
  ProgresoUsuario,
  ReporteProgresoUsuario,
  DetalleProgresoUsuario,
  Criticidad,
  FotoItemResponse,
  FotoCargadaEquipo,
} from '../schemas/equipo';

export interface RequisitoFotoRequest {
  id?: number;
  codigo?: string;
  titulo: string;
  descripcion?: string;
  orden?: number;
}

// ============================================
// Tipos de Request
// ============================================

export interface CrearCategoriaRequest {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarCategoriaRequest {
  nombre?: string;
  descripcion?: string;
  orden?: number;
}

export interface CrearItemRequest {
  nombre: string;
  cantidad?: number;
  obligatorio?: boolean;
  criticidad?: Criticidad;
  notas?: string;
  evitar?: string;
  requiereFoto?: boolean;
  requisitosFoto?: RequisitoFotoRequest[];
}

export interface ActualizarItemRequest {
  nombre?: string;
  cantidad?: number;
  obligatorio?: boolean;
  criticidad?: Criticidad;
  notas?: string;
  evitar?: string;
  orden?: number;
  requiereFoto?: boolean;
  requisitosFoto?: RequisitoFotoRequest[];
}

const notNullish = <T>(value: T | null | undefined): value is T => value != null;

const normalizeRequisitosFoto = (
  requisitosFoto: ItemEquipo['requisitosFoto'] | null | undefined,
): ItemEquipo['requisitosFoto'] => {
  if (!Array.isArray(requisitosFoto)) {
    return [];
  }

  return requisitosFoto.filter(notNullish);
};

const normalizeItem = (item: ItemEquipo | null | undefined): ItemEquipo | null => {
  if (!item) {
    return null;
  }

  return {
    ...item,
    requisitosFoto: normalizeRequisitosFoto(item.requisitosFoto),
  };
};

const normalizeCategorias = (categorias: CategoriaEquipo[] | null | undefined): CategoriaEquipo[] => {
  if (!Array.isArray(categorias)) {
    return [];
  }

  return categorias
    .filter(notNullish)
    .map((categoria) => ({
      ...categoria,
      items: Array.isArray(categoria.items)
        ? categoria.items.map((item) => normalizeItem(item)).filter(notNullish)
        : [],
    }));
};

const normalizeFotos = (fotos: FotoCargadaEquipo[] | null | undefined): FotoCargadaEquipo[] => {
  if (!Array.isArray(fotos)) {
    return [];
  }

  return fotos.filter(notNullish);
};

// ============================================
// Servicio de Equipo
// ============================================

export const equipoService = {
  // ========================================
  // Endpoints para usuarios
  // ========================================

  /**
   * Obtiene todas las categorías con sus items
   */
  getCategorias: async (): Promise<CategoriaEquipo[]> => {
    const response = await client.get('/equipo/categorias');
    return normalizeCategorias(response.data);
  },

  /**
   * Obtiene el progreso del usuario actual
   */
  getMiProgreso: async (): Promise<ProgresoUsuario> => {
    const response = await client.get('/equipo/mi-progreso');
    return response.data;
  },

  /**
   * Marca o desmarca un item
   */
  toggleItem: async (itemId: number): Promise<ItemProgreso> => {
    const response = await client.post(`/equipo/items/${itemId}/toggle`);
    return response.data;
  },

  /**
   * Resetea todo el checklist del usuario
   */
  resetearChecklist: async (): Promise<void> => {
    await client.delete('/equipo/mi-progreso');
  },

  // ========================================
  // Endpoints admin - Categorías
  // ========================================

  /**
   * Crea una nueva categoría
   */
  crearCategoria: async (data: CrearCategoriaRequest): Promise<CategoriaEquipo> => {
    const response = await client.post('/equipo/categorias', data);
    return response.data;
  },

  /**
   * Actualiza una categoría
   */
  actualizarCategoria: async (id: number, data: ActualizarCategoriaRequest): Promise<CategoriaEquipo> => {
    const response = await client.put(`/equipo/categorias/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una categoría (debe estar vacía)
   */
  eliminarCategoria: async (id: number): Promise<void> => {
    await client.delete(`/equipo/categorias/${id}`);
  },

  // ========================================
  // Endpoints admin - Items
  // ========================================

  /**
   * Crea un nuevo item en una categoría
   */
  crearItem: async (categoriaId: number, data: CrearItemRequest): Promise<ItemEquipo> => {
    const response = await client.post(`/equipo/categorias/${categoriaId}/items`, data);
    return response.data;
  },

  /**
   * Actualiza un item
   */
  actualizarItem: async (id: number, data: ActualizarItemRequest): Promise<ItemEquipo> => {
    const response = await client.put(`/equipo/items/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un item
   */
  eliminarItem: async (id: number): Promise<void> => {
    await client.delete(`/equipo/items/${id}`);
  },

  /**
   * Reordena los items de una categoría
   */
  reordenarItems: async (categoriaId: number, itemIds: number[]): Promise<void> => {
    await client.put(`/equipo/categorias/${categoriaId}/reordenar`, { ids: itemIds });
  },

  // ========================================
  // Endpoints de reportes
  // ========================================

  /**
   * Obtiene el reporte de progreso de todos los usuarios
   */
  getReporteProgreso: async (grupoId?: string): Promise<ReporteProgresoUsuario[]> => {
    const params = grupoId ? { grupoId } : {};
    const response = await client.get('/equipo/reportes/progreso', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle del progreso de un usuario
   */
  getDetalleProgresoUsuario: async (keycloakId: string): Promise<DetalleProgresoUsuario> => {
    const response = await client.get(`/equipo/reportes/keycloak/${encodeURIComponent(keycloakId)}`);
    return response.data;
  },

  // ========================================
  // Endpoints para fotos
  // ========================================

  /**
   * Sube una foto para un item
   */
  subirFotoRequisito: async (requisitoId: number, file: File): Promise<FotoItemResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/equipo/requisitos-foto/${requisitoId}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Elimina la foto de un item
   */
  eliminarFotoRequisito: async (requisitoId: number): Promise<void> => {
    await client.delete(`/equipo/requisitos-foto/${requisitoId}/foto`);
  },

  /**
   * Obtiene los IDs de los items que tienen foto
   */
  getMisFotos: async (): Promise<FotoCargadaEquipo[]> => {
    const response = await client.get('/equipo/mis-fotos');
    return normalizeFotos(response.data);
  },

  /**
   * Retorna la URL para previsualizar la foto (thumbnail)
   */
  getRequisitoThumbnailUrl: (requisitoId: number): string => {
    return `${apiBaseURL}/equipo/requisitos-foto/${requisitoId}/foto/thumbnail`;
  },

  /**
   * Retorna la URL para ver la foto completa
   */
  getRequisitoFotoUrl: (requisitoId: number): string => {
    return `${apiBaseURL}/equipo/requisitos-foto/${requisitoId}/foto`;
  },

  getAdminRequisitoFotoUrl: (keycloakId: string, requisitoId: number): string => {
    return `${apiBaseURL}/equipo/admin/keycloak/${encodeURIComponent(keycloakId)}/requisitos-foto/${requisitoId}/foto`;
  },
};
