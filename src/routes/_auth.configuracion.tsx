import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Bell, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { notificacionesService } from '../api/services/notificaciones';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { getNotificationPermission, requestForToken } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import {
  useActualizarNotificacionesPreferencias,
  useNotificacionesPreferencias,
} from '../hooks/useNotificacionesPreferencias';

const NOTIFICATIONS_FALLBACK_USER_KEY = 'cas.notifications.fallback-user-id.v1';

type NotificationPermissionState = ReturnType<typeof getNotificationPermission>;

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
  const { user } = useAuth();
  const [actualizandoNotificaciones, setActualizandoNotificaciones] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );
  const { preferencias, cargando: cargandoPreferencias } = useNotificacionesPreferencias(Boolean(user));
  const { actualizarPreferencias, guardando: guardandoPreferencias } = useActualizarNotificacionesPreferencias();

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

  useEffect(() => {
    const syncPermission = () => {
      setNotificationPermission(getNotificationPermission());
    };

    syncPermission();
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('focus', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
    };
  }, []);

  const handleConfigurarNotificaciones = useCallback(async () => {
    setActualizandoNotificaciones(true);
    try {
      const token = await requestForToken();
      if (!token) {
        const permission = getNotificationPermission();
        setNotificationPermission(permission);

        if (permission === 'denied') {
          toast.error('Permiso bloqueado', {
            description: 'Habilitalo desde la configuracion del navegador y volve a intentar.',
          });
        } else if (permission === 'unsupported') {
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
      setNotificationPermission(getNotificationPermission());
      toast.success('Notificaciones activadas', {
        description: 'Este dispositivo ya puede recibir avisos del campamento.',
      });
    } catch (error) {
      console.error('Error activando notificaciones desde configuracion', error);
      toast.error('Error al activar notificaciones', {
        description: 'No pudimos registrar este dispositivo en el backend.',
      });
    } finally {
      setActualizandoNotificaciones(false);
    }
  }, [backendUserId]);

  const preferenciaCalendarioActiva = preferencias?.eventosCalendarioHabilitado ?? true;

  const handleToggleCalendario = useCallback(
    async (enabled: boolean) => {
      try {
        await actualizarPreferencias({ eventosCalendarioHabilitado: enabled });
        toast.success(enabled ? 'Avisos de calendario activados' : 'Avisos de calendario desactivados', {
          description: enabled
            ? 'Vas a volver a recibir push cuando se difundan eventos dirigidos a vos.'
            : 'Dejaste de recibir push de calendario. Tu visibilidad de eventos no cambia.',
        });
      } catch (error) {
        console.error('Error actualizando preferencias de notificacion', error);
        toast.error('No pudimos guardar tu preferencia', {
          description: 'Intentá nuevamente en unos segundos.',
        });
      }
    },
    [actualizarPreferencias],
  );

  const estadoNotificaciones = useMemo(() => {
    if (notificationPermission === 'granted') {
      return {
        badgeLabel: 'Activas',
        badgeVariant: 'default' as const,
        detalle: 'Tu dispositivo puede recibir push. Si cambiaste permisos, podes re-registrarlo.',
        botonLabel: 'Re-registrar dispositivo',
        botonDisabled: false,
      };
    }

    if (notificationPermission === 'denied') {
      return {
        badgeLabel: 'Bloqueadas',
        badgeVariant: 'destructive' as const,
        detalle: 'El navegador bloqueo este permiso. Habilitalo en configuracion y luego reintenta.',
        botonLabel: 'Reintentar activacion',
        botonDisabled: false,
      };
    }

    if (notificationPermission === 'unsupported') {
      return {
        badgeLabel: 'No soportadas',
        badgeVariant: 'outline' as const,
        detalle: 'Este navegador o dispositivo no soporta notificaciones push web.',
        botonLabel: 'No disponible',
        botonDisabled: true,
      };
    }

    return {
      badgeLabel: 'Sin configurar',
      badgeVariant: 'secondary' as const,
      detalle: 'Todavia no otorgaste permisos para notificaciones en este dispositivo.',
      botonLabel: 'Activar notificaciones',
      botonDisabled: false,
    };
  }, [notificationPermission]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="w-5 h-5" />
            Configuracion
          </CardTitle>
          <CardDescription>Ajustes de este dispositivo para avisos y recordatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">Notificaciones push</p>
                <Badge variant={estadoNotificaciones.badgeVariant}>{estadoNotificaciones.badgeLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{estadoNotificaciones.detalle}</p>
            </div>
            <Button
              type="button"
              onClick={handleConfigurarNotificaciones}
              disabled={actualizandoNotificaciones || estadoNotificaciones.botonDisabled}
              className="md:min-w-56"
            >
              {actualizandoNotificaciones ? 'Configurando...' : estadoNotificaciones.botonLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferencias de calendario</CardTitle>
          <CardDescription>
            Elegí si querés recibir notificaciones push cuando se difundan eventos dirigidos a vos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-medium">Difusión de eventos de calendario</p>
                <Badge variant={preferenciaCalendarioActiva ? 'default' : 'secondary'}>
                  {preferenciaCalendarioActiva ? 'Activa' : 'Silenciada'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta preferencia solo afecta push de calendario. No modifica qué eventos podés ver.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {preferenciaCalendarioActiva ? 'Recibir' : 'Silenciar'}
              </span>
              <Switch
                checked={preferenciaCalendarioActiva}
                onCheckedChange={(checked) => {
                  void handleToggleCalendario(Boolean(checked));
                }}
                disabled={cargandoPreferencias || guardandoPreferencias || !user}
                aria-label="Activar o desactivar notificaciones de calendario"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
