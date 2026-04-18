/**
 * Hooks para el módulo de Revisión de Carpas
 *
 * Proporcionan estado reactivo para operaciones de carpas usando TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  carpasService,
  type CrearCarpaRequest,
  type ActualizarCarpaRequest,
  type CrearRevisionRequest,
} from '../api/services/carpas';

// ============================================
// Query Keys
// ============================================

export const carpasKeys = {
  all: ['carpas'] as const,
  lista: () => [...carpasKeys.all, 'lista'] as const,
  revisiones: (carpaId: number) => [...carpasKeys.all, 'revisiones', carpaId] as const,
  revision: (revisionId: number) => [...carpasKeys.all, 'revision', revisionId] as const,
  resumen: () => [...carpasKeys.all, 'resumen'] as const,
};

// ============================================
// Hooks de Lectura
// ============================================

/**
 * Hook para obtener todas las carpas
 */
export function useCarpas() {
  const query = useQuery({
    queryKey: carpasKeys.lista(),
    queryFn: () => carpasService.listarCarpas(),
  });

  return {
    carpas: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener revisiones de una carpa
 */
export function useRevisionesByCarpa(carpaId: number) {
  const query = useQuery({
    queryKey: carpasKeys.revisiones(carpaId),
    queryFn: () => carpasService.listarRevisiones(carpaId),
    enabled: carpaId > 0,
  });

  return {
    revisiones: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el detalle de una revisión
 */
export function useDetalleRevision(revisionId: number) {
  const query = useQuery({
    queryKey: carpasKeys.revision(revisionId),
    queryFn: () => carpasService.obtenerRevision(revisionId),
    enabled: revisionId > 0,
  });

  return {
    revision: query.data,
    cargando: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook para obtener estadísticas generales
 */
export function useResumenCarpas() {
  const query = useQuery({
    queryKey: carpasKeys.resumen(),
    queryFn: () => carpasService.getResumen(),
  });

  return {
    resumen: query.data,
    cargando: query.isLoading,
    error: query.error,
  };
}

// ============================================
// Hooks de Mutación - Carpas
// ============================================

/**
 * Hook para crear una carpa
 */
export function useCrearCarpa() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CrearCarpaRequest) => carpasService.crearCarpa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
      queryClient.invalidateQueries({ queryKey: carpasKeys.resumen() });
    },
  });

  return {
    crearCarpa: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para actualizar una carpa
 */
export function useActualizarCarpa() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarCarpaRequest }) =>
      carpasService.actualizarCarpa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
    },
  });

  return {
    actualizarCarpa: (id: number, data: ActualizarCarpaRequest) =>
      mutation.mutateAsync({ id, data }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para eliminar una carpa
 */
export function useEliminarCarpa() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => carpasService.eliminarCarpa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
      queryClient.invalidateQueries({ queryKey: carpasKeys.resumen() });
    },
  });

  return {
    eliminarCarpa: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Revisiones
// ============================================

/**
 * Hook para crear una revisión
 */
export function useCrearRevision() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ carpaId, data }: { carpaId: number; data: CrearRevisionRequest }) =>
      carpasService.crearRevision(carpaId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: carpasKeys.revisiones(variables.carpaId) });
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
      queryClient.invalidateQueries({ queryKey: carpasKeys.resumen() });
    },
  });

  return {
    crearRevision: (carpaId: number, data: CrearRevisionRequest) =>
      mutation.mutateAsync({ carpaId, data }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Fotos
// ============================================

/**
 * Hook para subir una foto a una revisión
 */
export function useSubirFotoRevision() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      revisionId,
      file,
      descripcion,
    }: {
      revisionId: number;
      file: File;
      descripcion?: string;
    }) => carpasService.subirFoto(revisionId, file, descripcion),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: carpasKeys.revision(variables.revisionId),
      });
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
    },
  });

  return {
    subirFoto: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para eliminar una foto
 */
export function useEliminarFotoRevision() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ revisionId, fotoId }: { revisionId: number; fotoId: number }) =>
      carpasService.eliminarFoto(revisionId, fotoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: carpasKeys.revision(variables.revisionId),
      });
      queryClient.invalidateQueries({ queryKey: carpasKeys.lista() });
    },
  });

  return {
    eliminarFoto: (revisionId: number, fotoId: number) =>
      mutation.mutateAsync({ revisionId, fotoId }),
    cargando: mutation.isPending,
    error: mutation.error,
  };
}
