/**
 * Hooks para el módulo de Equipo de Montaña
 * 
 * Proporcionan estado reactivo para operaciones del checklist usando TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipoService } from '../api/services/equipo';
import type {
  CrearCategoriaRequest,
  ActualizarCategoriaRequest,
  CrearItemRequest,
  ActualizarItemRequest,
} from '../api/services/equipo';

// ============================================
// Query Keys
// ============================================

export const equipoKeys = {
  all: ['equipo'] as const,
  categorias: () => [...equipoKeys.all, 'categorias'] as const,
  miProgreso: () => [...equipoKeys.all, 'mi-progreso'] as const,
  reportes: () => [...equipoKeys.all, 'reportes'] as const,
  reporteProgreso: (grupoId?: string) => [...equipoKeys.reportes(), 'progreso', grupoId] as const,
  detalleUsuario: (usuarioId: number) => [...equipoKeys.reportes(), 'usuario', usuarioId] as const,
  misFotos: () => [...equipoKeys.all, 'mis-fotos'] as const,
};

// ============================================
// Hooks de Lectura (Queries)
// ============================================

/**
 * Hook para obtener los IDs de los items que tienen foto
 */
export function useMisFotosEquipo() {
  const query = useQuery({
    queryKey: equipoKeys.misFotos(),
    queryFn: () => equipoService.getMisFotos(),
  });

  return {
    fotos: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener todas las categorías con sus items
 */
export function useCategorias() {
  const query = useQuery({
    queryKey: equipoKeys.categorias(),
    queryFn: () => equipoService.getCategorias(),
  });

  return {
    categorias: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el progreso del usuario actual
 */
export function useMiProgreso() {
  const query = useQuery({
    queryKey: equipoKeys.miProgreso(),
    queryFn: () => equipoService.getMiProgreso(),
  });

  return {
    progreso: query.data,
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el reporte de progreso (solo dirigentes/admin)
 */
export function useReporteProgreso(grupoId?: string) {
  const query = useQuery({
    queryKey: equipoKeys.reporteProgreso(grupoId),
    queryFn: () => equipoService.getReporteProgreso(grupoId),
  });

  return {
    usuarios: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el detalle del progreso de un usuario (solo dirigentes/admin)
 */
export function useDetalleProgresoUsuario(usuarioId: number) {
  const query = useQuery({
    queryKey: equipoKeys.detalleUsuario(usuarioId),
    queryFn: () => equipoService.getDetalleProgresoUsuario(usuarioId),
    enabled: usuarioId > 0,
  });

  return {
    detalle: query.data,
    cargando: query.isLoading,
    error: query.error,
  };
}

// ============================================
// Hooks de Mutación - Usuario
// ============================================

/**
 * Hook para marcar/desmarcar un item
 */
export function useToggleItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (itemId: number) => equipoService.toggleItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.miProgreso() });
    },
  });

  return {
    toggleItem: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para resetear el checklist
 */
export function useResetearChecklist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => equipoService.resetearChecklist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.miProgreso() });
    },
  });

  return {
    resetear: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Admin Categorías
// ============================================

/**
 * Hook para crear una categoría
 */
export function useCrearCategoria() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CrearCategoriaRequest) => equipoService.crearCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    crearCategoria: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para actualizar una categoría
 */
export function useActualizarCategoria() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarCategoriaRequest }) =>
      equipoService.actualizarCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    actualizarCategoria: (id: number, data: ActualizarCategoriaRequest) =>
      mutation.mutateAsync({ id, data }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para eliminar una categoría
 */
export function useEliminarCategoria() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => equipoService.eliminarCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    eliminarCategoria: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Admin Items
// ============================================

/**
 * Hook para crear un item
 */
export function useCrearItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ categoriaId, data }: { categoriaId: number; data: CrearItemRequest }) =>
      equipoService.crearItem(categoriaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    crearItem: (categoriaId: number, data: CrearItemRequest) =>
      mutation.mutateAsync({ categoriaId, data }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para actualizar un item
 */
export function useActualizarItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarItemRequest }) =>
      equipoService.actualizarItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    actualizarItem: (id: number, data: ActualizarItemRequest) =>
      mutation.mutateAsync({ id, data }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para eliminar un item
 */
export function useEliminarItem() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => equipoService.eliminarItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    eliminarItem: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para reordenar items
 */
export function useReordenarItems() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ categoriaId, itemIds }: { categoriaId: number; itemIds: number[] }) =>
      equipoService.reordenarItems(categoriaId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.categorias() });
    },
  });

  return {
    reordenarItems: (categoriaId: number, itemIds: number[]) =>
      mutation.mutateAsync({ categoriaId, itemIds }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Fotos
// ============================================

/**
 * Hook para subir una foto de un item
 */
export function useSubirFotoRequisito() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ requisitoId, file }: { requisitoId: number; file: File }) =>
      equipoService.subirFotoRequisito(requisitoId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.misFotos() });
    },
  });

  return {
    subirFoto: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para eliminar la foto de un item
 */
export function useEliminarFotoRequisito() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (requisitoId: number) => equipoService.eliminarFotoRequisito(requisitoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.misFotos() });
    },
  });

  return {
    eliminarFoto: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}
