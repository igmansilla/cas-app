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
import { type PlanPago, type PlanPagoRequest, EstrategiaPlan, AudienciaPlan } from "../../api/schemas/pagos"
import { useActualizarPlan } from "../../hooks/usePagos"
import { toast } from "sonner"
import { Lock, AlertTriangle } from "lucide-react"

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

const AUDIENCIA_LABELS: Record<string, string> = {
  [AudienciaPlan.ACAMPANTE]: '🏕️ Acampante',
  [AudienciaPlan.DIRIGENTE]: '🎯 Dirigente',
  [AudienciaPlan.BASE]: '👨‍🍳 Base',
};

const ESTRATEGIA_LABELS: Record<string, string> = {
  [EstrategiaPlan.PLAN_A]: 'Plan A',
  [EstrategiaPlan.PLAN_B]: 'Plan B',
  [EstrategiaPlan.PLAN_C]: 'Plan C',
};

export function EditarPlanDialog({ plan, open, onClose }: EditarPlanDialogProps) {
  const { actualizarPlan, cargando } = useActualizarPlan()

  const { register, handleSubmit, reset, setValue } = useForm<PlanPagoRequest>({
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
        montoTotal: Number(plan.montoTotal),
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
        mesLimiteInscripcion: (plan as any).mesLimiteInscripcion,
        mesLimiteDevolucion100: (plan as any).mesLimiteDevolucion100,
        mesLimiteDevolucion50: (plan as any).mesLimiteDevolucion50,
      } as unknown as PlanPagoRequest)
    }
  }, [plan, open, reset])

  const onSubmit = async (data: PlanPagoRequest) => {
    if (!plan || !plan.id) return

    try {
      await actualizarPlan({ id: plan.id, plan: data })
      toast.success("Plan actualizado correctamente")
      onClose()
    } catch (error) {
      console.error("Error al actualizar plan:", error)
      toast.error("Error al actualizar el plan")
    }
  }

  if (!plan) return null

  const mesInicioLabel = MESES.find(m => m.val === monthToNum(plan.mesInicio))?.label || '-';
  const mesFinLabel = MESES.find(m => m.val === monthToNum(plan.mesFin))?.label || '-';

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
          {/* 🔒 Campos no editables - Solo lectura */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Campos estructurales (no editables)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-muted/30 border border-dashed">
              <div>
                <span className="text-[10px] text-muted-foreground block">Código</span>
                <span className="text-sm font-mono">{plan.codigo}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Año</span>
                <span className="text-sm">{plan.anio}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Estrategia</span>
                <span className="text-sm">{ESTRATEGIA_LABELS[plan.estrategia as string] || plan.estrategia}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Audiencia</span>
                <span className="text-sm">{AUDIENCIA_LABELS[plan.audiencia as string] || plan.audiencia}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Vigencia</span>
                <span className="text-sm">{mesInicioLabel} → {mesFinLabel}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Moneda</span>
                <span className="text-sm">{plan.moneda || 'ARS'}</span>
              </div>
            </div>
          </div>

          {/* ✅ Campos editables */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre para Mostrar</Label>
            <Input id="nombre" {...register("nombreParaMostrar", { required: true })} />
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
              <Label htmlFor="montoCuotaFija">Monto Cuota Fija (Opcional)</Label>
              <Input id="montoCuotaFija" type="number" step="0.01" {...register("montoCuotaFija", { valueAsNumber: true })} placeholder="Automático" />
            </div>
          </div>

          {/* ⚠️ Warning */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Cambiar el monto o día de vencimiento solo afecta <strong>nuevas inscripciones</strong>. Las cuotas ya generadas no se actualizan.
            </p>
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
              <Label htmlFor="diaVencimiento">Día Vencimiento</Label>
              <Input id="diaVencimiento" type="number" {...register("diaVencimiento", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Límite de Inscripción</Label>
              <Select
                onValueChange={(v) => setValue("mesLimiteInscripcion" as any, Number(v))}
                defaultValue={String((plan as any).mesLimiteInscripcion || 10)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione mes" /></SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.val} value={String(m.val)}>Hasta {m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Devolución 100% hasta</Label>
              <Select
                onValueChange={(v) => setValue("mesLimiteDevolucion100" as any, Number(v))}
                defaultValue={String((plan as any).mesLimiteDevolucion100 || '')}
              >
                <SelectTrigger><SelectValue placeholder="Sin límite" /></SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Devolución 50% hasta</Label>
              <Select
                onValueChange={(v) => setValue("mesLimiteDevolucion50" as any, Number(v))}
                defaultValue={String((plan as any).mesLimiteDevolucion50 || '')}
              >
                <SelectTrigger><SelectValue placeholder="Sin límite" /></SelectTrigger>
                <SelectContent>
                  {MESES.map(m => (
                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
