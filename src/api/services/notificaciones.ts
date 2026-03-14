import { client } from "../client";

export type PreferenciasNotificacionUsuario = {
  usuarioId: string;
  eventosCalendarioHabilitado: boolean;
};

export const notificacionesService = {
  registrarTokenDispositivo: async (
    token: string,
    userId?: string | null,
    platform = "web",
  ): Promise<void> => {
    await client.post("/tokens-dispositivo", {
      token,
      userId: userId ?? undefined,
      platform,
    });
  },

  eliminarTokenDispositivo: async (token: string): Promise<void> => {
    await client.delete("/tokens-dispositivo", {
      data: { token },
    });
  },

  obtenerPreferenciasUsuario: async (): Promise<PreferenciasNotificacionUsuario> => {
    const response = await client.get("/notificaciones/preferencias");
    return response.data as PreferenciasNotificacionUsuario;
  },

  actualizarPreferenciasUsuario: async (
    payload: Pick<PreferenciasNotificacionUsuario, "eventosCalendarioHabilitado">,
  ): Promise<PreferenciasNotificacionUsuario> => {
    const response = await client.put("/notificaciones/preferencias", payload);
    return response.data as PreferenciasNotificacionUsuario;
  },
};
