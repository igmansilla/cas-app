/**
 * EventoDetalleModal Component
 * 
 * Modal para mostrar detalles de un evento
 */

import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { obtenerColorEvento, obtenerIconoEvento } from "./helpers";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import type { EventoCalendarioFormateado } from "../../api/schemas/calendario";

interface EventoDetalleModalProps {
  eventoSeleccionado: EventoCalendarioFormateado | null;
  abierto: boolean;
  onCerrar: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
  puedeEditar?: boolean;
}

export function EventoDetalleModal({ 
  eventoSeleccionado, 
  abierto,
  onCerrar, 
  onEditar, 
  onEliminar, 
  eliminando,
  puedeEditar = false
}: EventoDetalleModalProps) {
  const diaLabel = (dia?: string) => {
    const map: Record<string, string> = {
      SATURDAY: "Sábado",
      SUNDAY: "Domingo",
      MONDAY: "Lunes",
      TUESDAY: "Martes",
      WEDNESDAY: "Miércoles",
      THURSDAY: "Jueves",
      FRIDAY: "Viernes",
    };
    return dia ? map[dia] || dia : "";
  };
  
  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {eventoSeleccionado && obtenerIconoEvento(eventoSeleccionado.tipo)}
            </span>
            <DialogTitle className="text-2xl font-bold">
               {eventoSeleccionado?.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            Información detallada del evento seleccionado.
          </DialogDescription>
        </DialogHeader>

        {eventoSeleccionado && (
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none text-muted-foreground">Descripción</h4>
              <p className="text-sm text-foreground">{eventoSeleccionado.descripcion || "Sin descripción"}</p>
            </div>

            {(eventoSeleccionado.departamentoNombre || eventoSeleccionado.grupoNombre) && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none text-muted-foreground">Asignación</h4>
                {eventoSeleccionado.departamentoNombre && (
                  <p className="text-sm text-foreground">🏳️‍⚑ {eventoSeleccionado.departamentoNombre}</p>
                )}
                {eventoSeleccionado.grupoNombre && (
                  <p className="text-sm text-foreground">👥 {eventoSeleccionado.grupoNombre}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none text-muted-foreground">Fecha y hora</h4>
              <p className="text-sm text-foreground">
                📅 {format(eventoSeleccionado.start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-foreground">
                🕐 {format(eventoSeleccionado.start, "HH:mm", { locale: es })} -{" "}
                {format(eventoSeleccionado.end, "HH:mm", { locale: es })}
              </p>
            </div>

            {eventoSeleccionado.ubicacion && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none text-muted-foreground">Ubicación</h4>
                <p className="text-sm text-foreground">📍 {eventoSeleccionado.ubicacion}</p>
              </div>
            )}

            {eventoSeleccionado.naturaleza === 'REUNION' && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-2">
                <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider">Reunión Periódica</h4>
                <div className="space-y-1">
                  <p className="text-sm text-orange-800 flex items-center gap-2">
                    🔄 <span>
                      {eventoSeleccionado.periodicidad === 'SEMANAL' ? 'Semanal' : 
                       eventoSeleccionado.periodicidad === 'QUINCENAL' ? 'Quincenal' : 'Mensual'}
                    </span>
                  </p>
                  {eventoSeleccionado.diaSemana && (
                    <p className="text-sm text-orange-800">📅 {diaLabel(eventoSeleccionado.diaSemana)}</p>
                  )}
                  {(eventoSeleccionado.horaInicio || eventoSeleccionado.horaFin) && (
                    <p className="text-sm text-orange-800">🕒 {eventoSeleccionado.horaInicio?.slice(0,5)} - {eventoSeleccionado.horaFin?.slice(0,5)}</p>
                  )}
                  <p className="text-xs text-orange-700">Vigencia: {format(eventoSeleccionado.start, "dd/MM/yyyy")} - {format(eventoSeleccionado.end, "dd/MM/yyyy")}</p>
                  {eventoSeleccionado.enlaceVideollamada && (
                    <a 
                      href={eventoSeleccionado.enlaceVideollamada.startsWith('http') ? eventoSeleccionado.enlaceVideollamada : `https://${eventoSeleccionado.enlaceVideollamada}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-2"
                    >
                      🔗 Enlace a reunión
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none text-muted-foreground mb-2">Tipo</h4>
              <div className="flex gap-2">
                <Badge 
                  style={{ backgroundColor: obtenerColorEvento(eventoSeleccionado.tipo) }}
                  className="text-white hover:opacity-90"
                >
                  {eventoSeleccionado.tipo.charAt(0).toUpperCase() + eventoSeleccionado.tipo.slice(1).replace('_', ' ')}
                </Badge>
                {eventoSeleccionado.esVirtual && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Instancia Virtual
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
          {puedeEditar && (
            <>
              <Button variant="default" onClick={onEditar}>
                ✏️ Editar
              </Button>
              <Button 
                variant="destructive" 
                onClick={onEliminar}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "🗑️ Eliminar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
