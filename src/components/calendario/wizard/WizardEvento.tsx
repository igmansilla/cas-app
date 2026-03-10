import React, { useMemo, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { defineStepper } from "@stepperize/react";
import { 
  EventoFormSchema, 
  EventoFieldSchema, 
  type EventoFormData, 
  type EventoRequest, 
  type TipoEvento 
} from "../../../api/schemas/calendario";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { useGruposAcampantes, useGruposDirigentes } from "../../../hooks/useGrupos";
import { useDepartamentos } from "../../../hooks/useDepartamentos";
import { 
  CalendarRange, Building2, Users, MapPin, Video, CheckCircle2, 
  Tag, Clock, ChevronRight, ChevronLeft 
} from "lucide-react";
import { MapsAutocomplete } from "./MapsAutocomplete";

// ─── Steppers separados por naturaleza ───────────────────────────────────────
const stepperEvento = defineStepper(
  { id: "clasificacion", title: "Definición", icon: Tag },
  { id: "tiempos",       title: "Tiempos",       icon: Clock },
  { id: "responsable",   title: "Responsable",   icon: Building2 },
  { id: "ubicacion",     title: "Ubicación",     icon: MapPin },
  { id: "confirmacion",  title: "Confirmar",     icon: CheckCircle2 }
);

const stepperReunion = defineStepper(
  { id: "clasificacion", title: "Definición", icon: Tag },
  { id: "tiempos",       title: "Horario",       icon: Clock },
  { id: "responsable",   title: "Responsable",   icon: Building2 },
  { id: "ubicacion",     title: "Lugar/Link",    icon: MapPin },
  { id: "confirmacion",  title: "Confirmar",     icon: CheckCircle2 }
);

// ─── Props ─────────────────────────────────────────────────────────────────
interface WizardEventoProps {
  abierto: boolean;
  modoEdicion: boolean;
  cargando: boolean;
  valoresIniciales: Partial<EventoRequest>;
  tiposEvento: TipoEvento[];
  contextoPlanificacion?: "GENERAL" | "DEPARTAMENTO" | "GRUPO";
  bloquearDepartamento?: boolean;
  bloquearGrupo?: boolean;
  mostrarGrupoEnReunion?: boolean;
  onCerrar: () => void;
  onGuardar: (datos: EventoRequest) => void;
}

// ─── Wrapper (necesario para que el Scoped funcione correctamente) ─────────
export function WizardEvento(props: WizardEventoProps) {
  const esReunion =
    props.valoresIniciales?.naturaleza === "REUNION" ||
    props.valoresIniciales?.tipo === "REUNION";

  return esReunion ? (
    <stepperReunion.Scoped>
      <WizardEventoContent {...props} naturaleza="REUNION" stepper={stepperReunion} />
    </stepperReunion.Scoped>
  ) : (
    <stepperEvento.Scoped>
      <WizardEventoContent {...props} naturaleza="EVENTO" stepper={stepperEvento} />
    </stepperEvento.Scoped>
  );
}

// ─── Contenido interno ──────────────────────────────────────────────────────
function WizardEventoContent({
  abierto,
  modoEdicion,
  cargando,
  valoresIniciales,
  tiposEvento,
  onCerrar,
  onGuardar,
  naturaleza,
  stepper,
  contextoPlanificacion = "GENERAL",
  bloquearDepartamento = false,
  bloquearGrupo = false,
  mostrarGrupoEnReunion = true,
}: WizardEventoProps & { naturaleza: "EVENTO" | "REUNION"; stepper: any }) {
  const { grupos: gruposAcampantes } = useGruposAcampantes();
  const { grupos: gruposDirigentes } = useGruposDirigentes();
  const { departamentos, cargando: cargandoDepartamentos } = useDepartamentos(abierto);

  const todosLosGrupos = useMemo(() => [
    ...gruposAcampantes.map(g => ({ ...g, tipo: "Acampantes" })),
    ...gruposDirigentes.map(g => ({ ...g, tipo: "Dirigentes" })),
  ], [gruposAcampantes, gruposDirigentes]);

  const useStepper = stepper.useStepper();

  const form = useForm({
    defaultValues: {
      titulo: "",
      descripcion: "",
      tipo: naturaleza === "REUNION" ? "REUNION" : "",
      fechaInicio: "",
      fechaFin: "",
      ubicacion: "",
      latitud: undefined as number | undefined,
      longitud: undefined as number | undefined,
      urlMapa: "",
      naturaleza,
      periodicidad: naturaleza === "REUNION" ? "SEMANAL" : "PUNTUAL",
      diaSemana: "",
      horaInicio: "15:00",
      horaFin: "17:00",
      grupoId: "",
      departamentoId: "",
      plantillaAnualId: undefined as number | undefined,
      enlaceVideollamada: "",
    } as EventoFormData,
    validators: { onChange: EventoFormSchema },
    onSubmit: async ({ value }) => {
      const payload: EventoRequest = {
        ...value,
        naturaleza,
        tipo: value.tipo,
        departamentoId: value.departamentoId ? Number(value.departamentoId) : undefined,
        grupoId: mostrarGrupoEnReunion ? value.grupoId || undefined : undefined,
        plantillaAnualId: value.plantillaAnualId,
        fechaInicio: new Date(value.fechaInicio).toISOString(),
        fechaFin: new Date(value.fechaFin).toISOString(),
      };
      onGuardar(payload);
    },
  });

  useEffect(() => {
    if (abierto) {
      useStepper.reset();
      form.reset();
      form.setFieldValue("titulo", valoresIniciales.titulo || "");
      form.setFieldValue("descripcion", valoresIniciales.descripcion || "");
      form.setFieldValue("tipo", valoresIniciales.tipo || (naturaleza === "REUNION" ? "REUNION" : ""));
      form.setFieldValue("naturaleza", naturaleza);
      form.setFieldValue("fechaInicio", valoresIniciales.fechaInicio?.slice(0, 16) || "");
      form.setFieldValue("fechaFin", valoresIniciales.fechaFin?.slice(0, 16) || "");
      form.setFieldValue("ubicacion", valoresIniciales.ubicacion || "");
      form.setFieldValue("latitud", valoresIniciales.latitud);
      form.setFieldValue("longitud", valoresIniciales.longitud);
      form.setFieldValue("urlMapa", valoresIniciales.urlMapa || "");
      form.setFieldValue("periodicidad", valoresIniciales.periodicidad || (naturaleza === "REUNION" ? "SEMANAL" : "PUNTUAL"));
      form.setFieldValue("diaSemana", valoresIniciales.diaSemana || "");
      form.setFieldValue("horaInicio", valoresIniciales.horaInicio || "15:00");
      form.setFieldValue("horaFin", valoresIniciales.horaFin || "17:00");
      form.setFieldValue("grupoId", mostrarGrupoEnReunion ? valoresIniciales.grupoId || "" : "");
      form.setFieldValue("departamentoId", valoresIniciales.departamentoId ? String(valoresIniciales.departamentoId) : "");
      form.setFieldValue("plantillaAnualId", valoresIniciales.plantillaAnualId);
      form.setFieldValue("enlaceVideollamada", valoresIniciales.enlaceVideollamada || "");
    }
  }, [abierto, mostrarGrupoEnReunion, naturaleza, valoresIniciales]);

  // ── Stepper header ─────────────────────────────────────────────────────────
  const allSteps = useStepper.all;
  const currentIndex = allSteps.findIndex((step: { id: string }) => step.id === useStepper.current.id);
  const plantillaAnualId = form.getFieldValue("plantillaAnualId");
  const esEventoPlantillado = naturaleza === "EVENTO" && Boolean(plantillaAnualId);
  const tipoSeleccionado = form.getFieldValue("tipo");
  const tipoSeleccionadoLabel = tiposEvento.find((tipo) => tipo.codigo === tipoSeleccionado)?.etiqueta ?? tipoSeleccionado;
  const grupoSeleccionado = form.getFieldValue("grupoId");
  const esReunionDepartamental = naturaleza === "REUNION" && contextoPlanificacion === "DEPARTAMENTO";
  const departamentoEsObligatorio = naturaleza === "EVENTO" || esReunionDepartamental || !grupoSeleccionado;

  const esUltimoStep = useStepper.isLast;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[640px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {modoEdicion
                ? naturaleza === "REUNION"
                  ? esReunionDepartamental
                    ? "Editar reunión del departamento"
                    : "Editar reunión"
                  : "Editar evento"
                : naturaleza === "REUNION"
                  ? esReunionDepartamental
                    ? "Nueva reunión del departamento"
                    : "Nueva reunión"
                  : esEventoPlantillado
                    ? "Programar evento anual"
                    : "Crear evento del departamento"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {naturaleza === "REUNION"
                ? esReunionDepartamental
                  ? "Programá una reunión interna del área. Queda asociada al departamento y no habilita toma de asistencia."
                  : "Programá un encuentro periódico para un grupo."
                : esEventoPlantillado
                  ? "Partís de una plantilla anual y completás la programación concreta del evento."
                  : "Creá un evento puntual nuevo para un departamento."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Stepper pills (estilo WizardPlanPago) ─────────────────── */}
          <nav className="mt-4">
            <ol className="flex items-center gap-0.5">
              {allSteps.map((step: any, index: number) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const StepIcon = step.icon ?? Tag;
                const accentColor = naturaleza === "REUNION" ? "bg-emerald-600" : "bg-orange-500";

                return (
                  <React.Fragment key={step.id}>
                    <li className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={index > currentIndex}
                        className={[
                          "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                          isCompleted ? `${accentColor} text-white cursor-pointer hover:opacity-80` : "",
                          isCurrent ? `${accentColor} text-white ring-2 ring-offset-2 ring-current shadow` : "",
                          !isCompleted && !isCurrent ? "bg-muted text-muted-foreground" : "",
                        ].join(" ")}
                        onClick={() => isCompleted && useStepper.goTo(step.id)}
                      >
                        {isCompleted
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <StepIcon className="w-4 h-4" />
                        }
                      </button>
                      <span className={`text-[10px] font-medium leading-none ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </li>
                    {index < allSteps.length - 1 && (
                      <div
                        className={`flex-1 h-[2px] self-center mb-3.5 transition-colors ${isCompleted ? accentColor : "bg-muted"}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* ── Cuerpo del formulario ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form
            id="wizard-evento-form"
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
          >
            {/* PASO 1: Definición */}
            {useStepper.current.id === "clasificacion" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                <form.Field name="titulo" validators={{ onChange: EventoFieldSchema.entries.titulo }}>
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Título *</Label>
                      <Input
                        placeholder={naturaleza === "REUNION"
                          ? esReunionDepartamental
                            ? "Ej: Reunión interna de coordinación"
                            : "Ej: Reunión Huemul"
                          : "Nombre del evento"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError field={field} />
                    </div>
                  )}
                </form.Field>

                {naturaleza === "EVENTO" && (
                  esEventoPlantillado ? (
                    <div className="space-y-1.5 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                      <Label>Evento anual a programar</Label>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{form.getFieldValue("titulo") || "Evento anual"}</p>
                        <p className="text-sm text-gray-600">Tipo base: {tipoSeleccionadoLabel || "Sin tipo"}</p>
                        <p className="text-xs text-gray-500">
                          La plantilla ya define el tipo y el departamento. Acá completás la fecha, el lugar y los detalles concretos de esta edición.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form.Field name="tipo">
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label>Tipo de evento *</Label>
                          <Select value={field.state.value} onValueChange={field.handleChange}>
                            <SelectTrigger><SelectValue placeholder="Seleccioná el tipo..." /></SelectTrigger>
                            <SelectContent>
                              {tiposEvento.filter(t => t.codigo !== "REUNION").map((tipo) => (
                                <SelectItem key={tipo.codigo} value={tipo.codigo}>{tipo.etiqueta}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError field={field} />
                        </div>
                      )}
                    </form.Field>
                  )
                )}

                <form.Field name="descripcion">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <Textarea
                        placeholder={naturaleza === "REUNION"
                          ? "Orden del día, equipamiento sugerido..."
                          : "Detalles, materiales necesarios..."}
                        className="resize-none"
                        rows={3}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            )}

            {/* PASO 2: Tiempos / Horario */}
            {useStepper.current.id === "tiempos" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                {naturaleza === "EVENTO" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field name="fechaInicio" validators={{ onChange: EventoFieldSchema.entries.fechaInicio }}>
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label>Inicia *</Label>
                          <Input type="datetime-local" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          <FieldError field={field} />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="fechaFin" validators={{ onChange: EventoFieldSchema.entries.fechaFin }}>
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label>Termina *</Label>
                          <Input type="datetime-local" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          <FieldError field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <form.Field name="fechaInicio">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Vigencia desde *</Label>
                            <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="fechaFin">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Vigencia hasta *</Label>
                            <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <form.Field name="periodicidad">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Periodicidad</Label>
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SEMANAL">Semanal</SelectItem>
                                <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                                <SelectItem value="MENSUAL">Mensual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="diaSemana">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Día de la semana</Label>
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                              <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                              <SelectContent>
                                {[
                                  ["SATURDAY", "Sábado"],
                                  ["SUNDAY", "Domingo"],
                                  ["MONDAY", "Lunes"],
                                  ["TUESDAY", "Martes"],
                                  ["WEDNESDAY", "Miércoles"],
                                  ["THURSDAY", "Jueves"],
                                  ["FRIDAY", "Viernes"],
                                ].map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <form.Field name="horaInicio">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Hora inicio</Label>
                            <Input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="horaFin">
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Hora fin</Label>
                            <Input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PASO 3: Responsable / Grupo */}
            {useStepper.current.id === "responsable" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                {naturaleza === "REUNION" && mostrarGrupoEnReunion && (
                  <form.Field name="grupoId">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Grupo *</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange} disabled={bloquearGrupo}>
                          <SelectTrigger><SelectValue placeholder="Seleccione un grupo..." /></SelectTrigger>
                          <SelectContent>
                            {todosLosGrupos.map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id}>
                                {grupo.nombre} <span className="text-muted-foreground text-xs">({grupo.tipo})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {todosLosGrupos.length === 0 && (
                          <p className="text-xs text-amber-600">No hay grupos disponibles todavía.</p>
                        )}
                        {bloquearGrupo && field.state.value && (
                          <p className="text-xs text-muted-foreground">
                            El grupo queda fijado por la tarjeta desde la que abriste esta planificación.
                          </p>
                        )}
                        <FieldError field={field} />
                      </div>
                    )}
                  </form.Field>
                )}

                {naturaleza === "REUNION" && !mostrarGrupoEnReunion && (
                  <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <Label>Tipo de reunión</Label>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">Reunión interna del departamento</p>
                      <p className="text-sm text-gray-600">
                        Esta reunión queda asociada al área seleccionada y no habilita toma de asistencia.
                      </p>
                    </div>
                  </div>
                )}

                <form.Field name="departamentoId">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Departamento {departamentoEsObligatorio ? "*" : ""}</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        disabled={cargandoDepartamentos || esEventoPlantillado || bloquearDepartamento}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona un departamento..." /></SelectTrigger>
                        <SelectContent>
                          {departamentos.filter(d => d.activo).map(d => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {esEventoPlantillado
                          ? "El departamento viene fijado por la plantilla anual elegida."
                          : bloquearDepartamento
                            ? "El departamento queda fijado por la pantalla desde la que abriste esta planificación."
                            : naturaleza === "REUNION" && mostrarGrupoEnReunion
                              ? "Podés dejarlo vacío si la reunión ya queda identificada por el grupo."
                              : "Departamento organizador de la actividad."}
                      </p>
                      <FieldError field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            )}

            {/* PASO 4: Ubicación */}
            {useStepper.current.id === "ubicacion" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                <form.Field name="ubicacion">
                  {(field) => (
                    <div className="space-y-1.5 p-4 border rounded-xl bg-muted/20">
                      <Label className="flex items-center gap-1.5 text-sm font-semibold">
                        <MapPin className="w-4 h-4 text-red-500" /> Lugar físico
                      </Label>
                      <MapsAutocomplete
                        value={field.state.value || ""}
                        onChange={(ubicacion) => {
                          field.handleChange(ubicacion.direccion);
                          form.setFieldValue("latitud", ubicacion.lat);
                          form.setFieldValue("longitud", ubicacion.lng);
                          form.setFieldValue("urlMapa", ubicacion.url);
                        }}
                        placeholder="Buscar dirección en Google Maps..."
                      />
                      {field.state.value && form.getFieldValue("urlMapa") && (
                        <p className="text-xs text-muted-foreground pt-1 border-t mt-2">
                          📍 {field.state.value} ·{" "}
                          <a href={form.getFieldValue("urlMapa") || "#"} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                            Ver en Maps
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="enlaceVideollamada">
                  {(field) => (
                    <div className="space-y-1.5 p-4 border rounded-xl bg-muted/20">
                      <Label className="flex items-center gap-1.5 text-sm font-semibold">
                        <Video className="w-4 h-4 text-blue-500" /> Enlace de videollamada
                      </Label>
                      <Input
                        placeholder="https://meet.google.com/... (opcional)"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            )}

            {/* PASO 5: Confirmación */}
            {useStepper.current.id === "confirmacion" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3">
                <form.Subscribe selector={(s) => s.values}>
                  {(values) => (
                    <div className="rounded-xl border bg-muted/20 divide-y text-sm overflow-hidden">
                      <div className="px-4 py-3 font-semibold text-base flex items-center gap-2">
                        {naturaleza === "REUNION" ? <Users className="w-4 h-4 text-emerald-600" /> : <CalendarRange className="w-4 h-4 text-orange-500" />}
                        {values.titulo || <span className="text-muted-foreground italic">Sin título</span>}
                      </div>

                      {values.tipo && values.tipo !== "REUNION" && (
                        <div className="px-4 py-3 flex justify-between">
                          <span className="text-muted-foreground">Tipo</span>
                          <span className="font-medium capitalize">{values.tipo}</span>
                        </div>
                      )}

                      <div className="px-4 py-3 flex justify-between">
                        <span className="text-muted-foreground">
                          {naturaleza === "REUNION" ? "Vigencia" : "Inicia"}
                        </span>
                        <span className="font-medium">{values.fechaInicio ? new Date(values.fechaInicio).toLocaleString() : "—"}</span>
                      </div>

                      <div className="px-4 py-3 flex justify-between">
                        <span className="text-muted-foreground">
                          {naturaleza === "REUNION" ? "Hasta" : "Termina"}
                        </span>
                        <span className="font-medium">{values.fechaFin ? new Date(values.fechaFin).toLocaleString() : "—"}</span>
                      </div>

                      {naturaleza === "REUNION" && values.diaSemana && (
                        <div className="px-4 py-3 flex justify-between">
                          <span className="text-muted-foreground">Horario</span>
                          <span className="font-medium">
                            {values.periodicidad} · {values.diaSemana} {values.horaInicio}–{values.horaFin}
                          </span>
                        </div>
                      )}

                      {values.grupoId && (
                        <div className="px-4 py-3 flex justify-between">
                          <span className="text-muted-foreground">Grupo</span>
                          <span className="font-medium">{values.grupoId}</span>
                        </div>
                      )}

                      {values.departamentoId && (
                        <div className="px-4 py-3 flex justify-between">
                          <span className="text-muted-foreground">Departamento</span>
                          <span className="font-medium">{values.departamentoId}</span>
                        </div>
                      )}

                      {(values.ubicacion || values.enlaceVideollamada) && (
                        <div className="px-4 py-3">
                          <span className="text-muted-foreground block mb-1">Lugar / Conexión</span>
                          {values.ubicacion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              {values.ubicacion}
                            </span>
                          )}
                          {values.enlaceVideollamada && (
                            <a href={values.enlaceVideollamada} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-xs">
                              <Video className="w-3.5 h-3.5 shrink-0" />
                              {values.enlaceVideollamada}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </form.Subscribe>
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t bg-card flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={useStepper.isFirst ? onCerrar : useStepper.prev}
            className="gap-1"
          >
            {useStepper.isFirst ? "Cancelar" : <><ChevronLeft className="w-4 h-4" /> Atrás</>}
          </Button>

          {esUltimoStep ? (
            <Button
              type="submit"
              form="wizard-evento-form"
              disabled={cargando}
              className={`gap-2 ${naturaleza === "REUNION" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {cargando ? "Procesando..." : modoEdicion ? "Guardar cambios" : "Publicar"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={useStepper.next}
              className={naturaleza === "REUNION" ? "bg-emerald-600 hover:bg-emerald-700 gap-1" : "gap-1"}
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ field }: { field: any }) {
  if (!field.state.meta.errors?.length) return null;
  return (
    <p className="text-xs text-red-500 font-medium animate-in fade-in">
      {field.state.meta.errors.join(", ")}
    </p>
  );
}
