import { client } from "../client";

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
};
