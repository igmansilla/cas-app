import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock3, Users } from "lucide-react";

import {
  useSeriesReunion,
  useTiposEvento,
  useCrearEvento,
  useActualizarEvento,
  useEliminarEvento,
} from "../../hooks/useCalendario";
import { useAuth } from "../../hooks/useAuth";
import { useGruposAcampantes, useGruposDirigentes } from "../../hooks/useGrupos";
import type { Evento, EventoRequest } from "../../api/schemas/calendario";
import { obtenerIdSerieReunion } from "../../lib/calendario/reuniones";
import { ReunionSerieCard } from "../calendario/reuniones/ReunionSerieCard";
import { WizardEvento } from "../calendario/wizard/WizardEvento";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type GrupoDisponible = {
  id: string;
  nombre: string;
  tipo: "Acampantes" | "Dirigentes";
};

export function PlanificacionReunionesGruposPanel() {
  const { hasRole } = useAuth();
  const puedeEditar = hasRole("DIRIGENTE") || hasRole("ADMIN");

  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), 0, 1);
  const hasta = new Date(hoy.getFullYear(), 11, 31);

  const { reuniones, cargando } = useSeriesReunion({ desde, hasta });
  const { grupos: gruposAcampantes, cargando: cargandoAcampantes } = useGruposAcampantes();
  const { grupos: gruposDirigentes, cargando: cargandoDirigentes } = useGruposDirigentes();
  const { tipos: tiposEvento } = useTiposEvento();
  const { crearEvento, cargando: creando } = useCrearEvento();
  const { actualizarEvento, cargando: actualizando } = useActualizarEvento();
  const { eliminarEvento } = useEliminarEvento();

  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Partial<EventoRequest>>({});
  const [idEventoEditando, setIdEventoEditando] = useState<number | null>(null);

  const reunionesGrupo: Evento[] = useMemo(
    () =>
      reuniones.filter(
        (reunion) =>
          Boolean(reunion.grupoId)
          && (reunion.periodicidad || "").toUpperCase() !== "PUNTUAL"
      ),
    [reuniones]
  );

  const gruposDisponibles = useMemo<GrupoDisponible[]>(
    () =>
      [
        ...gruposAcampantes.map((grupo) => ({ ...grupo, tipo: "Acampantes" as const })),
        ...gruposDirigentes.map((grupo) => ({ ...grupo, tipo: "Dirigentes" as const })),
      ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })),
    [gruposAcampantes, gruposDirigentes]
  );

  const reunionesPorGrupo = useMemo(() => {
    const mapa = new Map<string, Evento>();
    reunionesGrupo.forEach((reunion) => {
      if (reunion.grupoId && !mapa.has(reunion.grupoId)) {
        mapa.set(reunion.grupoId, reunion);
      }
    });
    return mapa;
  }, [reunionesGrupo]);

  const gruposPendientes = useMemo(
    () => gruposDisponibles.filter((grupo) => !reunionesPorGrupo.has(grupo.id)),
    [gruposDisponibles, reunionesPorGrupo]
  );

  const gruposConHorario = gruposDisponibles.length - gruposPendientes.length;
  const cargandoGrupos = cargandoAcampantes || cargandoDirigentes;
  const cargandoPantalla = cargando || cargandoGrupos;

  const handleCrear = async (data: EventoRequest) => {
    try {
      await crearEvento({ ...data, naturaleza: "REUNION" } as EventoRequest);
      setWizardAbierto(false);
      toast.success("Reunión de grupo programada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la reunión");
    }
  };

  const handleEditar = async (data: EventoRequest) => {
    if (!idEventoEditando) return;

    try {
      await actualizarEvento(idEventoEditando, data as EventoRequest);
      setWizardAbierto(false);
      toast.success("Reunión actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const handleEliminar = async (evento: Evento) => {
    const reunionId = obtenerIdSerieReunion(evento);

    if (!reunionId) return;
    if (!confirm(`Eliminar la serie de "${evento.titulo}"?`)) return;

    try {
      await eliminarEvento(reunionId);
      toast.success("Reunión eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const abrirEdicion = (reunion: Evento) => {
    const reunionId = obtenerIdSerieReunion(reunion);

    setEventoEditando({
      titulo: reunion.titulo,
      descripcion: reunion.descripcion ?? "",
      naturaleza: "REUNION",
      tipo: "REUNION",
      fechaInicio: reunion.fechaInicio?.slice(0, 10) ?? "",
      fechaFin: reunion.fechaFin?.slice(0, 10) ?? "",
      ubicacion: reunion.ubicacion ?? "",
      latitud: reunion.latitud ?? undefined,
      longitud: reunion.longitud ?? undefined,
      urlMapa: reunion.urlMapa ?? "",
      periodicidad: reunion.periodicidad ?? "SEMANAL",
      diaSemana: reunion.diaSemana ?? "",
      horaInicio: reunion.horaInicio ?? "15:00",
      horaFin: reunion.horaFin ?? "17:00",
      grupoId: reunion.grupoId ?? "",
      departamentoId: reunion.departamentoId ?? undefined,
      plantillaAnualId: reunion.plantillaAnualId ?? undefined,
      publicoObjetivo: reunion.publicoObjetivo ?? "grupo-y-padres",
      politicaNotificacion: reunion.politicaNotificacion ?? "automatica-al-difundir",
      enlaceVideollamada: reunion.enlaceVideollamada ?? "",
    });
    setIdEventoEditando(reunionId);
    setModoEdicion(true);
    setWizardAbierto(true);
  };

  const abrirCreacionParaGrupo = (grupo: GrupoDisponible) => {
    setEventoEditando({
      naturaleza: "REUNION",
      tipo: "REUNION",
      grupoId: grupo.id,
      titulo: `Reunión ${grupo.nombre}`,
      publicoObjetivo: "grupo-y-padres",
      politicaNotificacion: "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
              <Users className="h-7 w-7 text-emerald-600" />
              Planificación de reuniones
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Organizá las reuniones anuales de cada grupo desde el mismo espacio donde administrás acampantes, jerarquías y asignaciones.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard label="Grupos cargados" value={gruposDisponibles.length} tone="slate" />
        <StatsCard label="Con horario" value={gruposConHorario} tone="emerald" />
        <StatsCard label="Pendientes" value={gruposPendientes.length} tone="amber" />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grupos pendientes de horario</h3>
            <p className="text-sm text-gray-600">
              Priorizá estos grupos: todavía no tienen una serie de reunión cargada para este año.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            {gruposPendientes.length} pendientes
          </Badge>
        </div>

        {cargandoPantalla ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : gruposPendientes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/70 p-10 text-center">
            <p className="text-base font-medium text-emerald-900">Todos los grupos cargados ya tienen horario</p>
            <p className="mt-2 text-sm text-emerald-700">
              Si necesitás reorganizar alguno, podés editar la serie desde la sección de reuniones activas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gruposPendientes.map((grupo) => (
              <article key={grupo.id} className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {grupo.tipo}
                    </Badge>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{grupo.nombre}</h4>
                      <p className="text-sm text-gray-500">Sin reunión semanal o quincenal programada.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                    <Clock3 className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                  <span>Falta asignar horario y frecuencia.</span>
                  {puedeEditar && (
                    <Button size="sm" onClick={() => abrirCreacionParaGrupo(grupo)} className="bg-emerald-600 text-white hover:bg-emerald-700">
                      Programar
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Series activas por grupo</h3>
            <p className="text-sm text-gray-600">
              Reuniones ya programadas con seguimiento de próximas ocurrencias y asistencia.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
            {reunionesGrupo.length} series
          </Badge>
        </div>

        {cargandoPantalla ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : reunionesGrupo.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Users className="mx-auto mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">Sin reuniones de grupo programadas</p>
            <p className="text-sm">
              {puedeEditar
                ? "Planificá las reuniones desde la sección de grupos pendientes."
                : "No hay reuniones de grupo programadas aún."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reunionesGrupo.map((reunion) => (
              <ReunionSerieCard
                key={obtenerIdSerieReunion(reunion) ?? `${reunion.titulo}-${reunion.grupoId}`}
                reunion={reunion}
                puedeEditar={puedeEditar}
                onEditar={abrirEdicion}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        )}
      </section>

      <WizardEvento
        abierto={wizardAbierto}
        modoEdicion={modoEdicion}
        cargando={creando || actualizando}
        valoresIniciales={eventoEditando}
        tiposEvento={tiposEvento || []}
        contextoPlanificacion="GRUPO"
        forzarUbicacionBulin
        bloquearGrupo={Boolean(eventoEditando.grupoId) && !modoEdicion}
        onCerrar={() => setWizardAbierto(false)}
        onGuardar={modoEdicion ? handleEditar : handleCrear}
      />
    </div>
  );
}

function StatsCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber";
}) {
  const classes = {
    slate: "border-slate-200 bg-slate-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}