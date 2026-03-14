import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacionesService } from '../api/services/notificaciones';

const NOTIFICACIONES_PREFERENCIAS_KEY = ['notificaciones', 'preferencias'] as const;

export function useNotificacionesPreferencias(enabled = true) {
  const query = useQuery({
    queryKey: NOTIFICACIONES_PREFERENCIAS_KEY,
    queryFn: () => notificacionesService.obtenerPreferenciasUsuario(),
    enabled,
  });

  return {
    preferencias: query.data,
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useActualizarNotificacionesPreferencias() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ eventosCalendarioHabilitado }: { eventosCalendarioHabilitado: boolean }) =>
      notificacionesService.actualizarPreferenciasUsuario({ eventosCalendarioHabilitado }),
    onSuccess: (preferencias) => {
      queryClient.setQueryData(NOTIFICACIONES_PREFERENCIAS_KEY, preferencias);
    },
  });

  return {
    actualizarPreferencias: mutation.mutateAsync,
    guardando: mutation.isPending,
    error: mutation.error,
  };
}
