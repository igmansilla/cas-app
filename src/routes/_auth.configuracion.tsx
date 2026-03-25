import { createFileRoute } from '@tanstack/react-router';
import { Bell, Settings2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { getNotificationPermission, requestForToken } from '../lib/firebase';
import { notificacionesService } from '../api/services/notificaciones';

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
  const { user } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());

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
  }, [backendUserId]);

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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
