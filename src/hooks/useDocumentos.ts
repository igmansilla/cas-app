/**
 * Hooks para el módulo de Documentación
 *
 * Proporcionan estado reactivo para operaciones de documentos usando TanStack Query.
 */

import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentosService } from '../api/services/documentos';
import type {
  GuardarDocumentoRequest,
  CrearTipoDocumentoRequest,
  ObservarDocumentoRequest,
} from '../api/schemas/documentos';

// ============================================
// Query Keys
// ============================================

export const documentosKeys = {
  all: ['documentos'] as const,
  tipos: () => [...documentosKeys.all, 'tipos'] as const,
  tipoById: (id: number) => [...documentosKeys.tipos(), id] as const,
  tipoByCodigo: (codigo: string) => [...documentosKeys.tipos(), 'codigo', codigo] as const,
  resumenFamilia: (familiaId: number) => [...documentosKeys.all, 'familia', familiaId] as const,
  documentosUsuario: (keycloakId: string) => [...documentosKeys.all, 'usuario', keycloakId] as const,
  documento: (tipoId: number, keycloakId: string) => [...documentosKeys.all, 'tipo', tipoId, 'usuario', keycloakId] as const,
  tiposImprimiblesUsuario: (keycloakId: string) => [...documentosKeys.all, 'reportes', 'usuario', keycloakId, 'tipos-imprimibles'] as const,
  reportes: () => [...documentosKeys.all, 'reportes'] as const,
  reporteGrupo: (grupoId: string) => [...documentosKeys.reportes(), 'grupo', grupoId] as const,
  reporteGeneral: () => [...documentosKeys.reportes(), 'general'] as const,
  detalleUsuario: (keycloakId: string) => [...documentosKeys.reportes(), 'usuario', keycloakId] as const,
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
export function useDocumentosUsuario(keycloakId: string) {
  const query = useQuery({
    queryKey: documentosKeys.documentosUsuario(keycloakId),
    queryFn: () => documentosService.getDocumentosUsuario(keycloakId),
    enabled: !!keycloakId,
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
export function useDocumento(tipoDocumentoId: number, keycloakId: string) {
  const query = useQuery({
    queryKey: documentosKeys.documento(tipoDocumentoId, keycloakId),
    queryFn: () => documentosService.getDocumento(tipoDocumentoId, keycloakId),
    enabled: tipoDocumentoId > 0 && !!keycloakId,
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
export function useDetalleDocumentosUsuario(keycloakId: string) {
  const query = useQuery({
    queryKey: documentosKeys.detalleUsuario(keycloakId),
    queryFn: () => documentosService.getDetalleDocumentosUsuario(keycloakId),
    enabled: !!keycloakId,
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
export function useTiposImprimiblesUsuario(keycloakId: string) {
  const query = useQuery({
    queryKey: documentosKeys.tiposImprimiblesUsuario(keycloakId),
    queryFn: () => documentosService.getTiposImprimiblesUsuario(keycloakId),
    enabled: !!keycloakId,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }

      return failureCount < 3;
    },
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

  type GuardarDocumentoMutation = GuardarDocumentoRequest & {
    usuarioKeycloakId: string;
  };

  const mutation = useMutation({
    mutationFn: ({ usuarioKeycloakId: _usuarioKeycloakId, ...request }: GuardarDocumentoMutation) =>
      documentosService.guardarDocumento(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documentosUsuario(variables.usuarioKeycloakId),
      });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documento(variables.tipoDocumentoId, variables.usuarioKeycloakId),
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
      usuarioKeycloakId: string;
    }) => documentosService.subirAdjunto(documentoId, adjuntoRequeridoId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentosKeys.documentosUsuario(variables.usuarioKeycloakId),
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

/**
 * Hook para marcar un documento como observado (secretario/dirigente/admin)
 */
export function useObservarDocumento() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      documentoId,
      request,
    }: {
      documentoId: number;
      request: ObservarDocumentoRequest;
    }) => documentosService.observarDocumento(documentoId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.all });
    },
  });

  return {
    observarDocumento: mutation.mutateAsync,
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

