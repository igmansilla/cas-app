/**
 * CalendarioView Component
 * 
 * Wrapper de react-big-calendar con localización en español
 */

import { useCallback, useMemo, useRef, type TouchEvent } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { es } from "date-fns/locale/es";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

type NavigateAction = "PREV" | "NEXT" | "TODAY" | "DATE";

interface ToolbarProps {
  label: string;
  view: View;
  views: string[];
  onNavigate: (navigate: NavigateAction) => void;
  onView: (view: View) => void;
}

function capitalizeLabel(label: string) {
  if (!label) {
    return label;
  }

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function MobileFriendlyToolbar({ label, view, views, onNavigate, onView }: ToolbarProps) {
  const allowedViews = views.filter((candidate): candidate is View => {
    return candidate === "month" || candidate === "week" || candidate === "day" || candidate === "agenda";
  });

  return (
    <div className="rbc-toolbar cas-toolbar">
      <div className="cas-toolbar-top-row">
        <button
          type="button"
          className="cas-nav-button"
          onClick={() => onNavigate("PREV")}
          aria-label="Período anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="rbc-toolbar-label cas-toolbar-label">{capitalizeLabel(label)}</span>

        <button
          type="button"
          className="cas-nav-button"
          onClick={() => onNavigate("NEXT")}
          aria-label="Período siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="cas-toolbar-bottom-row">
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className="cas-today-button"
        >
          Hoy
        </button>

        <div className="cas-view-switcher" role="tablist" aria-label="Cambiar vista">
          {allowedViews.map((toolbarView) => {
            const isActive = view === toolbarView;
            const labelByView: Record<View, string> = {
              month: "Mes",
              week: "Semana",
              work_week: "Lab.",
              day: "Día",
              agenda: "Agenda",
            };

            return (
              <button
                key={toolbarView}
                type="button"
                onClick={() => onView(toolbarView)}
                className={`cas-view-button ${isActive ? "is-active" : ""}`}
                role="tab"
                aria-selected={isActive}
              >
                {labelByView[toolbarView]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CalendarioViewProps {
  events: EventoCalendarioFormateado[];
  loading: boolean;
  onSelectEvent: (event: EventoCalendarioFormateado) => void;
  view: View;
  date: Date;
  onView: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectSlot?: (slot: SlotInfo) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  selectedDate?: Date | null;
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
  onSwipeLeft,
  onSwipeRight,
  selectedDate,
}: CalendarioViewProps) {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 48;

  // Navegación
  const handleNavigate = useCallback((newDate: Date) => {
    onNavigate(newDate);
  }, [onNavigate]);

  const handleViewChange = useCallback((newView: View) => {
    onView(newView);
  }, [onView]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!onSwipeLeft && !onSwipeRight) {
      return;
    }

    const touch = event.changedTouches[0];
    const touchStartX = touchStartXRef.current;
    const touchStartY = touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

    if (!isHorizontalSwipe) {
      return;
    }

    if (deltaX < 0) {
      onSwipeLeft?.();
      return;
    }

    onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight]);

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

  const dayPropGetter = useCallback((day: Date) => {
    if (!selectedDate) {
      return {};
    }

    const isSameDay =
      day.getFullYear() === selectedDate.getFullYear()
      && day.getMonth() === selectedDate.getMonth()
      && day.getDate() === selectedDate.getDate();

    if (!isSameDay) {
      return {};
    }

    return {
      style: {
        backgroundColor: "#FFF1E8",
      },
    };
  }, [selectedDate]);

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
    <div
      className="relative h-full w-full touch-pan-y bg-white md:rounded-2xl md:p-6 md:shadow-lg md:max-w-6xl md:mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .rbc-calendar {
          font-family: inherit;
          height: 100%;
        }

        @media (max-width: 767px) {
          .rbc-calendar {
            min-height: 100%;
          }
        }

        @media (min-width: 768px) {
          .rbc-calendar {
            min-height: 600px;
          }
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

        .cas-toolbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 14px;
          padding: 6px 0 10px;
        }

        .cas-toolbar-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cas-toolbar-label {
          margin: 0;
          text-align: center;
          font-size: 1.35rem;
          font-weight: 700;
          color: ${casColors.ui.text.primary};
          letter-spacing: -0.01em;
        }

        .cas-nav-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${casColors.orange[200]};
          background-color: ${casColors.orange[50]};
          color: ${casColors.primary.orange};
          border-radius: 9999px;
          width: 36px;
          height: 36px;
        }

        .cas-toolbar-bottom-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cas-today-button {
          border: 1px solid ${casColors.orange[300]};
          color: ${casColors.primary.orange};
          background-color: #fff;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          line-height: 1;
          padding: 8px 14px;
          white-space: nowrap;
        }

        .cas-view-switcher {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .cas-view-switcher::-webkit-scrollbar {
          display: none;
        }

        .cas-view-button {
          border: 1px solid ${casColors.ui.border};
          color: ${casColors.ui.text.secondary};
          background-color: #fff;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
          padding: 8px 12px;
        }

        .cas-view-button.is-active {
          border-color: ${casColors.primary.orange};
          color: #fff;
          background-color: ${casColors.primary.orange};
        }

        @media (min-width: 768px) {
          .cas-toolbar {
            gap: 10px;
          }

          .cas-toolbar-top-row {
            justify-content: center;
            gap: 14px;
          }

          .cas-toolbar-label {
            font-size: 1.15rem;
          }

          .cas-toolbar-bottom-row {
            justify-content: center;
          }

          .cas-view-switcher {
            flex: 0;
            overflow: visible;
          }
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
        style={{ height: "100%" }}
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        onSelectEvent={(e) => onSelectEvent(e as EventoCalendarioFormateado)}
        onSelectSlot={onSelectSlot}
        eventPropGetter={eventStyleGetter as any}
        dayPropGetter={dayPropGetter}
        components={{ toolbar: MobileFriendlyToolbar as any }}
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
