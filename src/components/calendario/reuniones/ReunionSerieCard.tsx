import { useMemo, useState } from "react";
import { addDays } from "date-fns/addDays";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";
import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  RepeatIcon,
  Trash2,
  Video,
} from "lucide-react";

import type { Evento, ReunionInstancia } from "../../../api/schemas/calendario";
import { useInstanciasReunion } from "../../../hooks/useCalendario";
import { obtenerIdSerieReunion } from "../../../lib/calendario/reuniones";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { AsistenciaReunionDialog } from "./AsistenciaReunionDialog";

const DIAS_SEMANA: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const PERIODICIDAD_LABEL: Record<string, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
  PUNTUAL: "Puntual",
};

interface ReunionSerieCardProps {
  reunion: Evento;
  puedeEditar: boolean;
  onEditar: (reunion: Evento) => void;
  onEliminar: (reunion: Evento) => void;
}

export function ReunionSerieCard({ reunion, puedeEditar, onEditar, onEliminar }: ReunionSerieCardProps) {
  const [seccionAbierta, setSeccionAbierta] = useState<string>("");
  const [instanciaSeleccionada, setInstanciaSeleccionada] = useState<ReunionInstancia | null>(null);
  const reunionId = obtenerIdSerieReunion(reunion);
  const esReunionDeGrupo = Boolean(reunion.grupoId);

  const hoy = useMemo(() => new Date(), []);
  const hasta = useMemo(() => addDays(hoy, 60), [hoy]);
  const cargandoInstancias = seccionAbierta === "proximas";

  const { instancias, cargando, error } = useInstanciasReunion(
    reunionId ?? 0,
    { desde: hoy, hasta },
    Boolean(reunionId) && cargandoInstancias
  );

  const proximasInstancias = instancias.slice(0, 8);
  const vigenciaFin = reunion.fechaFin ? new Date(reunion.fechaFin) : null;

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="h-1.5 bg-emerald-500" />
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">👥</span>
                <h3 className="text-lg font-semibold text-gray-900">{reunion.titulo}</h3>
                {reunion.periodicidad && (
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    <RepeatIcon className="mr-1 h-3 w-3" />
                    {PERIODICIDAD_LABEL[reunion.periodicidad] ?? reunion.periodicidad}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {esReunionDeGrupo
                  ? "Reunión operativa de grupo con seguimiento de próximas ocurrencias y asistencia."
                  : "Reunión interna del departamento, sin toma de asistencia por ocurrencia."}
              </p>
            </div>

            {puedeEditar && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditar(reunion)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => onEliminar(reunion)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            {reunion.diaSemana && (
              <p>
                📆 {DIAS_SEMANA[reunion.diaSemana] ?? reunion.diaSemana}
                {reunion.horaInicio && ` · ${reunion.horaInicio.slice(0, 5)}`}
                {reunion.horaFin && ` – ${reunion.horaFin.slice(0, 5)}`}
              </p>
            )}
            {vigenciaFin && (
              <p>
                ↩ Vigente hasta {format(vigenciaFin, "d/MM/yyyy", { locale: es })}
              </p>
            )}
            {reunion.grupoNombre && <p>👥 {reunion.grupoNombre}</p>}
            {reunion.departamentoNombre && <p>🏷 {reunion.departamentoNombre}</p>}
          </div>

          {reunion.enlaceVideollamada && (
            <a
              href={reunion.enlaceVideollamada}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Video className="h-4 w-4" />
              Abrir videollamada
            </a>
          )}

          <Accordion type="single" collapsible value={seccionAbierta} onValueChange={setSeccionAbierta}>
            <AccordionItem value="proximas" className="border-none">
              <AccordionTrigger className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2 text-left">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                  <span>{esReunionDeGrupo ? "Próximas ocurrencias con asistencia" : "Próximas ocurrencias"}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {cargando ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    No se pudieron cargar las ocurrencias.
                  </div>
                ) : proximasInstancias.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    No hay ocurrencias materializadas en los próximos 60 días.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximasInstancias.map((instancia) => (
                      <div key={instancia.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-900">
                              {format(new Date(instancia.fechaInicio), "EEEE d 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(instancia.fechaInicio), "HH:mm", { locale: es })}
                              {" – "}
                              {format(new Date(instancia.fechaFin), "HH:mm", { locale: es })}
                              {instancia.ubicacion ? ` · ${instancia.ubicacion}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                Presentes: {instancia.presentes}
                              </Badge>
                              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                Ausentes: {instancia.ausentes}
                              </Badge>
                              <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                Justificados: {instancia.justificados}
                              </Badge>
                              <Badge variant="outline">
                                {instancia.asistenciaTomada ? "Asistencia cargada" : "Sin asistencia"}
                              </Badge>
                            </div>
                          </div>

                          {puedeEditar && esReunionDeGrupo && (
                            <Button
                              type="button"
                              onClick={() => setInstanciaSeleccionada(instancia)}
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {instancia.asistenciaTomada ? "Editar asistencia" : "Tomar asistencia"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </article>

      <AsistenciaReunionDialog
        abierto={Boolean(instanciaSeleccionada)}
        instancia={instanciaSeleccionada}
        grupoId={reunion.grupoId}
        onCerrar={() => setInstanciaSeleccionada(null)}
      />
    </>
  );
}