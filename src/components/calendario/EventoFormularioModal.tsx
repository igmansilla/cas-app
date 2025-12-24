/**
 * EventoFormularioModal Component
 * 
 * Modal de formulario para crear/editar eventos usando TanStack Form + Valibot
 */

import { useEffect } from "react";
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

interface EventoFormularioModalProps {
  abierto: boolean;
  modoEdicion: boolean;
  cargando: boolean;
  valoresIniciales: Partial<EventoRequest>;
  tiposEvento: TipoEvento[];
  onCerrar: () => void;
  onGuardar: (datos: EventoFormData) => void;
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
  const form = useForm({
    defaultValues: {
      titulo: "",
      descripcion: "",
      tipo: "",
      fechaInicio: "",
      fechaFin: "",
      ubicacion: "",
    } as EventoFormData,
    validators: {
      onChange: EventoFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Convertir fechas a ISO
      const payload = {
        ...value,
        fechaInicio: new Date(value.fechaInicio).toISOString(),
        fechaFin: new Date(value.fechaFin).toISOString(),
      };
      onGuardar(payload as EventoFormData);
    },
  });

  // Reset form when modal opens or defaults change
  useEffect(() => {
    if (abierto) {
      form.reset();
      form.setFieldValue("titulo", valoresIniciales.titulo || "");
      form.setFieldValue("descripcion", valoresIniciales.descripcion || "");
      form.setFieldValue("tipo", valoresIniciales.tipo || "");
      form.setFieldValue(
        "fechaInicio",
        valoresIniciales.fechaInicio ? valoresIniciales.fechaInicio.slice(0, 16) : ""
      );
      form.setFieldValue(
        "fechaFin",
        valoresIniciales.fechaFin ? valoresIniciales.fechaFin.slice(0, 16) : ""
      );
      form.setFieldValue("ubicacion", valoresIniciales.ubicacion || "");
    }
  }, [abierto, valoresIniciales, form]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {modoEdicion ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
          <DialogDescription>
            Complete el formulario para {modoEdicion ? "actualizar el" : "crear un nuevo"} evento.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-4 py-4"
        >
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
                  placeholder="Nombre del evento"
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

          <form.Field name="descripcion">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Descripción</Label>
                <Textarea
                  id={field.name}
                  placeholder="Descripción del evento"
                  className="resize-none"
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="tipo"
            validators={{
              onChange: EventoFieldSchema.entries.tipo,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>Tipo de evento</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvento.map((tipo) => (
                      <SelectItem key={tipo.codigo} value={tipo.codigo}>
                        {tipo.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="fechaInicio"
              validators={{
                onChange: EventoFieldSchema.entries.fechaInicio,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Fecha inicio *</Label>
                  <Input
                    id={field.name}
                    type="datetime-local"
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

            <form.Field
              name="fechaFin"
              validators={{
                onChange: EventoFieldSchema.entries.fechaFin,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Fecha fin *</Label>
                  <Input
                    id={field.name}
                    type="datetime-local"
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
          </div>

          <form.Field name="ubicacion">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Ubicación</Label>
                <Input
                  id={field.name}
                  placeholder="Lugar del evento"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? "Guardando..." : modoEdicion ? "Actualizar" : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
