import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

import type { Evento, EventoRequest, PlantillaEventoAnual } from "../../../api/schemas/calendario";
import {
  useActualizarEvento,
  useCrearEvento,
  useEliminarEvento,
  useEventos,
  usePlanificacionAnual,
  useSeriesReunion,
  useTiposEvento,
  useTransicionarEstadoEvento,
} from "../../../hooks/useCalendario";
import { useAuth } from "../../../hooks/useAuth";
import { useDepartamentos } from "../../../hooks/useDepartamentos";
import { obtenerIdSerieReunion } from "../../../lib/calendario/reuniones";
import { ReunionSerieCard } from "../reuniones/ReunionSerieCard";
import { EventosPlanningPanel } from "../eventos/EventosPlanningPanel";
import { WizardEvento } from "../wizard/WizardEvento";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { departmentScreenByCode, type DepartamentoOperativoCodigo } from "./departamentoScreens";

type EstadoDestinoEvento = "PLANIFICADO" | "ESTABLECIDO" | "DIFUNDIDO";

interface DepartamentoPlanningPageProps {
  departamentoCodigo: DepartamentoOperativoCodigo;
  embedded?: boolean;
}

export function DepartamentoPlanningPage({
  departamentoCodigo,
  embedded = false,
}: DepartamentoPlanningPageProps) {
  const screen = departmentScreenByCode[departamentoCodigo];
  const { hasRole } = useAuth();
  const puedeEditar = hasRole("DIRIGENTE") || hasRole("ADMIN");

  const anioActual = new Date().getFullYear();
  const desde = new Date(anioActual, 0, 1);
  const hasta = new Date(anioActual, 11, 31, 23, 59, 59);

  const { departamentos, cargando: cargandoDepartamentos } = useDepartamentos();
  const { eventos, cargando: cargandoEventos } = useEventos({ desde, hasta });
  const { reuniones, cargando: cargandoReuniones } = useSeriesReunion({ desde, hasta });
  const { plantillas, cargando: cargandoPlanificacion } = usePlanificacionAnual(anioActual);
  const { tipos: tiposEvento } = useTiposEvento();
  const { crearEvento, cargando: creando } = useCrearEvento();
  const { actualizarEvento, cargando: actualizando } = useActualizarEvento();
  const { eliminarEvento } = useEliminarEvento();
  const { transicionarEstadoEvento, cargando: cargandoTransicionEstado } = useTransicionarEstadoEvento();

  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Partial<EventoRequest>>({});
  const [idEventoEditando, setIdEventoEditando] = useState<number | null>(null);

  const departamento = useMemo(
    () => departamentos.find((item) => item.codigo === departamentoCodigo),
    [departamentoCodigo, departamentos]
  );

  const eventosDepartamento = useMemo(() => {
    if (!departamento) {
      return [];
    }

    return eventos.filter((evento) => evento.departamentoId === departamento.id);
  }, [departamento, eventos]);

  const reunionesDepartamento = useMemo(() => {
    if (!departamento) {
      return [];
    }

    return reuniones.filter(
      (reunion) => reunion.departamentoId === departamento.id && !reunion.grupoId
    );
  }, [departamento, reuniones]);

  const cargandoPagina = cargandoDepartamentos || cargandoEventos || cargandoPlanificacion || cargandoReuniones;

  const cerrarWizard = () => {
    setWizardAbierto(false);
    setIdEventoEditando(null);
  };

  const handleGuardar = async (data: EventoRequest) => {
    const esReunion = data.naturaleza === "REUNION" || data.tipo === "REUNION";

    try {
      if (modoEdicion && idEventoEditando) {
        await actualizarEvento(idEventoEditando, data);
        toast.success(esReunion ? "Reunión del departamento actualizada" : "Evento actualizado");
      } else {
        await crearEvento(data);
        toast.success(esReunion ? "Reunión del departamento programada" : data.plantillaAnualId ? "Evento anual programado" : "Evento del departamento creado");
      }

      cerrarWizard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la planificación");
    }
  };

  const handleEliminar = async (evento: Evento) => {
    const esReunion = evento.naturaleza === "REUNION" || evento.tipo === "REUNION";
    const eventoId = esReunion ? obtenerIdSerieReunion(evento) : evento.id ?? null;

    if (!eventoId || !confirm(`¿Eliminar \"${evento.titulo}\"?`)) {
      return;
    }

    try {
      await eliminarEvento(eventoId);
      toast.success(esReunion ? "Reunión eliminada" : "Evento eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    }
  };

  const handleTransicionEvento = async (evento: Evento, estadoDestino: EstadoDestinoEvento) => {
    if (evento.id == null) {
      toast.error("No se pudo identificar el evento para cambiar su estado");
      return;
    }

    try {
      await transicionarEstadoEvento(evento.id, estadoDestino);

      const mensaje =
        estadoDestino === "ESTABLECIDO"
          ? "Evento marcado como listo"
          : estadoDestino === "DIFUNDIDO"
            ? "Evento difundido"
            : "Evento vuelto a programado";

      toast.success(mensaje);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado del evento");
    }
  };

  const abrirEdicion = (evento: Evento) => {
    const esReunion = evento.naturaleza === "REUNION" || evento.tipo === "REUNION";
    const eventoId = esReunion ? obtenerIdSerieReunion(evento) : evento.id ?? null;

    setEventoEditando({
      titulo: evento.titulo,
      descripcion: evento.descripcion ?? "",
      naturaleza: esReunion ? "REUNION" : "EVENTO",
      tipo: esReunion ? "REUNION" : evento.tipo ?? "EVENTO",
      fechaInicio: evento.fechaInicio?.slice(0, esReunion ? 10 : 16) ?? "",
      fechaFin: evento.fechaFin?.slice(0, esReunion ? 10 : 16) ?? "",
      ubicacion: evento.ubicacion ?? "",
      latitud: evento.latitud ?? undefined,
      longitud: evento.longitud ?? undefined,
      urlMapa: evento.urlMapa ?? "",
      departamentoId: evento.departamentoId ?? departamento?.id ?? undefined,
      plantillaAnualId: evento.plantillaAnualId ?? undefined,
      periodicidad: evento.periodicidad ?? "SEMANAL",
      diaSemana: evento.diaSemana ?? "",
      horaInicio: evento.horaInicio ?? "15:00",
      horaFin: evento.horaFin ?? "17:00",
      publicoObjetivo: evento.publicoObjetivo ?? "comunidad",
      politicaNotificacion: evento.politicaNotificacion ?? "automatica-al-difundir",
      enlaceVideollamada: evento.enlaceVideollamada ?? "",
    });
    setIdEventoEditando(eventoId);
    setModoEdicion(true);
    setWizardAbierto(true);
  };

  const abrirCreacionEvento = () => {
    setEventoEditando({
      naturaleza: "EVENTO",
      departamentoId: departamento?.id,
      publicoObjetivo: "comunidad",
      politicaNotificacion: "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  const abrirCreacionReunion = () => {
    setEventoEditando({
      naturaleza: "REUNION",
      tipo: "REUNION",
      departamentoId: departamento?.id,
      publicoObjetivo: "dirigentes",
      politicaNotificacion: "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  const abrirProgramacion = (plantilla: PlantillaEventoAnual) => {
    setEventoEditando({
      naturaleza: "EVENTO",
      tipo: plantilla.codigo,
      titulo: plantilla.etiqueta,
      descripcion: plantilla.descripcion,
      departamentoId: plantilla.departamentoId,
      plantillaAnualId: plantilla.id,
      publicoObjetivo: plantilla.publicoObjetivo ?? "comunidad",
      politicaNotificacion: plantilla.politicaNotificacion ?? "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  const content = cargandoPagina ? (
    <div className="flex justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-500" />
    </div>
  ) : !departamento ? (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-10 text-center">
      <p className="text-base font-medium text-gray-800">No se encontró el departamento {screen.nombre}</p>
      <p className="mt-2 text-sm text-gray-500">Verificá que exista en la configuración inicial de departamentos.</p>
    </div>
  ) : (
    <div className="space-y-8">
      <EventosPlanningPanel
        departamentos={[departamento]}
        departamentoActivo={departamento.codigo}
        plantillas={plantillas.filter((plantilla) => plantilla.departamentoId === departamento.id)}
        eventos={eventosDepartamento}
        puedeEditar={puedeEditar}
        mostrarSelectorDepartamento={false}
        onCambiarDepartamento={() => undefined}
        onProgramarPlantilla={abrirProgramacion}
        onCrearAdHoc={abrirCreacionEvento}
        onEditarEvento={abrirEdicion}
        onEliminarEvento={handleEliminar}
        onTransicionarEvento={handleTransicionEvento}
        transicionando={cargandoTransicionEstado}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reuniones internas del departamento</h2>
            <p className="text-sm text-gray-600">
              Se usan para la coordinación del área. No toman asistencia y quedan separadas de las reuniones con grupos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="w-fit border-gray-300 text-gray-700">
              {reunionesDepartamento.length} series activas
            </Badge>
            {puedeEditar && (
              <Button onClick={abrirCreacionReunion} className="bg-slate-900 text-white hover:bg-slate-800">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Nueva reunión interna
              </Button>
            )}
          </div>
        </div>

        {reunionesDepartamento.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-10 text-center">
            <p className="text-base font-medium text-gray-800">Todavía no hay reuniones internas programadas</p>
            <p className="mt-2 text-sm text-gray-500">
              Crealas desde esta pantalla para separar la coordinación del departamento de las reuniones con grupos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reunionesDepartamento.map((reunion) => (
              <ReunionSerieCard
                key={obtenerIdSerieReunion(reunion) ?? `${reunion.titulo}-${reunion.fechaInicio}`}
                reunion={reunion}
                puedeEditar={puedeEditar}
                onEditar={abrirEdicion}
                onEliminar={handleEliminar}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  if (embedded) {
    return (
      <>
        {content}
        <WizardEvento
          abierto={wizardAbierto}
          modoEdicion={modoEdicion}
          cargando={creando || actualizando}
          valoresIniciales={eventoEditando}
          tiposEvento={tiposEvento || []}
          contextoPlanificacion="DEPARTAMENTO"
          bloquearDepartamento
          mostrarGrupoEnReunion={false}
          onCerrar={cerrarWizard}
          onGuardar={handleGuardar}
        />
      </>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 md:pb-8">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/departamentos">Departamentos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{screen.nombre}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {content}
      </div>

      <WizardEvento
        abierto={wizardAbierto}
        modoEdicion={modoEdicion}
        cargando={creando || actualizando}
        valoresIniciales={eventoEditando}
        tiposEvento={tiposEvento || []}
        contextoPlanificacion="DEPARTAMENTO"
        bloquearDepartamento
        mostrarGrupoEnReunion={false}
        onCerrar={cerrarWizard}
        onGuardar={handleGuardar}
      />
    </div>
  );
}