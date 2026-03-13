import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Toaster } from "../components/ui/sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getNotificationPermission,
  onMessageListener,
  requestForToken,
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { notificacionesService } from "../api/services/notificaciones";
import { Button } from "../components/ui/button";

const NOTIFICATIONS_PROMPT_DISMISSED_KEY = "cas.notifications.prompt.dismissed.v1";
const NOTIFICATIONS_FALLBACK_USER_KEY = "cas.notifications.fallback-user-id.v1";
const APP_NOTIFICATION_ICON = "/pwa-192x192.png";
const APP_NOTIFICATION_BADGE = "/pwa-64x64.png";

function resolvePlatform() {
  if (typeof navigator === "undefined") {
    return "web";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) {
    return "android";
  }
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
    return "ios";
  }

  return "web";
}

function setAppBadgeSafe(value: number) {
  if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) {
    return;
  }

  void (navigator as Navigator & { setAppBadge: (value?: number) => Promise<void> })
    .setAppBadge(value)
    .catch(() => undefined);
}

function clearAppBadgeSafe() {
  if (typeof navigator === "undefined" || !("clearAppBadge" in navigator)) {
    return;
  }

  void (navigator as Navigator & { clearAppBadge: () => Promise<void> })
    .clearAppBadge()
    .catch(() => undefined);
}

function showForegroundSystemNotification(payload: any) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const title = payload?.notification?.title || "Nuevo mensaje";
  const body = payload?.notification?.body || "Tenes una nueva notificacion";

  try {
    const notification = new Notification(title, {
      body,
      icon: APP_NOTIFICATION_ICON,
      badge: APP_NOTIFICATION_BADGE,
      data: payload?.data,
      tag: payload?.data?.eventoId ? `evento-${payload.data.eventoId}` : undefined,
      renotify: Boolean(payload?.data?.eventoId),
    });

    notification.onclick = () => {
      window.focus();
      clearAppBadgeSafe();
      notification.close();
    };

    setAppBadgeSafe(1);
  } catch (error) {
    console.error("No se pudo mostrar notificacion del sistema en foreground", error);
  }
}

export const Route = createRootRoute({
  component: RootRouteComponent,
});

function RootRouteComponent() {
  const { isAuthenticated, user } = useAuth();
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

  const backendUserId = useMemo(() => {
    const uid = user?.uid?.trim();
    if (uid) {
      return uid;
    }

    const email = user?.email?.trim();
    if (email) {
      return email;
    }

    if (typeof window === "undefined") {
      return "web-user";
    }

    const existing = window.localStorage.getItem(NOTIFICATIONS_FALLBACK_USER_KEY);
    if (existing && existing.trim()) {
      return existing;
    }

    const generated = `web-${Date.now()}`;
    window.localStorage.setItem(NOTIFICATIONS_FALLBACK_USER_KEY, generated);
    return generated;
  }, [user?.uid, user?.email]);

  const registerTokenInBackend = useCallback(
    async (token: string) => {
      await notificacionesService.registrarTokenDispositivo(token, backendUserId, resolvePlatform());
    },
    [backendUserId],
  );

  const enableNotifications = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setIsEnablingNotifications(true);
      }

      try {
        const token = await requestForToken();
        if (!token) {
          if (!silent) {
            const permission = getNotificationPermission();
            if (permission === "denied") {
              toast.error("Permiso bloqueado", {
                description: "Revisa la configuracion del navegador para habilitar notificaciones.",
              });
            } else if (permission === "unsupported") {
              toast.error("Notificaciones no soportadas", {
                description: "Este navegador no soporta notificaciones push para esta app.",
              });
            } else {
              toast.error("No se pudo activar notificaciones", {
                description: "No se obtuvo un token de Firebase para este dispositivo.",
              });
            }
          }
          return;
        }

        await registerTokenInBackend(token);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(NOTIFICATIONS_PROMPT_DISMISSED_KEY, "1");
        }

        setShowNotificationsPrompt(false);
        clearAppBadgeSafe();
        if (!silent) {
          toast.success("Notificaciones activadas", {
            description: "Este dispositivo ya puede recibir avisos del campamento.",
          });
        }
      } catch (error) {
        console.error("Error activando notificaciones", error);
        if (!silent) {
          toast.error("Error al activar notificaciones", {
            description: "No pudimos registrar este dispositivo en el backend.",
          });
        }
      } finally {
        if (!silent) {
          setIsEnablingNotifications(false);
        }
      }
    },
    [registerTokenInBackend],
  );

  const dismissNotificationsPrompt = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NOTIFICATIONS_PROMPT_DISMISSED_KEY, "1");
    }
    setShowNotificationsPrompt(false);
  }, []);

  useEffect(() => {
    // Solo mostrar si el usuario está autenticado
    if (!isAuthenticated) {
      setShowNotificationsPrompt(false);
      return;
    }

    const unsubscribe = onMessageListener((payload: any) => {
      console.log("Foreground message received:", payload);
      toast(payload.notification?.title || "New Message", {
        description: payload.notification?.body,
      });
      showForegroundSystemNotification(payload);
    });

    const permission = getNotificationPermission();
    if (permission === "granted") {
      setShowNotificationsPrompt(false);
      void enableNotifications(true);
    } else if (permission === "default") {
      const dismissed =
        typeof window !== "undefined" &&
        window.localStorage.getItem(NOTIFICATIONS_PROMPT_DISMISSED_KEY) === "1";
      setShowNotificationsPrompt(!dismissed);
    } else {
      setShowNotificationsPrompt(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [enableNotifications, isAuthenticated]);

  const onEnableClick = useCallback(() => {
    void enableNotifications(false);
  }, [enableNotifications]);

  return (
    <>
      <Outlet />
      {showNotificationsPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-zinc-900">Activar notificaciones</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Para recibir avisos de calendario y difusion, habilita notificaciones en este dispositivo.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={dismissNotificationsPrompt}
                disabled={isEnablingNotifications}
              >
                Ahora no
              </Button>
              <Button type="button" onClick={onEnableClick} disabled={isEnablingNotifications}>
                {isEnablingNotifications ? "Activando..." : "Activar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <TanStackRouterDevtools />
      {/*<ReactQueryDevtools />*/}
      <Toaster />
    </>
  );
}
