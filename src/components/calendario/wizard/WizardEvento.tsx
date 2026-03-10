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
import { buildGoogleMapsSearchUrl, getDefaultMeetingLocation } from "../../../lib/google-maps";
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
  { id: "ubicacion",     title: "Lugar",         icon: MapPin },
  { id: "confirmacion",  title: "Confirmar",     icon: CheckCircle2 }
);

const APRIL_MONTH_INDEX = 3;
const DECEMBER_MONTH_INDEX = 11;
const ARGENTINA_HOLIDAY_SEASON_START_DAY = 24;
const SATURDAY_DAY_INDEX = 6;

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFirstSaturdayOfApril(year: number) {
  const date = new Date(year, APRIL_MONTH_INDEX, 1);

  while (date.getDay() !== SATURDAY_DAY_INDEX) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function getLastSaturdayBeforeHolidaySeason(year: number) {
  const date = new Date(year, DECEMBER_MONTH_INDEX, ARGENTINA_HOLIDAY_SEASON_START_DAY - 1);

  while (date.getDay() !== SATURDAY_DAY_INDEX) {
    date.setDate(date.getDate() - 1);
  }

  return date;
}

function getMeetingPlanningYear(now = new Date()) {
  const currentYearEnd = getLastSaturdayBeforeHolidaySeason(now.getFullYear());
  currentYearEnd.setHours(23, 59, 59, 999);

  return now > currentYearEnd ? now.getFullYear() + 1 : now.getFullYear();
}

function getDefaultMeetingScheduleValues(now = new Date()) {
  const planningYear = getMeetingPlanningYear(now);

  return {
    fechaInicio: formatDateInputValue(getFirstSaturdayOfApril(planningYear)),
    fechaFin: formatDateInputValue(getLastSaturdayBeforeHolidaySeason(planningYear)),
    diaSemana: "SATURDAY" as const,
  };
}

function formatFechaFieldValue(value: string | undefined, naturaleza: "EVENTO" | "REUNION") {
  if (!value) {
    return "";
  }

  return naturaleza === "REUNION" ? value.slice(0, 10) : value.slice(0, 16);
}

function validateRequiredValue(message: string) {
  return ({ value }: { value: string | undefined | null }) => {
    if (typeof value === "string" && value.trim()) {
      return undefined;
    }

    return message;
  };
}

function validateFechaFinPosterior({ value, fieldApi }: { value: string | undefined | null; fieldApi: any }) {
  if (!value?.trim()) {
    return "La fecha de fin es obligatoria.";
  }

  const fechaInicio = fieldApi.form.getFieldValue("fechaInicio");
  if (!fechaInicio?.trim()) {
    return undefined;
  }

  return new Date(value) > new Date(fechaInicio)
    ? undefined
    : "La fecha de fin debe ser posterior a la fecha de inicio.";
}

function validateHoraFinPosterior({ value, fieldApi }: { value: string | undefined | null; fieldApi: any }) {
  if (!value?.trim()) {
    return "La hora de fin es obligatoria.";
  }

  const horaInicio = fieldApi.form.getFieldValue("horaInicio");
  if (!horaInicio?.trim()) {
    return undefined;
  }

  return value > horaInicio
    ? undefined
    : "La hora de fin debe ser posterior a la hora de inicio.";
}

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
  const defaultMeetingLocation = getDefaultMeetingLocation();
  const defaultMeetingSchedule = getDefaultMeetingScheduleValues();
  const permiteVideollamada = !(naturaleza === "REUNION" && mostrarGrupoEnReunion);

  const useStepper = stepper.useStepper();

  const form = useForm({
    defaultValues: {
      titulo: "",
      descripcion: "",
      tipo: naturaleza === "REUNION" ? "REUNION" : "",
      fechaInicio: naturaleza === "REUNION" ? defaultMeetingSchedule.fechaInicio : "",
      fechaFin: naturaleza === "REUNION" ? defaultMeetingSchedule.fechaFin : "",
      ubicacion: naturaleza === "REUNION" ? defaultMeetingLocation.direccion : "",
      latitud: naturaleza === "REUNION" ? defaultMeetingLocation.lat : undefined as number | undefined,
      longitud: naturaleza === "REUNION" ? defaultMeetingLocation.lng : undefined as number | undefined,
      urlMapa: naturaleza === "REUNION" ? defaultMeetingLocation.url : "",
      naturaleza,
      periodicidad: naturaleza === "REUNION" ? "SEMANAL" : "PUNTUAL",
      diaSemana: naturaleza === "REUNION" ? defaultMeetingSchedule.diaSemana : "",
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
        departamentoId: naturaleza === "REUNION" && mostrarGrupoEnReunion
          ? undefined
          : value.departamentoId ? Number(value.departamentoId) : undefined,
        grupoId: mostrarGrupoEnReunion ? value.grupoId || undefined : undefined,
        plantillaAnualId: value.plantillaAnualId,
        fechaInicio: new Date(value.fechaInicio).toISOString(),
        fechaFin: new Date(value.fechaFin).toISOString(),
        enlaceVideollamada: permiteVideollamada ? value.enlaceVideollamada || undefined : undefined,
      };
      await onGuardar(payload);
    },
  });

  useEffect(() => {
    if (abierto) {
      const ubicacionInicial = valoresIniciales.ubicacion || (naturaleza === "REUNION" ? defaultMeetingLocation.direccion : "");
      const latitudInicial = valoresIniciales.latitud ?? (naturaleza === "REUNION" ? defaultMeetingLocation.lat : undefined);
      const longitudInicial = valoresIniciales.longitud ?? (naturaleza === "REUNION" ? defaultMeetingLocation.lng : undefined);
      const fechaInicioInicial = valoresIniciales.fechaInicio
        ? formatFechaFieldValue(valoresIniciales.fechaInicio, naturaleza)
        : (naturaleza === "REUNION" ? defaultMeetingSchedule.fechaInicio : "");
      const fechaFinInicial = valoresIniciales.fechaFin
        ? formatFechaFieldValue(valoresIniciales.fechaFin, naturaleza)
        : (naturaleza === "REUNION" ? defaultMeetingSchedule.fechaFin : "");
      const urlMapaInicial = valoresIniciales.urlMapa
        || buildGoogleMapsSearchUrl(ubicacionInicial, { lat: latitudInicial, lng: longitudInicial });

      useStepper.reset();
      form.reset();
      form.setFieldValue("titulo", valoresIniciales.titulo || "");
      form.setFieldValue("descripcion", valoresIniciales.descripcion || "");
      form.setFieldValue("tipo", valoresIniciales.tipo || (naturaleza === "REUNION" ? "REUNION" : ""));
      form.setFieldValue("naturaleza", naturaleza);
      form.setFieldValue("fechaInicio", fechaInicioInicial);
      form.setFieldValue("fechaFin", fechaFinInicial);
      form.setFieldValue("ubicacion", ubicacionInicial);
      form.setFieldValue("latitud", latitudInicial);
      form.setFieldValue("longitud", longitudInicial);
      form.setFieldValue("urlMapa", urlMapaInicial);
      form.setFieldValue("periodicidad", valoresIniciales.periodicidad || (naturaleza === "REUNION" ? "SEMANAL" : "PUNTUAL"));
      form.setFieldValue("diaSemana", valoresIniciales.diaSemana || (naturaleza === "REUNION" ? defaultMeetingSchedule.diaSemana : ""));
      form.setFieldValue("horaInicio", valoresIniciales.horaInicio || "15:00");
      form.setFieldValue("horaFin", valoresIniciales.horaFin || "17:00");
      form.setFieldValue("grupoId", mostrarGrupoEnReunion ? valoresIniciales.grupoId || "" : "");
      form.setFieldValue(
        "departamentoId",
        naturaleza === "REUNION" && mostrarGrupoEnReunion
          ? ""
          : valoresIniciales.departamentoId ? String(valoresIniciales.departamentoId) : "",
      );
      form.setFieldValue("plantillaAnualId", valoresIniciales.plantillaAnualId);
      form.setFieldValue("enlaceVideollamada", permiteVideollamada ? valoresIniciales.enlaceVideollamada || "" : "");
    }
  }, [abierto, defaultMeetingLocation.direccion, defaultMeetingLocation.lat, defaultMeetingLocation.lng, defaultMeetingLocation.url, defaultMeetingSchedule.diaSemana, defaultMeetingSchedule.fechaFin, defaultMeetingSchedule.fechaInicio, mostrarGrupoEnReunion, naturaleza, permiteVideollamada, valoresIniciales]);

  // ── Stepper header ─────────────────────────────────────────────────────────
  const allSteps = useStepper.all;
  const currentIndex = allSteps.findIndex((step: { id: string }) => step.id === useStepper.current.id);
  const plantillaAnualId = form.getFieldValue("plantillaAnualId");
  const esEventoPlantillado = naturaleza === "EVENTO" && Boolean(plantillaAnualId);
  const tipoSeleccionado = form.getFieldValue("tipo");
  const tipoSeleccionadoLabel = tiposEvento.find((tipo) => tipo.codigo === tipoSeleccionado)?.etiqueta ?? tipoSeleccionado;
  const grupoSeleccionado = form.getFieldValue("grupoId");
  const grupoSeleccionadoInfo = todosLosGrupos.find((grupo) => grupo.id === grupoSeleccionado);
  const esReunionDepartamental = naturaleza === "REUNION" && contextoPlanificacion === "DEPARTAMENTO";
  const departamentoEsObligatorio = naturaleza === "EVENTO" || esReunionDepartamental || !grupoSeleccionado;

  const esUltimoStep = useStepper.isLast;

  const validateCurrentStep = async () => {
    const fieldsToValidate = (() => {
      switch (useStepper.current.id) {
        case "clasificacion":
          return [
            "titulo",
            ...(naturaleza === "EVENTO" && !esEventoPlantillado ? ["tipo"] : []),
            ...(naturaleza === "REUNION" && mostrarGrupoEnReunion ? ["grupoId"] : []),
            ...(naturaleza === "REUNION" && !mostrarGrupoEnReunion ? ["departamentoId"] : []),
          ];
        case "tiempos":
          return naturaleza === "EVENTO"
            ? ["fechaInicio", "fechaFin"]
            : ["fechaInicio", "fechaFin", "periodicidad", "diaSemana", "horaInicio", "horaFin"];
        case "responsable":
          return naturaleza === "EVENTO" && !esEventoPlantillado ? ["departamentoId"] : [];
        default:
          return [];
      }
    })() as Array<keyof EventoFormData>;

    if (!fieldsToValidate.length) {
      return true;
    }

    await Promise.all(fieldsToValidate.map((fieldName) => Promise.resolve(form.validateField(fieldName, "change"))));

    return fieldsToValidate.every((fieldName) => form.getFieldMeta(fieldName)?.isValid ?? true);
  };

  const handleNextStep = async () => {
    const currentStepIsValid = await validateCurrentStep();

    if (!currentStepIsValid) {
      return;
    }

    useStepper.next();
  };

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

          {naturaleza === "REUNION" && mostrarGrupoEnReunion && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Grupo</p>
              <p className="mt-1 text-sm font-medium text-emerald-950">
                {grupoSeleccionadoInfo
                  ? `${grupoSeleccionadoInfo.nombre} (${grupoSeleccionadoInfo.tipo})`
                  : "Elegí el grupo en Definición"}
              </p>
            </div>
          )}

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
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
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
                    <form.Field name="tipo" validators={{ onChange: EventoFieldSchema.entries.tipo }}>
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

                {naturaleza === "REUNION" && mostrarGrupoEnReunion && (
                  <form.Field name="grupoId" validators={{ onChange: validateRequiredValue("Seleccioná un grupo.") }}>
                    {(field) => (
                      <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <Label className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Grupo *</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange} disabled={bloquearGrupo}>
                          <SelectTrigger><SelectValue placeholder="Seleccioná el grupo..." /></SelectTrigger>
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
                            Esta reunión se está programando para el grupo seleccionado desde la tarjeta.
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

                {naturaleza === "REUNION" && !mostrarGrupoEnReunion && (
                  <form.Field
                    name="departamentoId"
                    validators={{
                      onChange: ({ value }) => {
                        if (esEventoPlantillado) {
                          return undefined;
                        }

                        return validateRequiredValue("Seleccioná un departamento.")({ value });
                      },
                    }}
                  >
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
                          {bloquearDepartamento
                            ? "El departamento queda fijado por la pantalla desde la que abriste esta planificación."
                            : "Departamento organizador de la actividad."}
                        </p>
                        <FieldError field={field} />
                      </div>
                    )}
                  </form.Field>
                )}
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
                    <form.Field name="fechaFin" validators={{ onChangeListenTo: ["fechaInicio"], onChange: validateFechaFinPosterior }}>
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
                      <form.Field name="fechaInicio" validators={{ onChange: validateRequiredValue("La fecha de inicio es obligatoria.") }}>
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Vigencia desde *</Label>
                            <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="fechaFin" validators={{ onChangeListenTo: ["fechaInicio"], onChange: validateFechaFinPosterior }}>
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Vigencia hasta *</Label>
                            <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <form.Field name="periodicidad" validators={{ onChange: validateRequiredValue("Seleccioná la periodicidad.") }}>
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
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="diaSemana" validators={{ onChange: validateRequiredValue("Seleccioná el día de la semana.") }}>
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
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <form.Field name="horaInicio" validators={{ onChange: validateRequiredValue("La hora de inicio es obligatoria.") }}>
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Hora inicio</Label>
                            <Input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="horaFin" validators={{ onChangeListenTo: ["horaInicio"], onChange: validateHoraFinPosterior }}>
                        {(field) => (
                          <div className="space-y-1.5">
                            <Label>Hora fin</Label>
                            <Input type="time" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                            <FieldError field={field} />
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PASO 3: Responsable / Grupo */}
            {useStepper.current.id === "responsable" && naturaleza === "EVENTO" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                {
                  <form.Field name="departamentoId" validators={{ onChange: validateRequiredValue("Seleccioná un departamento.") }}>
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
                              : "Departamento organizador de la actividad."}
                        </p>
                        <FieldError field={field} />
                      </div>
                    )}
                  </form.Field>
                }
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
                        lat={form.getFieldValue("latitud")}
                        lng={form.getFieldValue("longitud")}
                        value={field.state.value || ""}
                        onChange={(ubicacion) => {
                          const debeRestaurarDefault = naturaleza === "REUNION" && ubicacion.source === "clear";

                          if (debeRestaurarDefault) {
                            field.handleChange(defaultMeetingLocation.direccion);
                            form.setFieldValue("latitud", defaultMeetingLocation.lat);
                            form.setFieldValue("longitud", defaultMeetingLocation.lng);
                            form.setFieldValue("urlMapa", defaultMeetingLocation.url);
                            return;
                          }

                          if (ubicacion.source === "clear") {
                            field.handleChange("");
                            form.setFieldValue("latitud", undefined);
                            form.setFieldValue("longitud", undefined);
                            form.setFieldValue("urlMapa", "");
                            return;
                          }

                          field.handleChange(ubicacion.direccion);
                          form.setFieldValue("latitud", ubicacion.lat);
                          form.setFieldValue("longitud", ubicacion.lng);
                          form.setFieldValue("urlMapa", ubicacion.url);
                        }}
                        placeholder="Cómo querés que figure el lugar"
                      />
                      <p className="text-xs text-muted-foreground">
                        Buscá o marcá el punto. El nombre visible se edita aparte.
                      </p>
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

                {permiteVideollamada && (
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
                )}
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
                          <span className="font-medium">
                            {grupoSeleccionadoInfo ? `${grupoSeleccionadoInfo.nombre} (${grupoSeleccionadoInfo.tipo})` : values.grupoId}
                          </span>
                        </div>
                      )}

                      {values.departamentoId && (
                        <div className="px-4 py-3 flex justify-between">
                          <span className="text-muted-foreground">Departamento</span>
                          <span className="font-medium">{values.departamentoId}</span>
                        </div>
                      )}

                      {(values.ubicacion || (permiteVideollamada && values.enlaceVideollamada)) && (
                        <div className="px-4 py-3">
                          <span className="text-muted-foreground block mb-1">{permiteVideollamada ? "Lugar / Conexión" : "Lugar"}</span>
                          {values.ubicacion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              {values.ubicacion}
                            </span>
                          )}
                          {permiteVideollamada && values.enlaceVideollamada && (
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
              key="wizard-submit"
              type="button"
              disabled={cargando}
              onClick={() => {
                if (!cargando) {
                  void form.handleSubmit();
                }
              }}
              className={`gap-2 ${naturaleza === "REUNION" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {cargando ? "Procesando..." : modoEdicion ? "Guardar cambios" : "Publicar"}
            </Button>
          ) : (
            <Button
              key="wizard-next"
              type="button"
              onClick={handleNextStep}
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
