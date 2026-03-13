import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Building2,
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import type { Evento, PlantillaEventoAnual } from "../../../api/schemas/calendario";
import type { Departamento } from "../../../api/services/departamentos";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { obtenerColorEvento, obtenerIconoEvento } from "../helpers";
import {
  getEstadoEventoBadge,
  getPoliticaNotificacionBadge,
  getPublicoObjetivoBadge,
} from "../../../lib/calendario/eventoMeta";
import { getEventoPlannerDefinition, supportsCustomPlanning } from "./plannerRegistry";

interface EventosPlanningPanelProps {
  departamentos: Departamento[];
  departamentoActivo: string;
  plantillas: PlantillaEventoAnual[];
  eventos: Evento[];
  puedeEditar: boolean;
  mostrarSelectorDepartamento?: boolean;
  onCambiarDepartamento: (codigo: string) => void;
  onProgramarPlantilla: (plantilla: PlantillaEventoAnual) => void;
  onCrearAdHoc: () => void;
  onEditarEvento: (evento: Evento) => void;
  onEliminarEvento: (evento: Evento) => void;
}

const FILTRO_TODOS = "TODOS";

export function EventosPlanningPanel({
  departamentos,
  departamentoActivo,
  plantillas,
  eventos,
  puedeEditar,
  mostrarSelectorDepartamento = true,
  onCambiarDepartamento,
  onProgramarPlantilla,
  onCrearAdHoc,
  onEditarEvento,
  onEliminarEvento,
}: EventosPlanningPanelProps) {
  const plantillasEvento = useMemo(
    () => plantillas.filter((plantilla) => plantilla.naturaleza === "evento"),
    [plantillas]
  );

  const eventosPuntuales = useMemo(
    () => eventos.filter((evento) => evento.naturaleza !== "REUNION" && evento.tipo !== "REUNION"),
    [eventos]
  );

  const departamentosDisponibles = useMemo(() => {
    const activos = departamentos.filter((departamento) => departamento.activo);
    const items = activos.map((departamento) => ({
      codigo: departamento.codigo,
      nombre: departamento.nombre,
      id: departamento.id,
    }));

    if (!mostrarSelectorDepartamento) {
      return items;
    }

    return [{ codigo: FILTRO_TODOS, nombre: "Todos", id: 0 }, ...items];
  }, [departamentos, mostrarSelectorDepartamento]);

  const departamentoSeleccionado = departamentosDisponibles.find(
    (departamento) => departamento.codigo === departamentoActivo
  );

  const perteneceAlFiltro = (departamentoId?: number | null) => {
    if (departamentoActivo === FILTRO_TODOS) {
      return true;
    }

    return departamentoId === departamentoSeleccionado?.id;
  };

  const tarjetasPlanificacion = useMemo(() => {
    return plantillasEvento
      .filter((plantilla) => perteneceAlFiltro(plantilla.departamentoId))
      .map((plantilla) => {
        const eventoProgramado = eventosPuntuales.find(
          (evento) => evento.id === plantilla.eventoId || evento.plantillaAnualId === plantilla.id
        );

        return {
          plantilla,
          eventoProgramado,
          planner: getEventoPlannerDefinition(plantilla.codigo),
        };
      })
      .sort((a, b) => {
        const prioridad = (plantilla: PlantillaEventoAnual) => {
          if (plantilla.critico && !plantilla.programado) return 0;
          if (!plantilla.programado) return 1;
          return 2;
        };

        const diferenciaPrioridad = prioridad(a.plantilla) - prioridad(b.plantilla);
        if (diferenciaPrioridad !== 0) {
          return diferenciaPrioridad;
        }

        return a.plantilla.etiqueta.localeCompare(b.plantilla.etiqueta, "es");
      });
  }, [eventosPuntuales, plantillasEvento, departamentoActivo, departamentoSeleccionado]);

  const eventosAdicionales = useMemo(() => {
    return eventosPuntuales
      .filter((evento) => !evento.plantillaAnualId)
      .filter((evento) => perteneceAlFiltro(evento.departamentoId))
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  }, [eventosPuntuales, departamentoActivo, departamentoSeleccionado]);

  const pendientes = tarjetasPlanificacion.filter((tarjeta) => !tarjeta.plantilla.programado).length;
  const programados = tarjetasPlanificacion.length - pendientes;
  const criticosPendientes = tarjetasPlanificacion.filter(
    (tarjeta) => tarjeta.plantilla.critico && !tarjeta.plantilla.programado
  ).length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Planificación de eventos</h2>
            <p className="max-w-3xl text-sm text-gray-600">
              Acá ves los eventos anuales que cada departamento tiene que programar y los adicionales que van apareciendo durante el año.
            </p>
          </div>

          {puedeEditar && (
            <Button
              onClick={onCrearAdHoc}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear evento del departamento
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<CalendarClock className="h-4 w-4 text-amber-600" />}
            label="Pendientes"
            value={pendientes}
            accent="amber"
          />
          <StatsCard
            icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
            label="Críticos sin fecha"
            value={criticosPendientes}
            accent="red"
          />
          <StatsCard
            icon={<CalendarCheck2 className="h-4 w-4 text-emerald-600" />}
            label="Programados"
            value={programados}
            accent="emerald"
          />
          <StatsCard
            icon={<Building2 className="h-4 w-4 text-slate-600" />}
            label="Eventos adicionales"
            value={eventosAdicionales.length}
            accent="slate"
          />
        </div>

        {criticosPendientes > 0 && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            Hay {criticosPendientes} canónico{criticosPendientes === 1 ? "" : "s"} crítico{criticosPendientes === 1 ? "" : "s"} sin programar en este panel.
          </div>
        )}
      </div>

      {mostrarSelectorDepartamento && (
        <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Departamentos</p>
              <p className="text-sm text-gray-500">Filtrá la planificación y los eventos adicionales por área.</p>
            </div>
          </div>

          <Tabs value={departamentoActivo} onValueChange={onCambiarDepartamento}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-orange-50 p-2">
              {departamentosDisponibles.map((departamento) => (
                <TabsTrigger
                  key={departamento.codigo}
                  value={departamento.codigo}
                  className="h-9 flex-none rounded-xl px-4"
                >
                  {departamento.nombre}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="space-y-4">
        <SectionHeader
          title="Eventos a planificar"
          description="Canónicos y recurrentes del año. Desde acá se programan o se ajustan sin pasar por el calendario general."
        />

        {tarjetasPlanificacion.length === 0 ? (
          <EmptyState
            title="No hay eventos anuales para este filtro"
            description="Cuando un departamento tenga plantillas anuales, van a aparecer acá para programarlas."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tarjetasPlanificacion.map(({ plantilla, eventoProgramado, planner }) => (
              <PlantillaCard
                key={plantilla.id}
                plantilla={plantilla}
                eventoProgramado={eventoProgramado}
                helperText={planner.helperText}
                plannerCustom={supportsCustomPlanning(plantilla.codigo)}
                puedeEditar={puedeEditar}
                onProgramar={() => onProgramarPlantilla(plantilla)}
                onEditar={() => eventoProgramado && onEditarEvento(eventoProgramado)}
                onEliminar={() => eventoProgramado && onEliminarEvento(eventoProgramado)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <SectionHeader
          title="Eventos adicionales del departamento"
          description="Actividades que no vienen de una plantilla anual, pero que igualmente necesitan departamento y seguimiento."
        />

        {eventosAdicionales.length === 0 ? (
          <EmptyState
            title="No hay eventos adicionales para este filtro"
            description="Los eventos creados fuera de la planificación anual van a quedar agrupados acá."
          />
        ) : (
          <div className="space-y-3">
            {eventosAdicionales.map((evento) => (
              <EventoAdicionalCard
                key={evento.id}
                evento={evento}
                puedeEditar={puedeEditar}
                onEditar={() => onEditarEvento(evento)}
                onEliminar={() => onEliminarEvento(evento)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PlantillaCard({
  plantilla,
  eventoProgramado,
  helperText,
  plannerCustom,
  puedeEditar,
  onProgramar,
  onEditar,
  onEliminar,
}: {
  plantilla: PlantillaEventoAnual;
  eventoProgramado?: Evento;
  helperText?: string;
  plannerCustom: boolean;
  puedeEditar: boolean;
  onProgramar: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const color = obtenerColorEvento(plantilla.codigo);
  const icono = obtenerIconoEvento(plantilla.codigo);
  const criticaPendiente = plantilla.critico && !plantilla.programado;
  const estadoBadge = getEstadoEventoBadge(eventoProgramado?.estadoEvento);
  const publicoBadge = getPublicoObjetivoBadge(eventoProgramado?.publicoObjetivo ?? plantilla.publicoObjetivo);
  const politicaBadge = getPoliticaNotificacionBadge(
    eventoProgramado?.politicaNotificacion ?? plantilla.politicaNotificacion
  );

  return (
    <article
      className={
        criticaPendiente
          ? "rounded-3xl border border-red-200 bg-red-50/30 p-5 shadow-sm"
          : "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl"
            style={{ borderColor: `${color}40`, backgroundColor: `${color}12` }}
          >
            {icono}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{plantilla.etiqueta}</h3>
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                {plantilla.departamento}
              </Badge>
              {criticaPendiente && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Crítico</Badge>
              )}
              {plannerCustom && (
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                  Listo para planner custom
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{plantilla.descripcion}</p>
            {helperText && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
          </div>
        </div>

        {plantilla.programado ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Programado</Badge>
        ) : (
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Pendiente</Badge>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
        {eventoProgramado ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{eventoProgramado.titulo}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(eventoProgramado.fechaInicio), "d 'de' MMMM, HH:mm", { locale: es })}
                </p>
              </div>
              {eventoProgramado.ubicacion && (
                <span className="text-sm text-gray-500">{eventoProgramado.ubicacion}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={estadoBadge.className}>{estadoBadge.label}</Badge>
              <Badge className={publicoBadge.className}>{publicoBadge.label}</Badge>
              <Badge className={politicaBadge.className}>{politicaBadge.label}</Badge>
            </div>

            {puedeEditar && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onEditar}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar programación
                </Button>
                <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={onEliminar}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Todavía no tiene una fecha cargada. Programalo desde esta pantalla para dejar el canónico marcado en el año.
            </p>
            {puedeEditar && (
              <Button onClick={onProgramar} className="bg-orange-600 text-white hover:bg-orange-700">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Programar
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EventoAdicionalCard({
  evento,
  puedeEditar,
  onEditar,
  onEliminar,
}: {
  evento: Evento;
  puedeEditar: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const color = obtenerColorEvento(evento.tipo);
  const estadoBadge = getEstadoEventoBadge(evento.estadoEvento);
  const publicoBadge = getPublicoObjetivoBadge(evento.publicoObjetivo);
  const politicaBadge = getPoliticaNotificacionBadge(evento.politicaNotificacion);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl">{obtenerIconoEvento(evento.tipo)}</span>
            <h3 className="font-semibold text-gray-900">{evento.titulo}</h3>
            {evento.departamentoNombre && (
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                {evento.departamentoNombre}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={estadoBadge.className}>{estadoBadge.label}</Badge>
            <Badge className={publicoBadge.className}>{publicoBadge.label}</Badge>
            <Badge className={politicaBadge.className}>{politicaBadge.label}</Badge>
          </div>
          <p className="text-sm text-gray-600">{evento.descripcion || "Sin descripción"}</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span>{format(new Date(evento.fechaInicio), "d 'de' MMMM, HH:mm", { locale: es })}</span>
            {evento.ubicacion && <span>{evento.ubicacion}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          {puedeEditar && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEditar}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={onEliminar}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
      <p className="text-base font-medium text-gray-800">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: "amber" | "emerald" | "red" | "slate";
}) {
  const accentClass = {
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    slate: "bg-slate-50 border-slate-200",
  }[accent];

  return (
    <div className={`rounded-2xl border p-4 ${accentClass}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}