/**
 * EventoFormularioModal Component
 * 
 * Modal de formulario para crear/editar eventos usando TanStack Form + Valibot
 */

import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { EventoFormSchema, EventoFieldSchema, type EventoFormData, type EventoRequest, type TipoEvento } from "../../api/schemas/calendario";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useGruposAcampantes, useGruposDirigentes } from "../../hooks/useGrupos";
import { useDepartamentos } from "../../hooks/useDepartamentos";
import { CalendarRange, Building2, Users } from "lucide-react";

interface EventoFormularioModalProps {
  abierto: boolean;
  modoEdicion: boolean;
  cargando: boolean;
  valoresIniciales: Partial<EventoRequest>;
  tiposEvento: TipoEvento[];
  onCerrar: () => void;
  onGuardar: (datos: EventoRequest) => void;
}

export function EventoFormularioModal({
  abierto,
  modoEdicion,
  cargando,
  valoresIniciales,
  tiposEvento,
  onCerrar,
  onGuardar,
}: EventoFormularioModalProps) {
  const { grupos: gruposAcampantes } = useGruposAcampantes();
  const { grupos: gruposDirigentes } = useGruposDirigentes();
  const { departamentos, cargando: cargandoDepartamentos } = useDepartamentos(abierto);
  
  const todosLosGrupos = useMemo(() => [
    ...gruposAcampantes.map(g => ({ ...g, tipo: 'Acampantes' })),
    ...gruposDirigentes.map(g => ({ ...g, tipo: 'Dirigentes' }))
  ], [gruposAcampantes, gruposDirigentes]);

  const form = useForm({
    defaultValues: {
      titulo: "",
      descripcion: "",
      tipo: "",
      fechaInicio: "",
      fechaFin: "",
      ubicacion: "",
      naturaleza: "EVENTO",
      periodicidad: "PUNTUAL",
      diaSemana: "",
      horaInicio: "15:00",
      horaFin: "17:00",
      grupoId: "",
      departamentoId: "",
      enlaceVideollamada: "",
    } as EventoFormData,
    validators: {
      onChange: EventoFormSchema,
    },
    onSubmit: async ({ value }) => {
      const departamentoId = value.departamentoId ? Number(value.departamentoId) : undefined;
      const grupoId = value.grupoId || undefined;
      // Convertir fechas a ISO
      const payload = {
        ...value,
        tipo: value.naturaleza === "REUNION" ? "REUNION" : value.tipo,
        departamentoId,
        grupoId,
        fechaInicio: new Date(value.fechaInicio).toISOString(),
        fechaFin: new Date(value.fechaFin).toISOString(),
      };
      onGuardar(payload as EventoRequest);
    },
  });

  // Reset form when modal opens or defaults change
  useEffect(() => {
    if (abierto) {
      form.reset();
      form.setFieldValue("titulo", valoresIniciales.titulo || "");
      form.setFieldValue("descripcion", valoresIniciales.descripcion || "");
      form.setFieldValue("tipo", valoresIniciales.tipo || (valoresIniciales.naturaleza === 'REUNION' ? 'REUNION' : ""));
      const naturalezaInicial = (valoresIniciales.naturaleza || "EVENTO").toUpperCase();
      form.setFieldValue("naturaleza", naturalezaInicial as "EVENTO" | "REUNION");
      form.setFieldValue(
        "fechaInicio",
        valoresIniciales.fechaInicio ? valoresIniciales.fechaInicio.slice(0, 16) : ""
      );
      form.setFieldValue(
        "fechaFin",
        valoresIniciales.fechaFin ? valoresIniciales.fechaFin.slice(0, 16) : ""
      );
      form.setFieldValue("ubicacion", valoresIniciales.ubicacion || "");
      form.setFieldValue("periodicidad", valoresIniciales.periodicidad || "PUNTUAL");
      form.setFieldValue("diaSemana", valoresIniciales.diaSemana || "");
      form.setFieldValue("horaInicio", valoresIniciales.horaInicio || "15:00");
      form.setFieldValue("horaFin", valoresIniciales.horaFin || "17:00");
      form.setFieldValue("grupoId", valoresIniciales.grupoId || "");
      form.setFieldValue("departamentoId", valoresIniciales.departamentoId ? String(valoresIniciales.departamentoId) : "");
      form.setFieldValue("enlaceVideollamada", valoresIniciales.enlaceVideollamada || "");
    }
  }, [abierto, valoresIniciales, form]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <form.Subscribe selector={(s) => ({ naturaleza: s.values.naturaleza, grupoId: s.values.grupoId })}>
          {({ naturaleza, grupoId }) => (
            <>
              <DialogHeader>
                <DialogTitle>
                  {modoEdicion ? "Editar" : "Nuevo"} {naturaleza === "REUNION" ? "Reunión" : "Evento"}
                </DialogTitle>
                <DialogDescription>
                  {naturaleza === "REUNION"
                    ? "Programa reuniones con grupo, horario y vigencia."
                    : "Crea un evento puntual con departamento asignado."}
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="grid gap-4 py-2"
              >
                <form.Field name="naturaleza">
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Tipo de evento</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => {
                          field.handleChange(v as "EVENTO" | "REUNION");
                          if (v === "REUNION") {
                            form.setFieldValue("tipo", "REUNION");
                            form.setFieldValue("periodicidad", "SEMANAL");
                          } else {
                            form.setFieldValue("periodicidad", "PUNTUAL");
                            form.setFieldValue("tipo", "");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona naturaleza" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EVENTO">Evento puntual</SelectItem>
                          <SelectItem value="REUNION">Reunión periódica</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarRange className="w-4 h-4" />
                        Usa "Reunión" cuando tenga grupo y horario fijo.
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="titulo"
                  validators={{
                    onChange: EventoFieldSchema.entries.titulo,
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Título *</Label>
                      <Input
                        id={field.name}
                        placeholder={naturaleza === "REUNION" ? "Ej: Reunión Huemul" : "Nombre del evento"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-500">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                {naturaleza === "REUNION" && (
                  <form.Field name="grupoId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Grupo *</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={todosLosGrupos.length === 0 ? "No hay grupos disponibles" : "Seleccione un grupo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {todosLosGrupos.map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id}>
                                {grupo.nombre} ({grupo.tipo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {todosLosGrupos.length === 0 && (
                          <p className="text-xs text-orange-600">No hay grupos cargados aún. Cargá los grupos antes de programar reuniones.</p>
                        )}
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                )}

                {(naturaleza === "EVENTO" || !grupoId) && (
                  <form.Field name="departamentoId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Departamento *</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={cargandoDepartamentos}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos
                              .filter((d) => d.activo)
                              .map((d) => (
                                <SelectItem key={d.id} value={String(d.id)}>
                                  {d.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Obligatorio para eventos. En reuniones se omite solo si está asociada a un grupo.
                        </p>
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="tipo">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={naturaleza === "REUNION"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposEvento.map((tipo) => (
                              <SelectItem key={tipo.codigo} value={tipo.codigo}>
                                {tipo.etiqueta}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {naturaleza !== "REUNION" && field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  {naturaleza === "REUNION" ? (
                    <form.Field name="periodicidad">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Periodicidad</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SEMANAL">Semanal</SelectItem>
                              <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                              <SelectItem value="MENSUAL">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </form.Field>
                  ) : (
                    <form.Field name="ubicacion">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Ubicación</Label>
                          <Input
                            id={field.name}
                            placeholder="Lugar"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                  )}
                </div>

                {naturaleza === "REUNION" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="diaSemana">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Día</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Día" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SATURDAY">Sábado</SelectItem>
                              <SelectItem value="SUNDAY">Domingo</SelectItem>
                              <SelectItem value="MONDAY">Lunes</SelectItem>
                              <SelectItem value="TUESDAY">Martes</SelectItem>
                              <SelectItem value="WEDNESDAY">Miércoles</SelectItem>
                              <SelectItem value="THURSDAY">Jueves</SelectItem>
                              <SelectItem value="FRIDAY">Viernes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="enlaceVideollamada">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Link (opcional)</Label>
                          <Input
                            placeholder="Meet/Zoom"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="fechaInicio">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>{naturaleza === "REUNION" ? "Vigencia desde" : "Inicia"}</Label>
                        <Input
                          type={naturaleza === "REUNION" ? "date" : "datetime-local"}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="fechaFin">
                    {(field) => (
                      <div className="space-y-2">
                        <Label>{naturaleza === "REUNION" ? "Vigencia hasta" : "Termina"}</Label>
                        <Input
                          type={naturaleza === "REUNION" ? "date" : "datetime-local"}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {naturaleza === "REUNION" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field name="horaInicio">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Hora Inicio</Label>
                          <Input
                            type="time"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="horaFin">
                      {(field) => (
                        <div className="space-y-2">
                          <Label>Hora Fin</Label>
                          <Input
                            type="time"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}

                <form.Field name="descripcion">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Descripción</Label>
                      <Textarea
                        id={field.name}
                        placeholder="Detalles adicionales..."
                        className="resize-none"
                        rows={2}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={onCerrar}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={cargando}>
                    {cargando ? "Guardando..." : modoEdicion ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  );
}
