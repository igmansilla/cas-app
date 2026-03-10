/**
 * PlanificadorAnual Component
 *
 * Botón flotante (FAB) que abre un modal con la planificación anual
 * de eventos y reuniones recurrentes por departamento.
 * Solo visible para DIRIGENTE/ADMIN.
 */

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CalendarPlus, CheckCircle2, ClipboardList } from "lucide-react";
import { obtenerIconoEvento, obtenerColorEvento } from "./helpers";
import type { PlantillaEventoAnual } from "../../api/schemas/calendario";

interface PlanificadorAnualProps {
  plantillas: PlantillaEventoAnual[];
  anio: number;
  cargando: boolean;
  onProgramar: (plantilla: PlantillaEventoAnual) => void;
}

export function PlanificadorAnual({
  plantillas,
  anio,
  cargando,
  onProgramar,
}: PlanificadorAnualProps) {
  const [abierto, setAbierto] = useState(false);

  // Separar eventos de reuniones
  const eventos = useMemo(
    () => plantillas.filter((p) => p.naturaleza === "evento"),
    [plantillas]
  );
  const reuniones = useMemo(
    () => plantillas.filter((p) => p.naturaleza === "reunion"),
    [plantillas]
  );

  // Contadores
  const pendientes = plantillas.filter((p) => !p.programado).length;

  // Agrupar por departamento
  const departamentosEventos = useMemo(() => {
    const map = new Map<string, PlantillaEventoAnual[]>();
    eventos.forEach((e) => {
      const grupo = map.get(e.departamento) || [];
      grupo.push(e);
      map.set(e.departamento, grupo);
    });
    return map;
  }, [eventos]);

  const departamentosReuniones = useMemo(() => {
    const map = new Map<string, PlantillaEventoAnual[]>();
    reuniones.forEach((r) => {
      const grupo = map.get(r.departamento) || [];
      grupo.push(r);
      map.set(r.departamento, grupo);
    });
    return map;
  }, [reuniones]);

  if (cargando) {
    return null; // Fab no aparece hasta que carga
  }

  // Helper local para cerrar el modal al programar 
  const handleProgramar = (plantilla: PlantillaEventoAnual) => {
    setAbierto(false);
    onProgramar(plantilla);
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {/* Botón inline para el header */}
        <Button
          variant="outline"
          className="relative bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
          aria-label="Planificador Anual"
        >
          <ClipboardList className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline font-medium">Planificación {anio}</span>
          {pendientes > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-orange-50 shadow-sm">
              {pendientes}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 md:p-6 pb-2 md:pb-4 border-b bg-orange-50/50">
          <div className="flex items-center justify-between gap-3 mr-6">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">📋</span>
              <DialogTitle className="text-lg md:text-xl font-bold text-gray-800 truncate">
                Planificación Anual {anio}
              </DialogTitle>
            </div>
            <div className="shrink-0 hidden sm:block">
              {pendientes > 0 ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                  {pendientes} pendiente{pendientes !== 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  ✅ Todo programado
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          {/* Mobile Badge */}
          <div className="sm:hidden mb-4">
            {pendientes > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 w-full justify-center">
                {pendientes} tarea{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 border-green-300 w-full justify-center">
                ✅ Todo programado exitosamente
              </Badge>
            )}
          </div>

          {/* Eventos departamentales */}
          {departamentosEventos.size > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Eventos por departamento
              </h3>
              <div className="space-y-5">
                {Array.from(departamentosEventos.entries()).map(([depto, items]) => (
                  <DepartamentoSeccion
                    key={depto}
                    departamento={depto}
                    items={items}
                    onProgramar={handleProgramar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reuniones periódicas */}
          {departamentosReuniones.size > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Reuniones periódicas
              </h3>
              <div className="space-y-5">
                {Array.from(departamentosReuniones.entries()).map(([depto, items]) => (
                  <DepartamentoSeccion
                    key={depto}
                    departamento={depto}
                    items={items}
                    onProgramar={handleProgramar}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sección de un departamento con sus plantillas
 */
function DepartamentoSeccion({
  departamento,
  items,
  onProgramar,
}: {
  departamento: string;
  items: PlantillaEventoAnual[];
  onProgramar: (plantilla: PlantillaEventoAnual) => void;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-orange-50/70 border-b px-4 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
        <p className="text-sm font-semibold text-orange-900">
          {departamento}
        </p>
      </div>
      <div className="divide-y">
        {items.map((plantilla) => (
          <PlantillaFila
            key={plantilla.id}
            plantilla={plantilla}
            onProgramar={onProgramar}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Fila individual de plantilla — limpia para modal
 */
function PlantillaFila({
  plantilla,
  onProgramar,
}: {
  plantilla: PlantillaEventoAnual;
  onProgramar: (plantilla: PlantillaEventoAnual) => void;
}) {
  const color = obtenerColorEvento(plantilla.codigo);
  const icono = obtenerIconoEvento(plantilla.codigo);

  return (
    <div
      className={`flex items-center gap-3 p-3 transition-colors hover:bg-gray-50 ${
        plantilla.programado ? "opacity-75" : ""
      }`}
    >
      {/* Icono */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
        style={{
          borderColor: plantilla.programado ? "#C6F6D5" : `${color}40`,
          backgroundColor: plantilla.programado ? "#F0FFF4" : `${color}08`,
        }}
      >
        <span className="text-lg">{icono}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {plantilla.etiqueta}
        </p>
        <p className="text-xs text-gray-500 line-clamp-1">
          {plantilla.descripcion}
        </p>
      </div>

      {/* Estado / Acción */}
      {plantilla.programado ? (
        <div className="shrink-0 flex flex-col items-center justify-center p-2 text-green-600 bg-green-50 rounded-lg">
          <CheckCircle2 className="h-4 w-4 mb-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Listo</span>
        </div>
      ) : (
        <Button
          size="sm"
          className="shrink-0 text-xs px-3 shadow-sm bg-orange-600 hover:bg-orange-700"
          onClick={() => onProgramar(plantilla)}
        >
          <CalendarPlus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline font-medium">Programar</span>
        </Button>
      )}
    </div>
  );
}
