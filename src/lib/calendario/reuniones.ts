import type { Evento } from "../../api/schemas/calendario";

export function obtenerIdSerieReunion(reunion: Pick<Evento, "serieId" | "id">): number | null {
  return reunion.serieId ?? reunion.id ?? null;
}

export function deduplicarSeriesReunion(eventos: Evento[]): Evento[] {
  const vistas = new Set<string>();

  return eventos.filter((evento) => {
    if (evento.naturaleza !== "REUNION" && evento.tipo !== "REUNION") {
      return false;
    }

    const serieId = obtenerIdSerieReunion(evento);
    const clave = serieId != null
      ? String(serieId)
      : `${evento.titulo}-${evento.grupoId ?? "sin-grupo"}-${evento.departamentoId ?? "sin-departamento"}`;

    if (vistas.has(clave)) {
      return false;
    }

    vistas.add(clave);
    return true;
  });
}