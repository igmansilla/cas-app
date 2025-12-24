/**
 * Modal de Inscripción a Plan
 */

import { useForm } from "@tanstack/react-form";
import { type PlanPago, type InscripcionRequest } from "../../api/schemas/pagos";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ModalInscripcionProps {
  abierto: boolean;
  plan: PlanPago | null;
  cargando: boolean;
  idUsuario: string; // From auth context
  onCerrar: () => void;
  onConfirmar: (datos: InscripcionRequest) => void;
}

const MESES = [
  { val: "JANUARY", label: "Enero" },
  { val: "FEBRUARY", label: "Febrero" },
  { val: "MARCH", label: "Marzo" },
  { val: "APRIL", label: "Abril" },
  { val: "MAY", label: "Mayo" },
  { val: "JUNE", label: "Junio" },
  { val: "JULY", label: "Julio" },
  { val: "AUGUST", label: "Agosto" },
  { val: "SEPTEMBER", label: "Septiembre" },
  { val: "OCTOBER", label: "Octubre" },
  { val: "NOVEMBER", label: "Noviembre" },
  { val: "DECEMBER", label: "Diciembre" },
];

export function ModalInscripcion({
  abierto,
  plan,
  cargando,
  idUsuario,
  onCerrar,
  onConfirmar,
}: ModalInscripcionProps) {
  const form = useForm({
    defaultValues: {
      mesInicio: "MARCH", // Default, could be dynamic
      cuotasDeseadas: plan?.maxCuotas || 12,
    },
    onSubmit: async ({ value }) => {
      if (!plan) return;
      onConfirmar({
          idUsuario,
          codigoPlan: plan.codigo,
          mesInicio: value.mesInicio,
          cuotasDeseadas: value.cuotasDeseadas
      });
    },
  });

  if (!plan) return null;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inscripción a {plan.nombre}</DialogTitle>
          <DialogDescription>
            Configura tu plan de pagos para el campamento.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-6 py-4"
        >
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                      <span className="font-semibold block">Monto Total:</span>
                      ${plan.montoTotal.toLocaleString()}
                  </div>
                  <div>
                       <span className="font-semibold block">Vigencia:</span>
                       {plan.mesInicio} - {plan.mesFin}
                  </div>
              </div>

              {/* Mes Inicio Selection */}
              <form.Field name="mesInicio" children={(field) => (
                  <div className="space-y-2">
                      <Label>Mes de inicio de pagos</Label>
                      <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecciona mes" />
                          </SelectTrigger>
                          <SelectContent>
                              {MESES.map(m => (
                                  <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                          El plan permite desde {plan.mesInicio} hasta {plan.mesFin}.
                      </p>
                  </div>
              )} />

              {/* Cuotas Deseada Selection */}
              <form.Field name="cuotasDeseadas" children={(field) => (
                   <div className="space-y-2">
                      <Label>Cantidad de cuotas ({plan.minCuotas} - {plan.maxCuotas})</Label>
                      <Input 
                        type="number" 
                        min={plan.minCuotas || 1} 
                        max={plan.maxCuotas || 12}
                        value={field.state.value}
                        onChange={e => field.handleChange(Number(e.target.value))}
                      />
                   </div>
              )} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? "Confirmar Inscripción" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
