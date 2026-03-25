/**
 * Calendario Route
 * 
 * Página del calendario de actividades
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import type { View } from "react-big-calendar";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";
import { endOfWeek } from "date-fns/endOfWeek";
import { startOfDay } from "date-fns/startOfDay";
import { endOfDay } from "date-fns/endOfDay";
import { addDays } from "date-fns/addDays";
import { addMonths } from "date-fns/addMonths";
import { subMonths } from "date-fns/subMonths";
import { addWeeks } from "date-fns/addWeeks";
import { subWeeks } from "date-fns/subWeeks";
import { subDays } from "date-fns/subDays";
import { toast } from "sonner";

import { 
  useActualizarEvento,
  useCrearEvento,
  useEliminarEvento,
  useEventos, 
  useTransicionarEstadoEvento,
  useTiposEvento,
} from "../hooks/useCalendario";
import { useAuth } from "../hooks/useAuth";
import { useFeriados } from "../hooks/useFeriados";
import { calendarioStore, calendarioAcciones } from "../stores/calendario.store";
import type { EventoRequest } from "../api/schemas/calendario";

import {
  CalendarioHeader,
  CalendarioQuickActionsFab,
  CalendarioView,
  EventoDetalleModal,
} from "../components/calendario";
import { WizardEvento } from "../components/calendario/wizard/WizardEvento";

type EstadoDestinoEvento = "PLANIFICADO" | "ESTABLECIDO" | "DIFUNDIDO";

export const Route = createFileRoute("/_auth/calendario")({
  component: CalendarioPage,
});

function CalendarioPage() {
  const { hasRole } = useAuth();
  const puedeGestionarCalendario = hasRole("DIRIGENTE") || hasRole("ADMIN");

  // TanStack Store hooks
  const eventoSeleccionado = useStore(calendarioStore, (state) => state.eventoSeleccionado);
  const modalDetalleAbierto = useStore(calendarioStore, (state) => state.modalDetalleAbierto);

  // Estado local para la vista del calendario
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [wizardAbierto, setWizardAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Partial<EventoRequest>>({});
  const [idEventoEditando, setIdEventoEditando] = useState<number | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);

  // Calcular rango de fechas para fetching
  const { desde, hasta } = useMemo(() => {
    let start = date;
    let end = date;

    switch (view) {
      case "month":
        start = startOfWeek(startOfMonth(date));
        end = endOfWeek(endOfMonth(date));
        break;
      case "week":
        start = startOfWeek(date);
        end = endOfWeek(date);
        break;
      case "day":
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      case "agenda":
        start = startOfDay(date);
        end = addDays(start, 30);
        break;
    }
    return { desde: start, hasta: end };
  }, [view, date]);

  // Hooks de la API (TanStack Query) - Fetching basado en rango
  const { eventosCalendario, cargando, error } = useEventos({ desde, hasta });
  const { tipos: tiposEvento } = useTiposEvento();
  const { crearEvento, cargando: creando } = useCrearEvento();
  const { actualizarEvento, cargando: actualizando } = useActualizarEvento();
  const { eliminarEvento, cargando: eliminando } = useEliminarEvento();
  const { transicionarEstadoEvento, cargando: cargandoTransicionEstado } = useTransicionarEstadoEvento();
  const anioActual = new Date().getFullYear();
  const { data: feriados } = useFeriados(anioActual);

  const eventosConFeriados = useMemo(() => {
    return [...(eventosCalendario || []), ...(feriados || [])];
  }, [eventosCalendario, feriados]);

  // Calcular días restantes hasta el campamento
  const fechaInicioCampamento = new Date(2025, 11, 15);
  const hoy = new Date();
  const diasRestantes = Math.ceil(
    (fechaInicioCampamento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  const toDateInput = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toTimeInput = (value: Date) => {
    const hour = String(value.getHours()).padStart(2, "0");
    const minute = String(value.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  const toDayOfWeek = (value: Date) => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return days[value.getDay()] ?? "SATURDAY";
  };

  const toDateTimeInput = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hour = String(value.getHours()).padStart(2, "0");
    const minute = String(value.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const extractEventoId = () => {
    if (!eventoSeleccionado) {
      return null;
    }

    if (typeof eventoSeleccionado.realId === "number" && Number.isFinite(eventoSeleccionado.realId)) {
      return eventoSeleccionado.realId;
    }

    const parsed = Number.parseInt(eventoSeleccionado.id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const cerrarWizard = () => {
    setWizardAbierto(false);
    setIdEventoEditando(null);
  };

  const normalizarRangoEventoRapido = (start: Date, end: Date) => {
    if (view === "month") {
      const inicio = new Date(start);
      inicio.setHours(10, 0, 0, 0);

      const fin = new Date(inicio);
      fin.setHours(11, 0, 0, 0);

      return { inicio, fin };
    }

    const inicio = new Date(start);
    const fin = end > start ? end : new Date(start.getTime() + 60 * 60 * 1000);
    return { inicio, fin };
  };

  const abrirEventoRapidoDesdeCalendario = (start: Date, end: Date) => {
    const { inicio, fin } = normalizarRangoEventoRapido(start, end);
    setFechaSeleccionada(inicio);

    setEventoEditando({
      naturaleza: "EVENTO",
      tipo: "ACTIVIDAD",
      titulo: "",
      descripcion: "",
      fechaInicio: toDateTimeInput(inicio),
      fechaFin: toDateTimeInput(fin),
      ubicacion: "",
      publicoObjetivo: "comunidad",
      politicaNotificacion: "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  const abrirReunionRapidaDesdeCalendario = (start: Date, end: Date) => {
    const fin = end > start ? end : new Date(start.getTime() + 60 * 60 * 1000);
    const fechaFin = new Date(start);
    fechaFin.setDate(fechaFin.getDate() + 1);
    setFechaSeleccionada(start);

    setEventoEditando({
      naturaleza: "REUNION",
      tipo: "REUNION",
      titulo: "Oasis particular",
      descripcion: "",
      fechaInicio: toDateInput(start),
      fechaFin: toDateInput(fechaFin),
      periodicidad: "PUNTUAL",
      diaSemana: toDayOfWeek(start),
      horaInicio: toTimeInput(start),
      horaFin: toTimeInput(fin),
      publicoObjetivo: "grupo-y-padres",
      politicaNotificacion: "automatica-al-difundir",
    });
    setIdEventoEditando(null);
    setModoEdicion(false);
    setWizardAbierto(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!puedeGestionarCalendario) {
      return;
    }

    abrirEventoRapidoDesdeCalendario(start, end);
    toast.info("Completá los datos para crear el evento");
  };

  const handleSwipeNavigate = (direction: "left" | "right") => {
    const nextDate = direction === "left"
      ? view === "month"
        ? addMonths(date, 1)
        : view === "week"
          ? addWeeks(date, 1)
          : view === "day"
            ? addDays(date, 1)
            : addDays(date, 30)
      : view === "month"
        ? subMonths(date, 1)
        : view === "week"
          ? subWeeks(date, 1)
          : view === "day"
            ? subDays(date, 1)
            : addDays(date, -30);

    setDate(nextDate);
  };

  const getQuickRangeFromCurrentDate = () => {
    const now = new Date();
    const base = new Date(date);

    if (view === "month") {
      base.setHours(10, 0, 0, 0);
    } else {
      base.setHours(now.getHours(), 0, 0, 0);
    }

    const end = new Date(base.getTime() + 60 * 60 * 1000);
    return { start: base, end };
  };

  const handleQuickCreateEvent = () => {
    if (!puedeGestionarCalendario) {
      return;
    }

    const { start, end } = getQuickRangeFromCurrentDate();
    abrirEventoRapidoDesdeCalendario(start, end);
  };

  const handleQuickCreateMeeting = () => {
    if (!puedeGestionarCalendario) {
      return;
    }

    const { start, end } = getQuickRangeFromCurrentDate();
    abrirReunionRapidaDesdeCalendario(start, end);
    toast.info("Completá grupo y lugar para crear un oasis particular");
  };

  const handleGoToday = () => {
    const hoy = new Date();
    setDate(hoy);
    setFechaSeleccionada(hoy);
    toast.success("Mostrando la fecha de hoy");
  };

  const handleGuardar = async (data: EventoRequest) => {
    try {
      if (modoEdicion && idEventoEditando) {
        await actualizarEvento(idEventoEditando, data);
        toast.success("Evento actualizado desde calendario");
      } else {
        await crearEvento(data);
        toast.success("Oasis particular creado");
      }
      cerrarWizard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el evento");
    }
  };

  const handleEditarDesdeDetalle = () => {
    if (!eventoSeleccionado) {
      return;
    }

    if (eventoSeleccionado.esVirtual) {
      toast.info("Las instancias virtuales se editan desde su serie");
      return;
    }

    const eventoId = extractEventoId();
    if (!eventoId) {
      toast.error("No se pudo identificar el evento para editar");
      return;
    }

    const esReunion = eventoSeleccionado.naturaleza === "REUNION"
      || eventoSeleccionado.tipo.toUpperCase() === "REUNION";

    const inicio = eventoSeleccionado.start;
    const fin = eventoSeleccionado.end;
    const fechaFinReunion = new Date(inicio);
    fechaFinReunion.setDate(fechaFinReunion.getDate() + 1);

    setEventoEditando({
      titulo: eventoSeleccionado.title,
      descripcion: eventoSeleccionado.descripcion,
      naturaleza: esReunion ? "REUNION" : "EVENTO",
      tipo: esReunion ? "REUNION" : eventoSeleccionado.tipo,
      fechaInicio: esReunion ? toDateInput(inicio) : inicio.toISOString().slice(0, 16),
      fechaFin: esReunion
        ? toDateInput(fin > inicio ? fin : fechaFinReunion)
        : fin.toISOString().slice(0, 16),
      ubicacion: eventoSeleccionado.ubicacion ?? "",
      latitud: eventoSeleccionado.latitud ?? undefined,
      longitud: eventoSeleccionado.longitud ?? undefined,
      urlMapa: eventoSeleccionado.urlMapa ?? "",
      periodicidad: eventoSeleccionado.periodicidad ?? "PUNTUAL",
      diaSemana: eventoSeleccionado.diaSemana ?? toDayOfWeek(inicio),
      horaInicio: eventoSeleccionado.horaInicio ?? toTimeInput(inicio),
      horaFin: eventoSeleccionado.horaFin ?? toTimeInput(fin),
      grupoId: eventoSeleccionado.grupoId ?? "",
      departamentoId: eventoSeleccionado.departamentoId ?? undefined,
      plantillaAnualId: eventoSeleccionado.plantillaAnualId ?? undefined,
      publicoObjetivo: eventoSeleccionado.publicoObjetivo ?? "comunidad",
      politicaNotificacion: eventoSeleccionado.politicaNotificacion ?? "automatica-al-difundir",
      enlaceVideollamada: eventoSeleccionado.enlaceVideollamada ?? "",
    });

    setIdEventoEditando(eventoId);
    setModoEdicion(true);
    setWizardAbierto(true);
  };

  const handleEliminarDesdeDetalle = async () => {
    if (!eventoSeleccionado) {
      return;
    }

    if (eventoSeleccionado.esVirtual) {
      toast.info("Las instancias virtuales se eliminan desde su serie");
      return;
    }

    const eventoId = extractEventoId();
    if (!eventoId) {
      toast.error("No se pudo identificar el evento para eliminar");
      return;
    }

    if (!confirm(`¿Eliminar \"${eventoSeleccionado.title}\"?`)) {
      return;
    }

    try {
      await eliminarEvento(eventoId);
      toast.success("Evento eliminado");
      calendarioAcciones.cerrarModalDetalle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el evento");
    }
  };

  const handleTransicionDesdeDetalle = async (estadoDestino: EstadoDestinoEvento) => {
    if (!eventoSeleccionado) {
      return;
    }

    if (eventoSeleccionado.esVirtual) {
      toast.info("Las instancias virtuales se gestionan desde su serie");
      return;
    }

    const eventoId = extractEventoId();
    if (!eventoId) {
      toast.error("No se pudo identificar el evento para cambiar su estado");
      return;
    }

    try {
      await transicionarEstadoEvento(eventoId, estadoDestino);

      const mensaje =
        estadoDestino === "ESTABLECIDO"
          ? "Evento marcado como listo"
          : estadoDestino === "DIFUNDIDO"
            ? "Evento difundido"
            : "Evento vuelto a programado";

      toast.success(mensaje);
      calendarioAcciones.cerrarModalDetalle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado del evento");
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-orange-50 to-red-50 md:pb-8">
      {/* Header: oculto en mobile para ganar espacio */}
      <div className="hidden md:block container mx-auto px-4 pt-8">
        <CalendarioHeader 
          diasRestantes={diasRestantes} 
          error={error}
        />
      </div>

      {/* Error en mobile: solo si hay error */}
      {error && (
        <div className="md:hidden mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium text-sm">Error al cargar eventos</p>
          <p className="text-xs">{error.message}</p>
        </div>
      )}

      {/* Calendario: sin padding en mobile para máximo espacio */}
      <div className="h-[calc(100svh-6rem)] md:h-auto md:container md:mx-auto md:px-4 md:pb-8">
        <main className="h-full md:h-auto md:max-w-7xl md:mx-auto">
          <CalendarioView 
            events={eventosConFeriados} 
            loading={cargando} 
            onSelectEvent={calendarioAcciones.abrirModalDetalle}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectSlot={puedeGestionarCalendario ? handleSelectSlot : undefined}
            onSwipeLeft={() => handleSwipeNavigate("left")}
            onSwipeRight={() => handleSwipeNavigate("right")}
            selectedDate={fechaSeleccionada}
          />
        </main>
      </div>

      {puedeGestionarCalendario && (
        <CalendarioQuickActionsFab
          onQuickEvent={handleQuickCreateEvent}
          onQuickMeeting={handleQuickCreateMeeting}
          onGoToday={handleGoToday}
        />
      )}

      <EventoDetalleModal
        eventoSeleccionado={eventoSeleccionado}
        abierto={modalDetalleAbierto}
        onCerrar={calendarioAcciones.cerrarModalDetalle}
        onEditar={handleEditarDesdeDetalle}
        onEliminar={handleEliminarDesdeDetalle}
        onTransicionarEstado={handleTransicionDesdeDetalle}
        eliminando={eliminando}
        transicionandoEstado={cargandoTransicionEstado}
        puedeEditar={puedeGestionarCalendario}
      />

      <WizardEvento
        abierto={wizardAbierto}
        modoEdicion={modoEdicion}
        cargando={creando || actualizando}
        valoresIniciales={eventoEditando}
        tiposEvento={tiposEvento || []}
        contextoPlanificacion="GENERAL"
        onCerrar={cerrarWizard}
        onGuardar={handleGuardar}
      />
    </div>
  );
}
