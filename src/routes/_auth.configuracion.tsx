import { createFileRoute } from '@tanstack/react-router';
import { Bell, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { getNotificationPermission, requestForToken } from '../lib/firebase';
import {
  notificacionesService,
  type EstadoDispositivo,
  type NotificacionEventoLog,
} from '../api/services/notificaciones';

const NOTIFICATIONS_FALLBACK_USER_KEY = 'cas.notifications.fallback-user-id.v1';

function resolvePlatform() {
  if (typeof navigator === 'undefined') {
    return 'web';
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) {
    return 'android';
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    return 'ios';
  }

  return 'web';
}

export const Route = createFileRoute('/_auth/configuracion')({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { user, hasRole } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [dispositivos, setDispositivos] = useState<EstadoDispositivo[]>([]);
  const [eventosRecientes, setEventosRecientes] = useState<NotificacionEventoLog[]>([]);

  const backendUserId = useMemo(() => {
    const uid = user?.uid?.trim();
    if (uid) {
      return uid;
    }

    const email = user?.email?.trim();
    if (email) {
      return email;
    }

    if (typeof window === 'undefined') {
      return 'web-user';
    }

    const existing = window.localStorage.getItem(NOTIFICATIONS_FALLBACK_USER_KEY);
    if (existing && existing.trim()) {
      return existing;
    }

    const generated = `web-${Date.now()}`;
    window.localStorage.setItem(NOTIFICATIONS_FALLBACK_USER_KEY, generated);
    return generated;
  }, [user?.uid, user?.email]);

  const canViewDiagnostics = hasRole('admin');

  const cargarDiagnostico = useCallback(async () => {
    if (!canViewDiagnostics) {
      return;
    }

    setIsLoadingDiagnostics(true);
    try {
      const [estado, eventos] = await Promise.all([
        notificacionesService.obtenerEstadoDispositivos(backendUserId),
        notificacionesService.obtenerEventos(20),
      ]);
      setDispositivos(estado.dispositivos ?? []);
      setEventosRecientes(eventos ?? []);
    } catch (error) {
      console.error('Error obteniendo diagnostico de notificaciones', error);
      toast.error('No pudimos cargar el diagnostico de notificaciones.');
    } finally {
      setIsLoadingDiagnostics(false);
    }
  }, [backendUserId, canViewDiagnostics]);

  const activarNotificacionesPush = useCallback(async () => {
    setIsActivating(true);
    try {
      const token = await requestForToken();
      const updatedPermission = getNotificationPermission();
      setPermission(updatedPermission);

      if (!token) {
        if (updatedPermission === 'denied') {
          toast.error('Permiso bloqueado', {
            description: 'Habilita notificaciones para este sitio desde la configuracion del navegador.',
          });
        } else if (updatedPermission === 'unsupported') {
          toast.error('Notificaciones no soportadas', {
            description: 'Este navegador no soporta push para esta app.',
          });
        } else {
          toast.error('No se pudo activar notificaciones', {
            description: 'No se obtuvo un token de Firebase para este dispositivo.',
          });
        }
        return;
      }

      await notificacionesService.registrarTokenDispositivo(token, backendUserId, resolvePlatform());
      if (canViewDiagnostics) {
        await cargarDiagnostico();
      }
      toast.success('Dispositivo registrado', {
        description: 'Listo, este dispositivo ya puede recibir avisos del calendario.',
      });
    } catch (error) {
      console.error('Error registrando token de notificaciones', error);
      toast.error('Error al registrar dispositivo', {
        description: 'No pudimos registrar este dispositivo en el backend.',
      });
    } finally {
      setIsActivating(false);
    }
  }, [backendUserId, canViewDiagnostics, cargarDiagnostico]);

  useEffect(() => {
    void cargarDiagnostico();
  }, [cargarDiagnostico]);

  const resumenProveedores = useMemo(() => {
    const resumen: Record<string, number> = {
      NOVU: 0,
      FCM_FORCED: 0,
      FCM: 0,
    };

    for (const evento of eventosRecientes) {
      if (evento.provider in resumen) {
        resumen[evento.provider] += 1;
      }
    }

    return resumen;
  }, [eventosRecientes]);

  const resumenEstados = useMemo(() => {
    const resumen: Record<string, number> = {
      OK: 0,
      PARTIAL: 0,
      ERROR: 0,
      SKIPPED: 0,
    };

    for (const evento of eventosRecientes) {
      if (evento.estado in resumen) {
        resumen[evento.estado] += 1;
      }
    }

    return resumen;
  }, [eventosRecientes]);

  const saludEntrega = useMemo(() => {
    if (dispositivos.length === 0) {
      return {
        label: 'Riesgo alto',
        detail: 'No hay dispositivos registrados para este usuario.',
        classes: 'border-red-200 bg-red-50 text-red-800',
      };
    }

    if (resumenEstados.ERROR > 0) {
      return {
        label: 'Riesgo',
        detail: 'Se detectaron errores recientes de entrega.',
        classes: 'border-red-200 bg-red-50 text-red-800',
      };
    }

    if (resumenProveedores.FCM_FORCED > 0) {
      return {
        label: 'Fallback activo',
        detail: 'Hay envios forzados por falta de canal push en Novu.',
        classes: 'border-amber-200 bg-amber-50 text-amber-800',
      };
    }

    if (resumenProveedores.NOVU > 0 && resumenEstados.OK > 0) {
      return {
        label: 'Saludable',
        detail: 'Novu esta enviando con estado OK en eventos recientes.',
        classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      };
    }

    return {
      label: 'Observacion',
      detail: 'Aun no hay suficiente actividad reciente para confirmar salud.',
      classes: 'border-slate-200 bg-slate-50 text-slate-800',
    };
  }, [dispositivos.length, resumenEstados.ERROR, resumenEstados.OK, resumenProveedores.FCM_FORCED, resumenProveedores.NOVU]);

  const ultimosEventos = useMemo(() => eventosRecientes.slice(0, 3), [eventosRecientes]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="w-5 h-5" />
            Configuracion
          </CardTitle>
          <CardDescription>Preferencias generales de la cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            <p className="font-medium">Notificaciones</p>
            <p className="mt-1">
              La configuracion de notificaciones se gestiona desde la campanita de Novu en el menu de usuario.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-orange-300 bg-white px-3 py-1.5 text-orange-800">
              <Bell className="h-4 w-4" />
              <span>Usa la campanita para ver y administrar tus avisos.</span>
            </div>
            <div className="mt-4 space-y-2">
              <Button type="button" onClick={activarNotificacionesPush} disabled={isActivating}>
                {isActivating ? 'Activando...' : 'Activar notificaciones en este dispositivo'}
              </Button>
              {canViewDiagnostics && (
                <Button type="button" variant="outline" onClick={cargarDiagnostico} disabled={isLoadingDiagnostics}>
                  {isLoadingDiagnostics ? 'Actualizando diagnostico...' : 'Actualizar diagnostico'}
                </Button>
              )}
              <p className="text-xs text-orange-800">
                Estado del navegador:{' '}
                {permission === 'granted'
                  ? 'habilitado'
                  : permission === 'denied'
                    ? 'bloqueado'
                    : permission === 'unsupported'
                      ? 'no soportado'
                      : 'pendiente'}
              </p>

              {canViewDiagnostics && (
                <div className="mt-3 rounded-md border border-orange-200 bg-white p-3 text-xs text-orange-900">
                  <p className="font-semibold">Diagnostico rapido</p>
                  <div className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 font-medium ${saludEntrega.classes}`}>
                    Salud de entrega: {saludEntrega.label}
                  </div>
                  <p className="mt-2">{saludEntrega.detail}</p>
                  <p className="mt-1">Dispositivos registrados: {dispositivos.length}</p>
                  <p className="mt-1">Eventos recientes por provider:</p>
                  <p className="mt-1">NOVU: {resumenProveedores.NOVU}</p>
                  <p className="mt-1">FCM_FORCED: {resumenProveedores.FCM_FORCED}</p>
                  <p className="mt-1">FCM: {resumenProveedores.FCM}</p>
                  <p className="mt-1">Estados: OK {resumenEstados.OK} / PARTIAL {resumenEstados.PARTIAL} / ERROR {resumenEstados.ERROR}</p>
                  {ultimosEventos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-semibold">Ultimos eventos</p>
                      {ultimosEventos.map((evento) => (
                        <p key={evento.id}>
                          {new Date(evento.creadoEn).toLocaleString('es-AR')} - {evento.provider} - {evento.estado}
                          {evento.detalle ? ` - ${evento.detalle}` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  {dispositivos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-semibold">Dispositivos</p>
                      {dispositivos.slice(0, 5).map((dispositivo) => (
                        <p key={`${dispositivo.token}-${dispositivo.plataforma}-${dispositivo.ultimoVisto}`}>
                          {dispositivo.plataforma || 'desconocida'} - {dispositivo.token} - ultimo visto{' '}
                          {dispositivo.ultimoVisto
                            ? new Date(dispositivo.ultimoVisto).toLocaleString('es-AR')
                            : 'sin datos'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
