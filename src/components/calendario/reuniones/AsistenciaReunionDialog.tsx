import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import { CheckCircle2, CircleSlash2, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

import type {
  ActualizarAsistenciaReunionRequest,
  EstadoAsistenciaReunion,
  ReunionInstancia,
} from "../../../api/schemas/calendario";
import { useAsistenciaReunion, useActualizarAsistenciaReunion } from "../../../hooks/useCalendario";
import { useMiembrosGrupo } from "../../../hooks/useGrupos";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

interface AsistenciaReunionDialogProps {
  abierto: boolean;
  instancia: ReunionInstancia | null;
  grupoId?: string | null;
  onCerrar: () => void;
}

interface ParticipanteEditable {
  usuarioUid: string;
  nombreMostrar: string;
  email?: string | null;
}

const ESTADOS: Array<{
  value: EstadoAsistenciaReunion;
  label: string;
  className: string;
  icon: typeof CheckCircle2;
}> = [
  {
    value: "PRESENTE",
    label: "Presente",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  {
    value: "AUSENTE",
    label: "Ausente",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: CircleSlash2,
  },
  {
    value: "JUSTIFICADO",
    label: "Justificado",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: ShieldAlert,
  },
];

export function AsistenciaReunionDialog({
  abierto,
  instancia,
  grupoId,
  onCerrar,
}: AsistenciaReunionDialogProps) {
  const instanciaId = instancia?.id ?? 0;
  const { miembros, cargando: cargandoMiembros } = useMiembrosGrupo(grupoId ?? "", abierto && !!grupoId);
  const { detalle, cargando: cargandoDetalle } = useAsistenciaReunion(instanciaId, abierto && Boolean(instancia));
  const { actualizarAsistencia, cargando: guardando } = useActualizarAsistenciaReunion();

  const [estados, setEstados] = useState<Record<string, EstadoAsistenciaReunion>>({});

  const asistentesGuardados = useMemo(() => {
    const mapa = new Map<string, { nombreMostrar?: string | null; email?: string | null; estado: EstadoAsistenciaReunion }>();
    detalle?.asistentes.forEach((asistente) => {
      mapa.set(asistente.usuarioUid, {
        nombreMostrar: asistente.nombreMostrar,
        email: asistente.email,
        estado: (asistente.estado as EstadoAsistenciaReunion) ?? "AUSENTE",
      });
    });
    return mapa;
  }, [detalle]);

  const participantes = useMemo<ParticipanteEditable[]>(() => {
    const mapa = new Map<string, ParticipanteEditable>();

    miembros.forEach((miembro) => {
      mapa.set(miembro.keycloakId, {
        usuarioUid: miembro.keycloakId,
        nombreMostrar: miembro.nombreMostrar || miembro.email,
        email: miembro.email,
      });
    });

    asistentesGuardados.forEach((asistente, usuarioUid) => {
      if (!mapa.has(usuarioUid)) {
        mapa.set(usuarioUid, {
          usuarioUid,
          nombreMostrar: asistente.nombreMostrar || asistente.email || usuarioUid,
          email: asistente.email,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombreMostrar.localeCompare(b.nombreMostrar, "es", { sensitivity: "base" })
    );
  }, [asistentesGuardados, miembros]);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const nextState: Record<string, EstadoAsistenciaReunion> = {};
    participantes.forEach((participante) => {
      nextState[participante.usuarioUid] = asistentesGuardados.get(participante.usuarioUid)?.estado ?? "AUSENTE";
    });
    setEstados(nextState);
  }, [abierto, asistentesGuardados, participantes]);

  const resumen = useMemo(() => {
    return Object.values(estados).reduce(
      (acc, estado) => {
        if (estado === "PRESENTE") acc.presentes += 1;
        if (estado === "AUSENTE") acc.ausentes += 1;
        if (estado === "JUSTIFICADO") acc.justificados += 1;
        acc.total += 1;
        return acc;
      },
      { presentes: 0, ausentes: 0, justificados: 0, total: 0 }
    );
  }, [estados]);

  const handleGuardar = async () => {
    if (!instancia) {
      return;
    }

    const payload: ActualizarAsistenciaReunionRequest = {
      asistentes: participantes.map((participante) => ({
        usuarioUid: participante.usuarioUid,
        nombreMostrar: participante.nombreMostrar,
        email: participante.email ?? undefined,
        estado: estados[participante.usuarioUid] ?? "AUSENTE",
      })),
    };

    try {
      await actualizarAsistencia(instancia.id, payload);
      toast.success("Asistencia guardada");
      onCerrar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la asistencia");
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Toma de asistencia
          </DialogTitle>
          <DialogDescription>
            {instancia
              ? `${instancia.titulo} · ${format(new Date(instancia.fechaInicio), "EEEE d 'de' MMMM · HH:mm", { locale: es })}`
              : "Marcá la asistencia de la reunión seleccionada."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Presentes: {resumen.presentes}</Badge>
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Ausentes: {resumen.ausentes}</Badge>
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Justificados: {resumen.justificados}</Badge>
          <Badge variant="outline">Total: {resumen.total}</Badge>
        </div>

        {cargandoMiembros || cargandoDetalle ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : participantes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
            No hay miembros cargados para este grupo todavía.
          </div>
        ) : (
          <ScrollArea className="h-[420px] rounded-2xl border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integrante</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="w-[320px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantes.map((participante) => (
                  <TableRow key={participante.usuarioUid}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{participante.nombreMostrar}</span>
                        <span className="text-xs text-gray-500">{participante.usuarioUid}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {participante.email || "Sin email"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {ESTADOS.map((estado) => {
                          const Icon = estado.icon;
                          const activo = estados[participante.usuarioUid] === estado.value;
                          return (
                            <Button
                              key={estado.value}
                              type="button"
                              variant="outline"
                              className={activo ? estado.className : ""}
                              onClick={() =>
                                setEstados((prev) => ({
                                  ...prev,
                                  [participante.usuarioUid]: estado.value,
                                }))
                              }
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {estado.label}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={guardando || participantes.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            {guardando ? "Guardando..." : "Guardar asistencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}