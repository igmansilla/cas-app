"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { type PlanPago, type PlanPagoRequest, EstrategiaPlan, AudienciaPlan } from "../../api/schemas/pagos"
import { useActualizarPlan } from "../../hooks/usePagos"
import { toast } from "sonner"

interface EditarPlanDialogProps {
  plan: PlanPago | null
  open: boolean
  onClose: () => void
}

const MESES = [
  { val: 1, label: 'Enero' },
  { val: 2, label: 'Febrero' },
  { val: 3, label: 'Marzo' },
  { val: 4, label: 'Abril' },
  { val: 5, label: 'Mayo' },
  { val: 6, label: 'Junio' },
  { val: 7, label: 'Julio' },
  { val: 8, label: 'Agosto' },
  { val: 9, label: 'Septiembre' },
  { val: 10, label: 'Octubre' },
  { val: 11, label: 'Noviembre' },
  { val: 12, label: 'Diciembre' },
]

// Helper to map month name/number
const monthToNum = (m: string | number | undefined): number => {
  if (!m) return 1;
  if (typeof m === 'number') return m;
  const map: Record<string, number> = {
    'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4, 'MAY': 5, 'JUNE': 6,
    'JULY': 7, 'AUGUST': 8, 'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
  };
  return map[m] || 1;
};

export function EditarPlanDialog({ plan, open, onClose }: EditarPlanDialogProps) {
  const { actualizarPlan, cargando } = useActualizarPlan()

  const { register, handleSubmit, reset, setValue, watch } = useForm<PlanPagoRequest>({
    defaultValues: {
      codigo: "",
      anio: new Date().getFullYear(),
      nombreParaMostrar: "",
      montoTotal: 0,
      moneda: "ARS",
      diaVencimiento: 10,
      minCuotas: 1,
      maxCuotas: 1,
      mesInicioHabilitado: 1,
      mesFinHabilitado: 12,
      activo: true,
      estrategia: EstrategiaPlan.PLAN_A,
    }
  })

  // Populate form on open
  useEffect(() => {
    if (plan && open) {
      reset({
        codigo: plan.codigo,
        anio: plan.anio,
        nombreParaMostrar: plan.nombre,
        montoTotal: Number(plan.montoTotal), // Ensure number
        moneda: plan.moneda || "ARS",
        estrategia: plan.estrategia as EstrategiaPlan || EstrategiaPlan.PLAN_A,
        audiencia: plan.audiencia as AudienciaPlan || AudienciaPlan.ACAMPANTE,
        diaVencimiento: plan.diaVencimiento || 10,
        montoCuotaFija: plan.montoCuotaFija,
        minCuotas: plan.minCuotas || 1,
        maxCuotas: plan.maxCuotas || 1,
        mesInicioHabilitado: monthToNum(plan.mesInicio),
        mesFinHabilitado: monthToNum(plan.mesFin),
        activo: plan.activo,
      } as unknown as PlanPagoRequest)
    }
  }, [plan, open, reset])

  const onSubmit = async (data: PlanPagoRequest) => {
    if (!plan || !plan.id) return

    try {
      // Asegurar que strategy coincida con el plan original si no se editó
      // OJO: El backend puede requerir ciertos campos dependiendo de la estrategia

      await actualizarPlan({ id: plan.id, plan: data })
      toast.success("Plan actualizado correctamente")
      onClose()
    } catch (error) {
      console.error("Error al actualizar plan:", error)
      toast.error("Error al actualizar el plan")
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plan de Pago</DialogTitle>
          <DialogDescription>
            Modifique los detalles del plan {plan.codigo}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" {...register("codigo", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" type="number" {...register("anio")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre para Mostrar</Label>
            <Input id="nombre" {...register("nombreParaMostrar", { required: true })} />
          </div>

          {/* Audiencia Toggle Chips */}
          <div className="space-y-2">
            <Label>Audiencia del Plan</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: AudienciaPlan.ACAMPANTE, label: 'Acampante', icon: '🏕️', description: 'Hijos/Participantes' },
                { value: AudienciaPlan.DIRIGENTE, label: 'Dirigente', icon: '🎯', description: 'Líderes' },
                { value: AudienciaPlan.BASE, label: 'Base', icon: '👨‍🍳', description: 'Cocina/Voluntarios' },
              ].map((opt) => {
                const currentValue = watch('audiencia') || AudienciaPlan.ACAMPANTE;
                const isSelected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('audiencia', opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                      : 'bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <div className="text-left">
                      <div className={`font-medium text-sm ${isSelected ? '' : 'text-foreground'}`}>{opt.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto Total</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input id="monto" type="number" step="0.01" className="pl-7" {...register("montoTotal", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Input id="moneda" {...register("moneda")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minCuotas">Mín. Cuotas</Label>
              <Input id="minCuotas" type="number" {...register("minCuotas", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCuotas">Max. Cuotas</Label>
              <Input id="maxCuotas" type="number" {...register("maxCuotas", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes Inicio Vigencia</Label>
              <Select
                onValueChange={(v) => setValue("mesInicioHabilitado", Number(v))}
                defaultValue={String(monthToNum(plan.mesInicio))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mes Fin Vigencia</Label>
              <Select
                onValueChange={(v) => setValue("mesFinHabilitado", Number(v))}
                defaultValue={String(monthToNum(plan.mesFin))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diaVencimiento">Día Vencimiento</Label>
              <Input id="diaVencimiento" type="number" {...register("diaVencimiento", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="montoCuotaFija">Monto Cuota Fija (Opcional)</Label>
              <Input id="montoCuotaFija" type="number" step="0.01" {...register("montoCuotaFija", { valueAsNumber: true })} placeholder="Automático" />
            </div>
          </div>

          {/* Reglas de Transición omitidas de la edición simple por ahora */}

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="activo"
              defaultChecked={plan.activo}
              onCheckedChange={(checked) => setValue("activo", checked as boolean)}
            />
            <Label htmlFor="activo">Plan Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
