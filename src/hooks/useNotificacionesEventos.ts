import { useQuery } from '@tanstack/react-query';
import { notificacionesService } from '../api/services/notificaciones';

const NOTIFICACIONES_EVENTOS_KEY = ['notificaciones', 'eventos'] as const;

export function useNotificacionesEventos(limit = 50, enabled = true) {
  const query = useQuery({
    queryKey: [...NOTIFICACIONES_EVENTOS_KEY, limit],
    queryFn: () => notificacionesService.obtenerEventos(limit),
    enabled,
    refetchInterval: 20_000,
  });

  return {
    eventos: query.data ?? [],
    cargando: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
