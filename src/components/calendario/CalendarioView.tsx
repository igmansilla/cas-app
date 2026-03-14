/**
 * CalendarioView Component
 * 
 * Wrapper de react-big-calendar con localización en español
 */

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { casColors } from "../../lib/colors";
import { obtenerColorEvento } from "./helpers";
import type { EventoCalendarioFormateado } from "../../api/schemas/calendario";

// Configurar localizador de date-fns
const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarioViewProps {
  events: EventoCalendarioFormateado[];
  loading: boolean;
  onSelectEvent: (event: EventoCalendarioFormateado) => void;
  view: View;
  date: Date;
  onView: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectSlot?: (slot: SlotInfo) => void;
}

export function CalendarioView({ 
  events, 
  loading, 
  onSelectEvent,
  view,
  date,
  onView,
  onNavigate,
  onSelectSlot,
}: CalendarioViewProps) {
  // Navegación
  const handleNavigate = useCallback((newDate: Date) => {
    onNavigate(newDate);
  }, [onNavigate]);

  const handleViewChange = useCallback((newView: View) => {
    onView(newView);
  }, [onView]);

  // Estilo personalizado para eventos
  const eventStyleGetter = useCallback((event: EventoCalendarioFormateado) => {
    const backgroundColor = obtenerColorEvento(event.tipo);
    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontWeight: "500",
        fontSize: "0.875rem",
      },
    };
  }, []);

  // Mensajes en español
  const messages = useMemo(
    () => ({
      allDay: "Todo el día",
      previous: "Anterior",
      next: "Siguiente",
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
      agenda: "Agenda",
      date: "Fecha",
      time: "Hora",
      event: "Evento",
      noEventsInRange: "No hay eventos en este rango",
      showMore: (total: number) => `+ Ver más (${total})`,
    }),
    []
  );

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg relative w-full max-w-6xl mx-auto">
      <style>{`
        .rbc-calendar {
          font-family: inherit;
          min-height: 600px;
        }

        .rbc-header {
          padding: 12px 6px;
          font-weight: 600;
          color: ${casColors.ui.text.primary};
          background-color: ${casColors.orange[50]};
          border-bottom: 2px solid ${casColors.orange[200]};
        }

        .rbc-today {
          background-color: ${casColors.orange[50]};
        }

        .rbc-off-range-bg {
          background-color: ${casColors.ui.background};
        }

        .rbc-toolbar {
          padding: 16px 0;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .rbc-toolbar button {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid ${casColors.ui.border};
          background-color: white;
          color: ${casColors.ui.text.primary};
          font-weight: 500;
          transition: all 0.2s;
        }

        .rbc-toolbar button:hover {
          background-color: ${casColors.orange[50]};
          border-color: ${casColors.orange[300]};
        }

        .rbc-toolbar button.rbc-active {
          background-color: ${casColors.primary.orange};
          color: white;
          border-color: ${casColors.primary.orange};
        }

        .rbc-toolbar button.rbc-active:hover {
          background-color: #e55a2b;
        }

        .rbc-month-view {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid ${casColors.ui.border};
        }

        .rbc-event {
          padding: 4px 6px;
          border-radius: 6px;
        }

        .rbc-event-label {
          font-size: 0.75rem;
        }

        .rbc-show-more {
          background-color: ${casColors.primary.orange};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 0.75rem;
        }

        .rbc-agenda-view {
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-agenda-table {
          border: 1px solid ${casColors.ui.border};
        }

        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          padding: 12px;
          font-weight: 500;
        }

        .rbc-agenda-event-cell {
          padding: 12px;
        }

        .rbc-current-time-indicator {
          background-color: ${casColors.primary.red};
          height: 2px;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events as any}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        onSelectEvent={(e) => onSelectEvent(e as EventoCalendarioFormateado)}
        onSelectSlot={onSelectSlot}
        eventPropGetter={eventStyleGetter as any}
        messages={messages}
        culture="es"
        popup
        selectable={Boolean(onSelectSlot)}
      />
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
        </div>
      )}
    </div>
  );
}
