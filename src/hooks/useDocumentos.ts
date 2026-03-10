/**
 * Hooks para el módulo de Documentación
 *
 * Proporcionan estado reactivo para operaciones de documentos usando TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentosService } from '../api/services/documentos';
import type { GuardarDocumentoRequest, CrearTipoDocumentoRequest } from '../api/schemas/documentos';

// ============================================
// Query Keys
// ============================================

export const documentosKeys = {
  all: ['documentos'] as const,
  tipos: () => [...documentosKeys.all, 'tipos'] as const,
  tipoById: (id: number) => [...documentosKeys.tipos(), id] as const,
  tipoByCodigo: (codigo: string) => [...documentosKeys.tipos(), 'codigo', codigo] as const,
  resumenFamilia: (familiaId: number) => [...documentosKeys.all, 'familia', familiaId] as const,
  documentosUsuario: (usuarioId: number) => [...documentosKeys.all, 'usuario', usuarioId] as const,
  documento: (tipoId: number, usuarioId: number) => [...documentosKeys.all, 'tipo', tipoId, 'usuario', usuarioId] as const,
  tiposImprimiblesUsuario: (usuarioId: number) => [...documentosKeys.all, 'reportes', 'usuario', usuarioId, 'tipos-imprimibles'] as const,
  reportes: () => [...documentosKeys.all, 'reportes'] as const,
  reporteGrupo: (grupoId: string) => [...documentosKeys.reportes(), 'grupo', grupoId] as const,
  reporteGeneral: () => [...documentosKeys.reportes(), 'general'] as const,
  detalleUsuario: (usuarioId: number) => [...documentosKeys.reportes(), 'usuario', usuarioId] as const,
};

// ============================================
// Hooks de Lectura - Tipos de Documento
// ============================================

/**
 * Hook para obtener todos los tipos de documento activos
 */
export function useTiposDocumento() {
  const query = useQuery({
    queryKey: documentosKeys.tipos(),
    queryFn: () => documentosService.getTiposDocumento(),
  });

  return {
    tipos: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener un tipo de documento por ID
 */
export function useTipoDocumento(id: number) {
  const query = useQuery({
    queryKey: documentosKeys.tipoById(id),
    queryFn: () => documentosService.getTipoDocumento(id),
    enabled: id > 0,
  });

  return {
    tipo: query.data,
    cargando: query.isLoading,
    error: query.error,
  };
}

// ============================================
// Hooks de Lectura - Documentos de Usuario
// ============================================

/**
 * Hook para obtener el resumen de documentos de una familia
 */
export function useResumenFamilia(familiaId: number) {
  const query = useQuery({
    queryKey: documentosKeys.resumenFamilia(familiaId),
    queryFn: () => documentosService.getResumenFamilia(familiaId),
    enabled: familiaId > 0,
  });

  return {
    resumen: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener los documentos de un usuario
 */
export function useDocumentosUsuario(usuarioId: number) {
  const query = useQuery({
    queryKey: documentosKeys.documentosUsuario(usuarioId),
    queryFn: () => documentosService.getDocumentosUsuario(usuarioId),
    enabled: usuarioId > 0,
  });

  return {
    documentos: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener un documento específico
 */
export function useDocumento(tipoDocumentoId: number, usuarioId: number) {
  const query = useQuery({
    queryKey: documentosKeys.documento(tipoDocumentoId, usuarioId),
    queryFn: () => documentosService.getDocumento(tipoDocumentoId, usuarioId),
    enabled: tipoDocumentoId > 0 && usuarioId > 0,
  });

  return {
    documento: query.data,
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// Hooks de Lectura - Reportes
// ============================================

/**
 * Hook para obtener el reporte de documentación de un grupo
 */
export function useReporteDocumentosGrupo(grupoId: string | undefined) {
  const query = useQuery({
    queryKey: documentosKeys.reporteGrupo(grupoId || ''),
    queryFn: () => documentosService.getReporteGrupo(grupoId!),
    enabled: !!grupoId,
  });

  return {
    reporte: query.data,
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el reporte general de documentación (secretario)
 */
export function useReporteDocumentosGeneral() {
  const query = useQuery({
    queryKey: documentosKeys.reporteGeneral(),
    queryFn: () => documentosService.getReporteGeneral(),
  });

  return {
    reporte: query.data,
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para obtener el detalle de documentos de un usuario (dirigentes/secretario)
 */
export function useDetalleDocumentosUsuario(usuarioId: number) {
  const query = useQuery({
    queryKey: documentosKeys.detalleUsuario(usuarioId),
    queryFn: () => documentosService.getDetalleDocumentosUsuario(usuarioId),
    enabled: usuarioId > 0,
  });

  return {
    documentos: query.data || [],
    cargando: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook para obtener los tipos de documento imprimibles de un usuario.
 */
export function useTiposImprimiblesUsuario(usuarioId: number) {
  const query = useQuery({
    queryKey: documentosKeys.tiposImprimiblesUsuario(usuarioId),
    queryFn: () => documentosService.getTiposImprimiblesUsuario(usuarioId),
    enabled: usuarioId > 0,
  });

  return {
    tipos: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// Hooks de Mutación
// ============================================

/**
 * Hook para guardar o actualizar un documento
 */
export function useGuardarDocumento() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: GuardarDocumentoRequest) => documentosService.guardarDocumento(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documentosUsuario(variables.usuarioId),
      });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documento(variables.tipoDocumentoId, variables.usuarioId),
      });
    },
  });

  return {
    guardarDocumento: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para subir un archivo adjunto
 */
export function useSubirAdjunto() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      documentoId,
      adjuntoRequeridoId,
      file,
    }: {
      documentoId: number;
      adjuntoRequeridoId: number;
      file: File;
      usuarioId: number; // Used for cache invalidation only
    }) => documentosService.subirAdjunto(documentoId, adjuntoRequeridoId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documentosUsuario(variables.usuarioId),
      });
    },
  });

  return {
    subirAdjunto: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para marcar un adjunto como entregado físicamente
 */
export function useMarcarEntregaFisica() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (archivoId: number) => documentosService.marcarEntregaFisica(archivoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.all });
    },
  });

  return {
    marcarEntregaFisica: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================
// Hooks de Mutación - Tipos de Documento (Admin)
// ============================================

/**
 * Hook para crear un nuevo tipo de documento
 */
export function useCrearTipoDocumento() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: CrearTipoDocumentoRequest) => documentosService.crearTipoDocumento(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.tipos() });
    },
  });

  return {
    crearTipoDocumento: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para actualizar un tipo de documento
 */
export function useActualizarTipoDocumento() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: CrearTipoDocumentoRequest }) =>
      documentosService.actualizarTipoDocumento(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.tipos() });
      queryClient.invalidateQueries({ queryKey: documentosKeys.tipoById(variables.id) });
    },
  });

  return {
    actualizarTipoDocumento: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook para desactivar un tipo de documento
 */
export function useDesactivarTipoDocumento() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => documentosService.desactivarTipoDocumento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.tipos() });
    },
  });

  return {
    desactivarTipoDocumento: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
  };
}

