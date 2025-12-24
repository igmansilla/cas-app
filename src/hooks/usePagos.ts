/**
 * Hooks específicos para el módulo de Pagos
 */

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { pagosService } from '../api/services/pagos';
import { pagosKeys } from '../api/query-keys/pagos.keys';
import type { PlanPagoRequest, InscripcionRequest, IntencionPagoRequest } from '../api/schemas/pagos';

// ============================================
// Hooks para Planes (Admin/Public)
// ============================================

export function usePlanes() {
  const query = useQuery({
    queryKey: pagosKeys.planes.todos,
    queryFn: () => pagosService.listarPlanes(),
    placeholderData: keepPreviousData
  });

  return {
    planes: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

export function usePlan(id: number | null) {
  const query = useQuery({
    queryKey: pagosKeys.planes.detalle(id!),
    queryFn: () => pagosService.obtenerPlan(id!),
    enabled: !!id
  });

  return {
    plan: query.data,
    cargando: query.isLoading,
    error: query.error
  };
}

export function useCrearPlan() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (plan: PlanPagoRequest) => pagosService.crearPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagosKeys.planes.todos });
    }
  });

  return {
    crearPlan: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  };
}

export function useActualizarPlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, plan }: { id: number; plan: PlanPagoRequest }) => 
      pagosService.actualizarPlan(id, plan),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: pagosKeys.planes.todos });
      queryClient.invalidateQueries({ queryKey: pagosKeys.planes.detalle(variables.id) });
    }
  });

  return {
    actualizarPlan: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  };
}

// ============================================
// Hooks para Inscripciones y Pagos (Usuarios)
// ============================================

export function useMisInscripciones() {
  const query = useQuery({
    queryKey: pagosKeys.inscripciones.mis,
    queryFn: () => pagosService.listarMisInscripciones()
  });

  return {
    inscripciones: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

export function useInscribirse() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: InscripcionRequest) => pagosService.inscribirse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagosKeys.inscripciones.mis });
    }
  });

  return {
    inscribirse: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  };
}

export function useCuotas(idInscripcion: number | null) {
  const query = useQuery({
    queryKey: pagosKeys.inscripciones.cuotas(idInscripcion!),
    queryFn: () => pagosService.obtenerCuotas(idInscripcion!),
    enabled: !!idInscripcion
  });

  return {
    cuotas: query.data || [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}

export function useCrearIntencionPago() {
  const mutation = useMutation({
    mutationFn: (data: IntencionPagoRequest) => pagosService.crearIntencionPago(data),
    // No invalidation needed immediately, redirect handles next steps
  });

  return {
    crearIntencion: mutation.mutateAsync,
    cargando: mutation.isPending,
    error: mutation.error
  };
}
