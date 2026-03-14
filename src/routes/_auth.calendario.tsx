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
import { toast } from "sonner";

import { 
  useEventos, 
} from "../hooks/useCalendario";
import { useFeriados } from "../hooks/useFeriados";
import { calendarioStore, calendarioAcciones } from "../stores/calendario.store";

import {
  CalendarioHeader,
  CalendarioView,
  EventoDetalleModal,
} from "../components/calendario";

export const Route = createFileRoute("/_auth/calendario")({
  component: CalendarioPage,
});

function CalendarioPage() {
  // TanStack Store hooks
  const eventoSeleccionado = useStore(calendarioStore, (state) => state.eventoSeleccionado);
  const modalDetalleAbierto = useStore(calendarioStore, (state) => state.modalDetalleAbierto);

  // Estado local para la vista del calendario
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

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

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-orange-50 to-red-50 pb-6 md:pb-8">
      <div className="container mx-auto px-3 py-3 md:px-4 md:py-8">
        
        <CalendarioHeader 
          diasRestantes={diasRestantes} 
          error={error}
        />

        <main className="max-w-7xl mx-auto">
          <CalendarioView 
            events={eventosConFeriados} 
            loading={cargando} 
            onSelectEvent={calendarioAcciones.abrirModalDetalle}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
          />
        </main>
      </div>

      <EventoDetalleModal
        eventoSeleccionado={eventoSeleccionado}
        abierto={modalDetalleAbierto}
        onCerrar={calendarioAcciones.cerrarModalDetalle}
        onEditar={() => toast.info("La edición se hace desde Eventos o Reuniones")}
        onEliminar={() => toast.info("La eliminación se hace desde Eventos o Reuniones")}
        eliminando={false}
        puedeEditar={false}
      />
    </div>
  );
}
