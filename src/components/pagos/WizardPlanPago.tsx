/**
 * Wizard para Creación de Planes de Pago usando @stepperize/react
 */

import { useForm } from "@tanstack/react-form";
import { defineStepper } from "@stepperize/react";
import { 
  type PlanPagoRequest, 
  EstrategiaPlan 
} from "../../api/schemas/pagos";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { 
  InfoIcon, 
  CalculatorIcon, 
  CheckCircle2,
  Circle,
  LayoutList,
  Target,
  Settings2,
  FileCheck,
} from "lucide-react";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { casColors } from "../../lib/colors";

// Define Global Stepper
import { pipe, minLength, minValue, number, string, safeParse } from "valibot";

export const GlobalStepper = defineStepper(
  { id: "general", title: "General" },
  { id: "estrategia", title: "Estrategia" },
  { id: "configuracion", title: "Configuración" },
  { id: "revision", title: "Revisión" }
);

// Define Nested Stepper for Configuración (Cuota Fija)
export const ConfigStepper = defineStepper(
    { id: "vigencia", title: "Vigencia" },
    { id: "valor", title: "Valor" },
    { id: "detalles", title: "Detalles" }
);

export const MontoDivididoStepper = defineStepper(
    { id: "vigencia", title: "Vigencia" },
    { id: "detalles", title: "Detalles" }
);



interface WizardPlanPagoProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: PlanPagoRequest) => void;
  cargando: boolean;
}

const STEP_ICONS = {
  general: LayoutList,
  estrategia: Target,
  configuracion: Settings2,
  revision: FileCheck,
};

// ... (props definition)

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
];

// Helper for field validation without adapter issues
const validateWithValibot = (schema: any) => ({ value }: { value: any }) => {
    const result = safeParse(schema, value);
    if (result.success) return undefined;
    return result.issues[0].message;
}

export function WizardPlanPago(props: WizardPlanPagoProps) {
    return (
        <GlobalStepper.Scoped>
            <WizardPlanPagoContent {...props} />
        </GlobalStepper.Scoped>
    )
}

function WizardPlanPagoContent({ abierto, onCerrar, onGuardar, cargando }: WizardPlanPagoProps) {
  const stepper = GlobalStepper.useStepper();

  const form = useForm({
    // validatorAdapter: valibotValidator(), // Removing to avoid TS error, using local wrapper
    defaultValues: {
      codigo: "",
      anio: new Date().getFullYear(),
      nombreParaMostrar: "",
      montoTotal: 0,
      moneda: "ARS", // Hardcoded
      estrategia: EstrategiaPlan.MONTO_DIVIDIDO, // Default
      diaVencimiento: 10,
      montoCuotaFija: 0,
      mesInicioHabilitado: 4, // Abril
      mesFinHabilitado: 1, // Enero
      minCuotas: 1,
      maxCuotas: 10,
      activo: true,
    } as PlanPagoRequest,
    onSubmit: async ({ value }) => {
        // Auto-generate code if empty
        const finalData = { ...value };
        if (!finalData.codigo) {
             finalData.codigo = `PLAN-${finalData.anio}-${Math.floor(Math.random() * 1000)}`;
        }
        onGuardar(finalData);
    },
  });

  const stepsFields = {
      general: ['nombreParaMostrar', 'montoTotal', 'anio'] as const,
      estrategia: ['estrategia'] as const,
      configuracion: [] as const, 
      revision: [] as const,
  };

  const validateCurrentStep = async () => {
      const currentId = stepper.current.id as keyof typeof stepsFields;
      // Global validation for known global fields
      if (currentId in stepsFields && stepsFields[currentId].length > 0) {
          const fields = stepsFields[currentId];
          let allValid = true;
          for (const fieldName of fields) {
             const errors = await form.validateField(fieldName as any, 'change');
             if (errors.length > 0) allValid = false;
          }
           return allValid;
      }
      return true;
  };
  
  const handleNav = async (targetId: string, index: number) => {
      const currentIndex = stepper.all.indexOf(stepper.current);
      // If trying to move forward, validate current step first
      if (index > currentIndex) {
          const isValid = await validateCurrentStep();
          if (!isValid) return;
      }
      stepper.goTo(targetId as keyof typeof stepsFields);
  };

  const handleNext = async () => {
      const isValid = await validateCurrentStep();
      if (!isValid) return; 
      stepper.next();
  };

  const handleBack = () => {
    stepper.prev();
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Plan de Pago</DialogTitle>
        </DialogHeader>

        <nav aria-label="Pasos del Plan" className="group my-4 px-4">
          <ol
            className="flex items-center justify-between gap-2"
            aria-orientation="horizontal"
          >
            {stepper.all.map((step, index, array) => {
              const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] || Circle;
              const currentIndex = stepper.all.indexOf(stepper.current);
              const isActiveOrCompleted = index <= currentIndex;
              const isCurrent = stepper.current.id === step.id;

              return (
                <React.Fragment key={step.id}>
                  <li className="flex items-center gap-4 flex-shrink-0">
                    <Button
                      type="button"
                      role="tab"
                      variant={isActiveOrCompleted ? 'default' : 'secondary'}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-posinset={index + 1}
                      aria-setsize={array.length}
                      aria-selected={isCurrent}
                      className="flex size-10 items-center justify-center rounded-full p-0"
                      onClick={() => {
                          // Optional: Allow navigation only to visited steps or unrestricted
                          // For now, allow direct click if we want flexibility or restrict it.
                          // Let's stick to simple "goTo" logic if available or just render visual.
                          handleNav(step.id as string, index);
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                    <span className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground hidden md:block'}`}>
                        {step.title}
                    </span>
                  </li>
                  {index < array.length - 1 && (
                    <Separator
                      className={`flex-1 h-[2px] ${
                        index < currentIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>


        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6 py-4 px-1"
        >
           {stepper.switch({
               general: () => (
                   <StepGeneral form={form} />
               ),
                estrategia: () => (
                   <StepEstrategia form={form} />
                ),
                configuracion: () => (
                   <StepConfiguracion form={form} />
                ),
                revision: () => (
                    <StepRevision form={form} />
                )
           })}

          <DialogFooter className="flex justify-between sm:justify-between px-1">
            <Button type="button" variant="outline" onClick={stepper.isFirst ? onCerrar : handleBack}>
              {stepper.isFirst ? "Cancelar" : "Atrás"}
            </Button>
            
            {stepper.isLast ? (
                 <Button type="submit" disabled={cargando}>
                    {cargando ? "Guardando..." : "Confirmar y Crear"}
                 </Button>
            ) : (
                 /* Hide Global Next if in Config (handled locally by nested steppers) */
                 stepper.current.id !== 'configuracion' && (
                     <Button type="button" onClick={handleNext}>
                         Siguiente
                     </Button>
                 )
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// Sub-components for Steps
// ----------------------------------------------------------------------

function StepGeneral({ form }: { form: any }) {
    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-4">
                <form.Field 
                    name="nombreParaMostrar" 
                    validators={{
                        onChange: validateWithValibot(pipe(string(), minLength(3, 'El nombre es obligatorio (min 3 letras)')))
                    }}
                    children={(field: any) => (
                    <div className="space-y-2">
                         <div className="flex items-center gap-2">
                             <Label htmlFor="nombre">Nombre del Plan</Label>
                             <InfoTooltip text="Nombre visible para los usuarios al momento de inscribirse." />
                         </div>
                        <Input 
                            id="nombre" 
                            placeholder="Ej. Campamento Andino 2026"
                            value={field.state.value} 
                            onChange={e => field.handleChange(e.target.value)} 
                            className={field.state.meta.errors.length ? "border-red-500" : ""}
                        />
                         {field.state.meta.errors ? (
                            <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(", ")}</p>
                         ) : null}
                    </div>
                )} />

                <div className="grid grid-cols-2 gap-4">
                     <form.Field name="anio" children={(field: any) => (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="anio">Año</Label>
                                <InfoTooltip text="Año fiscal al que corresponde el plan." />
                            </div>
                            <Input type="number" id="anio" value={field.state.value} onChange={e => field.handleChange(Number(e.target.value))} />
                        </div>
                    )} />
                    
                    <form.Field 
                        name="montoTotal"
                        validators={{
                            onChange: validateWithValibot(pipe(number(), minValue(1000, 'El monto debe ser mayor a $1.000')))
                        }}
                        children={(field: any) => {
                        const formatValue = (val: any) => {
                            if (!val && val !== 0) return "";
                            return Number(val).toLocaleString("es-AR");
                        };

                        const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            // Remove all non-digits
                            const clean = e.target.value.replace(/\D/g, "");
                            field.handleChange(clean ? Number(clean) : 0);
                        };

                        return (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="montoTotal">Monto Total</Label>
                                    <InfoTooltip text="Costo total del evento por persona." />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input
                                        id="montoTotal" 
                                        value={formatValue(field.state.value)} 
                                        onChange={handleRawChange}
                                        className={`pl-7 ${field.state.meta.errors.length ? "border-red-500" : ""}`}
                                    />
                                </div>
                                 {field.state.meta.errors ? (
                                    <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(", ")}</p>
                                 ) : null}
                            </div>
                        )}} 
                     />
                </div>
                
                 <form.Field name="activo" children={(field: any) => (
                  <div className="flex items-center space-x-2 pt-4">
                      <Switch id="activo" checked={field.state.value} onCheckedChange={field.handleChange} />
                      <Label htmlFor="activo">Habilitar plan inmediatamente</Label>
                  </div>
               )} />
             </div>
        </div>
    )
}


function StepEstrategia({ form }: { form: any }) {
    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium">Selecciona la Estrategia de Cobro</h3>
            <p className="text-sm text-muted-foreground">Define cómo se calcularán las cuotas para los inscritos.</p>
            
            <form.Field name="estrategia" children={(field: any) => (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                        className={`cursor-pointer transition-all hover:border-primary border-2 ${field.state.value === EstrategiaPlan.MONTO_DIVIDIDO ? 'border-primary bg-primary/5' : 'border-border'}`}
                        onClick={() => field.handleChange(EstrategiaPlan.MONTO_DIVIDIDO)}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalculatorIcon className="w-5 h-5"/> Monto Dividido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Permites al usuario <strong>elegir la cantidad de cuotas</strong> (entre un mínimo y máximo). El monto mensual varía según su elección.
                                <br/><br/>
                                <span className="text-xs bg-muted p-1 rounded">Recomendado para dar flexibilidad</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`cursor-pointer transition-all hover:border-primary border-2 ${field.state.value === EstrategiaPlan.CUOTA_FIJA ? 'border-primary bg-primary/5' : 'border-border'}`}
                        onClick={() => field.handleChange(EstrategiaPlan.CUOTA_FIJA)}
                    >
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Circle className="w-5 h-5"/> Cuota Fija Flexible
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">
                                Fijas un <strong>monto único mensual</strong> para todos. El usuario no elige; paga ese valor hasta cubrir el total.
                            </p>
                        </CardContent>
                    </Card>
                 </div>
            )} />
        </div>
    )
}



function StepConfiguracion({ form }: { form: any }) {
    const estrategia = form.getFieldValue('estrategia');
    
    // Validar visualización



    // Header común
    const Header = () => (
         <div className="flex items-center gap-2 pb-2 border-b mb-6">
             <div className={`p-2 rounded-full ${estrategia === EstrategiaPlan.MONTO_DIVIDIDO ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}`}>
                  {estrategia === EstrategiaPlan.MONTO_DIVIDIDO ? <CalculatorIcon className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
             </div>
             <div>
                 <h3 className="text-lg font-medium">Configurando: {estrategia === EstrategiaPlan.MONTO_DIVIDIDO ? 'Monto Dividido' : 'Cuota Fija Flexible'}</h3>
                 <p className="text-xs text-muted-foreground">Ajusta las fechas y los parámetros de cobro.</p>
             </div>
         </div>
    );

    if (estrategia === EstrategiaPlan.MONTO_DIVIDIDO) {
        return (
            <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <Header />
                 <MontoDivididoStepper.Scoped>
                    <MontoDivididoConfig form={form} />
                 </MontoDivididoStepper.Scoped>
            </div>
        )
    }
    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <Header />
             <ConfigStepper.Scoped>
                 <CuotaFijaConfig form={form} />
             </ConfigStepper.Scoped>
        </div>
    )
}

function MontoDivididoConfig({ form }: { form: any }) {
    const stepper = MontoDivididoStepper.useStepper();
    const globalStepper = GlobalStepper.useStepper();

    const handleValidityChange = (field: 'mesInicioHabilitado' | 'mesFinHabilitado', value: number) => {
        form.setFieldValue(field, value);
        
        // Calculate new validity
        const currentStart = field === 'mesInicioHabilitado' ? value : form.getFieldValue('mesInicioHabilitado');
        const currentEnd = field === 'mesFinHabilitado' ? value : form.getFieldValue('mesFinHabilitado');
        
        // Wrap-around logic
        const newAvailableMonths = currentEnd >= currentStart 
             ? (currentEnd - currentStart) + 1 
             : (12 - currentStart + 1) + currentEnd;

        // Auto-adjust quotas if they exceed new validity
        const currentMin = form.getFieldValue("minCuotas");
        const currentMax = form.getFieldValue("maxCuotas");

        if (currentMin > newAvailableMonths) {
             form.setFieldValue("minCuotas", Math.max(1, newAvailableMonths));
        }
        if (currentMax > newAvailableMonths) {
             form.setFieldValue("maxCuotas", Math.max(1, newAvailableMonths));
        }
    };

     return (
        <div className="border rounded-lg p-4 bg-muted/5 space-y-4">
            <div className="flex items-center justify-between items-center mb-2">
                 <div>
                    <h4 className="font-semibold text-primary text-sm uppercase tracking-wider">{stepper.current.title}</h4>
                    <p className="text-xs text-muted-foreground">Paso {stepper.all.indexOf(stepper.current) + 1} de {stepper.all.length}</p>
                 </div>
                 <div className="flex gap-1">
                     {stepper.all.map((s) => (
                         <div key={s.id} className={`h-1.5 w-6 rounded-full transition-colors ${stepper.current.id === s.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                     ))}
                 </div>
            </div>

            <Separator />
            
             <div className="min-h-[200px]">
                {stepper.switch({
                    vigencia: () => (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                             
                             {/* Visual Timeline - Reactive */}
                             {/* Visual Timeline - Reactive */}
                             <form.Subscribe
                                selector={(state: any) => [state.values.mesInicioHabilitado, state.values.mesFinHabilitado]}
                                children={([start, end]: [number, number]) => {
                                    const available = end >= start ? (end - start + 1) : (12 - start + 1) + end;
                                    
                                    // Generate chronological sequence
                                    const timeline = [];
                                    if (end >= start) {
                                        for (let i = start; i <= end; i++) timeline.push({ val: i, offset: 0 });
                                    } else {
                                        for (let i = start; i <= 12; i++) timeline.push({ val: i, offset: 0 });
                                        for (let i = 1; i <= end; i++) timeline.push({ val: i, offset: 1 });
                                    }

                                    return (
                                     <div className="bg-background border rounded-md p-4">
                                         <div className="flex justify-between items-center mb-4">
                                             <h5 className="text-sm font-medium">Cronograma de Pagos</h5>
                                             <div className="flex gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Año Actual</div>
                                                 {timeline.some(t => t.offset > 0) && (
                                                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: casColors.primary.orange }} /> Año Siguiente</div>
                                                 )}
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                                             {timeline.map((item, idx) => {
                                                 const m = MESES.find(m => m.val === item.val);
                                                 const isNextYear = item.offset > 0;
                                                 
                                                 return (
                                                     <div key={`${item.val}-${item.offset}`} className="flex flex-col items-center gap-2 min-w-[3rem] animate-in fade-in zoom-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                         <div 
                                                            className={`
                                                                relative w-10 h-10 rounded-md border flex items-center justify-center font-bold text-sm shadow-sm transition-all
                                                                ${isNextYear 
                                                                    ? 'text-white border-orange-700' 
                                                                    : 'bg-primary text-primary-foreground border-primary'
                                                                }
                                                            `}
                                                            style={isNextYear ? { backgroundColor: "#FF6B35" } : {}}
                                                         >
                                                            {idx + 1}
                                                            {isNextYear && (
                                                                <span 
                                                                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold shadow-sm border"
                                                                    style={{ color: "#FF6B35", borderColor: "#FF6B35" }}
                                                                >
                                                                    +1
                                                                </span>
                                                            )}
                                                         </div>
                                                         <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                                             {m?.label.substring(0, 3)}
                                                         </span>
                                                     </div>
                                                 )
                                             })}
                                             
                                             {/* Arrow/Line indicator for continuity if needed, or just gap */}
                                         </div>
                                         
                                         <p className="text-xs text-muted-foreground text-right pt-2 border-t mt-2">
                                            Total: <strong>{available} cuotas</strong> posibles.
                                         </p>
                                     </div>
                                    )
                                }}
                             />

                            <div className="grid grid-cols-2 gap-4">
                                <form.Field name="mesInicioHabilitado" children={(field: any) => (
                                    <div className="space-y-1">
                                        <Label>Mes Inicio</Label>
                                        <Select value={String(field.state.value)} onValueChange={(v) => handleValidityChange('mesInicioHabilitado', Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESES.map(m => (
                                                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="mesFinHabilitado" children={(field: any) => (
                                    <div className="space-y-1">
                                        <Label>Mes Fin</Label>
                                        <Select value={String(field.state.value)} onValueChange={(v) => handleValidityChange('mesFinHabilitado', Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MESES.map(m => (
                                                    <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                            </div>
                        </div>
                    ),
                    detalles: () => (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Settings2 className="w-4 h-4"/>
                                <span>Parámetros de inscripción y cuotas.</span>
                             </div>

                            {/* Reactive Limits for Buttons */}
                            <form.Subscribe 
                                selector={(state: any) => [state.values.mesInicioHabilitado, state.values.mesFinHabilitado]}
                                children={([start, end]: [number, number]) => {
                                    const available = end >= start ? (end - start + 1) : (12 - start + 1) + end;
                                    
                                    return (
                                        <div className="grid grid-cols-2 gap-6">
                                            <form.Field name="minCuotas" children={(field: any) => (
                                                <div className="space-y-2">
                                                    <Label>Mínimo de Cuotas</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="icon" type="button" onClick={() => field.handleChange(Math.max(1, field.state.value - 1))}>-</Button>
                                                        <span className="font-mono w-8 text-center">{field.state.value}</span>
                                                        <Button variant="outline" size="icon" type="button" onClick={() => field.handleChange(Math.min(available, field.state.value + 1))}>+</Button>
                                                    </div>
                                                </div>
                                            )} />
                                            <form.Field name="maxCuotas" children={(field: any) => (
                                                <div className="space-y-2">
                                                    <Label>Máximo de Cuotas</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="icon" type="button" onClick={() => field.handleChange(Math.max(1, field.state.value - 1))}>-</Button>
                                                        <span className="font-mono w-8 text-center">{field.state.value}</span>
                                                        <Button variant="outline" size="icon" type="button" onClick={() => field.handleChange(Math.min(available, field.state.value + 1))}>+</Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Máximo permitido: {available} (según vigencia).</p>
                                                </div>
                                            )} />
                                        </div>
                                    )
                                }}
                            />

                             <form.Field name="diaVencimiento" children={(field: any) => (
                                <div className="space-y-2">
                                    <Label>Día de Vencimiento Mensual</Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar día" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[5, 10, 15, 20, 25].map(d => (
                                                <SelectItem key={d} value={String(d)}>Día {d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Fecha límite de pago para cada mes.</p>
                                </div>
                            )} />
                        </div>
                    )
                })}
             </div>

             <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-muted/50">
                {!stepper.isFirst && (<Button type="button" variant="outline" onClick={stepper.prev} size="sm">Anterior</Button>)}
                 {!stepper.isLast ? (
                     <Button type="button" onClick={stepper.next} size="sm">Siguiente</Button>
                 ) : (
                     <div className="flex items-center gap-2 text-primary text-sm font-medium animate-in fade-in">
                        <Button type="button" onClick={() => globalStepper.next()} className="gap-2">
                             Confirmar Configuración <CheckCircle2 className="w-4 h-4" />
                        </Button>
                     </div>
                 )}
            </div>
        </div>
     )
}

function CuotaFijaConfig({ form }: { form: any }) {
    const stepper = ConfigStepper.useStepper();
    const globalStepper = GlobalStepper.useStepper();
    const montoTotal = Number(form.getFieldValue('montoTotal')) || 0;



    return (
        <div className="border rounded-lg p-4 bg-muted/5 space-y-4"> 
             {/* Local Header */}
             <div className="flex justify-between items-center mb-2">
                 <div>
                    <h4 className="font-semibold text-primary text-sm uppercase tracking-wider">{stepper.current.title}</h4>
                    <p className="text-xs text-muted-foreground">Paso {stepper.all.indexOf(stepper.current) + 1} de {stepper.all.length}</p>
                 </div>
                 <div className="flex gap-1">
                     {stepper.all.map((s) => (
                         <div key={s.id} className={`h-1.5 w-6 rounded-full transition-colors ${stepper.current.id === s.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                     ))}
                 </div>
             </div>

             {/* Stepper Content */}
             <div className="min-h-[200px]">
                {stepper.switch({
                    vigencia: () => (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                             
                             {/* Visual Timeline - Reactive */}
                             <form.Subscribe
                                selector={(state: any) => [state.values.mesInicioHabilitado, state.values.mesFinHabilitado]}
                                children={([start, end]: [number, number]) => {
                                    const available = end >= start ? (end - start + 1) : (12 - start + 1) + end;
                                    
                                    // Generate chronological sequence
                                    const timeline = [];
                                    if (end >= start) {
                                        for (let i = start; i <= end; i++) timeline.push({ val: i, offset: 0 });
                                    } else {
                                        for (let i = start; i <= 12; i++) timeline.push({ val: i, offset: 0 });
                                        for (let i = 1; i <= end; i++) timeline.push({ val: i, offset: 1 });
                                    }

                                    return (
                                     <div className="bg-background border rounded-md p-4">
                                         <div className="flex justify-between items-center mb-4">
                                             <h5 className="text-sm font-medium">Cronograma de Pagos</h5>
                                             <div className="flex gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Año Actual</div>
                                                 {timeline.some(t => t.offset > 0) && (
                                                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: casColors.primary.orange }} /> Año Siguiente</div>
                                                 )}
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                                             {timeline.map((item, idx) => {
                                                 const m = MESES.find(m => m.val === item.val);
                                                 const isNextYear = item.offset > 0;
                                                 
                                                 return (
                                                     <div key={`${item.val}-${item.offset}`} className="flex flex-col items-center gap-2 min-w-[3rem] animate-in fade-in zoom-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                         <div 
                                                            className={`
                                                                relative w-10 h-10 rounded-md border flex items-center justify-center font-bold text-sm shadow-sm transition-all
                                                                ${isNextYear 
                                                                    ? 'text-white border-orange-700' 
                                                                    : 'bg-primary text-primary-foreground border-primary'
                                                                }
                                                            `}
                                                            style={isNextYear ? { backgroundColor: "#FF6B35" } : {}}
                                                         >
                                                            {idx + 1}
                                                            {isNextYear && (
                                                                <span 
                                                                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold shadow-sm border"
                                                                    style={{ color: "#FF6B35", borderColor: "#FF6B35" }}
                                                                >
                                                                    +1
                                                                </span>
                                                            )}
                                                         </div>
                                                         <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                                             {m?.label.substring(0, 3)}
                                                         </span>
                                                     </div>
                                                 )
                                             })}
                                         </div>
                                         
                                         <p className="text-xs text-muted-foreground text-right pt-2 border-t mt-2">
                                            Duración total: <strong>{available} meses</strong>.
                                         </p>
                                     </div>
                                    )
                                }}
                             />

                             <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <FileCheck className="w-4 h-4"/>
                                    <span>Define el periodo habilitado para pagos.</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="mesInicioHabilitado" children={(field: any) => (
                                        <div className="space-y-2">
                                            <Label>Mes Inicio</Label>
                                            <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(Number(val))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                    <form.Field name="mesFinHabilitado" children={(field: any) => (
                                        <div className="space-y-2">
                                            <Label>Mes Fin</Label>
                                            <Select value={String(field.state.value)} onValueChange={(val) => field.handleChange(Number(val))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                 </div>
                             </div>
                        </div>
                    ),
                    valor: () => (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                            <form.Subscribe 
                                selector={(state: any) => [state.values.mesInicioHabilitado, state.values.mesFinHabilitado]}
                                children={([start, end]: [number, number]) => {
                                    const available = end >= start ? (end - start + 1) : (12 - start + 1) + end;
                                    
                                    return (
                                        <form.Field name="montoCuotaFija" children={(field: any) => {
                                            // Logic Inversion: Slider controls Installments, Field stores Amount.
                                            
                                            // Calculate current installments based on stored Amount
                                            // If amount is 0/null (new), default to 1 installment.
                                            // Reverse Calc: Installments = ceil(Total / Amount)
                                            const currentAmount = Number(field.state.value) || montoTotal;
                                            
                                            // We calculate current "Installments" to show in slider position.
                                            // If amount matches perfectly with a divisor, great. If not, approximate.
                                            const rawInstallments = montoTotal > 0 ? Math.ceil(montoTotal / (currentAmount || 1)) : 1;
                                            
                                            // Constraint: Installments can't exceed available months (unless clearly misconfigured)
                                            // We clamp for slider display between 1 and available
                                            const sliderVal = Math.min(Math.max(rawInstallments, 1), available);
                                            
                                            // Derived Amount for display based on rounded slider val
                                            const displayAmount = Math.ceil(montoTotal / sliderVal);

                                            const handleSliderChange = (vals: number[]) => {
                                                const installments = vals[0];
                                                const newAmount = Math.ceil(montoTotal / installments);
                                                field.handleChange(newAmount);
                                            };

                                            return (
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center bg-background p-3 rounded border">
                                                        <div className="flex flex-col">
                                                            <Label className="text-base">Cantidad de Cuotas</Label>
                                                            <span className="text-xs text-muted-foreground">Define en cuántos pagos se divide el total</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-2xl font-bold text-primary">
                                                                {sliderVal} <span className="text-sm font-normal text-muted-foreground">cuotas</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <Slider 
                                                        defaultValue={[sliderVal]} 
                                                        max={available || 12} 
                                                        min={1} 
                                                        step={1}
                                                        onValueChange={handleSliderChange}
                                                        className="py-4"
                                                    />

                                                    <div className="bg-muted/50 p-3 rounded-md text-sm flex justify-between items-center">
                                                        <span className="text-muted-foreground">Valor de cada cuota:</span>
                                                        <span className="font-semibold text-lg">
                                                            ${displayAmount.toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        El sistema generará <strong>{sliderVal} cuotas</strong> fijas de <strong>${displayAmount.toLocaleString('es-AR')}</strong>
                                                    </p>
                                                </div>
                                            )
                                        }} />
                                    );
                                }}
                            />
                        </div>
                    ),
                    detalles: () => (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Settings2 className="w-4 h-4"/>
                                <span>Configuración final del cobro.</span>
                             </div>
                             <form.Field name="diaVencimiento" children={(field: any) => (
                                <div className="space-y-2">
                                    <Label>Día de Vencimiento Mensual</Label>
                                    <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar día" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[5, 10, 15, 20, 25].map(d => (
                                                <SelectItem key={d} value={String(d)}>Día {d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Fecha límite de pago para cada mes.</p>
                                </div>
                             )} />
                        </div>
                    )
                })}
             </div>

            {/* Local Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-muted/50">
                {!stepper.isFirst && (
                    <Button type="button" variant="outline" onClick={stepper.prev} size="sm">
                        Anterior
                    </Button>
                )}
                 {!stepper.isLast ? (
                     <Button type="button" onClick={stepper.next} size="sm">Siguiente</Button>
                 ) : (
                     <div className="flex items-center gap-2 text-primary text-sm font-medium animate-in fade-in">
                        <Button type="button" onClick={() => globalStepper.next()} className="gap-2">
                             Confirmar Configuración <CheckCircle2 className="w-4 h-4" />
                        </Button>
                     </div>
                 )}
            </div>
        </div>
    )
}

function StepRevision({ form }: { form: any }) {
    const values = form.state.values;
    const montoTotal = Number(values.montoTotal);
    const maxCuotas = Number(values.maxCuotas);
    const minCuotas = Number(values.minCuotas);
    
    // Logic for MONTO_DIVIDIDO
    const cuotaMaxVal = montoTotal / (minCuotas || 1);
    const cuotaMinVal = montoTotal / (maxCuotas || 1);

    // Logic for CUOTA_FIJA
    const montoCuotaFija = Number(values.montoCuotaFija);
    const cuotasEstimadas = Math.ceil(montoTotal / (montoCuotaFija || 1));

    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="rounded-lg border p-4 bg-muted/10">
                 <h4 className="font-semibold mb-2 text-lg">Resumen del Plan</h4>
                 <dl className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                         <dt className="text-muted-foreground">Nombre:</dt>
                         <dd className="font-medium">{values.nombreParaMostrar}</dd>
                     </div>
                     <div>
                         <dt className="text-muted-foreground">Monto Total:</dt>
                         <dd className="font-medium">${montoTotal.toLocaleString('es-AR')}</dd>
                     </div>
                     <div>
                         <dt className="text-muted-foreground">Vigencia:</dt>
                         <dd className="font-medium">{MESES.find(m=>m.val===values.mesInicioHabilitado)?.label} - {MESES.find(m=>m.val===values.mesFinHabilitado)?.label}</dd>
                     </div>
                     <div>
                         <dt className="text-muted-foreground">Vencimiento:</dt>
                         <dd className="font-medium">Día {values.diaVencimiento}</dd>
                     </div>
                 </dl>
             </div>
             
             <div className="space-y-2">
                 <h4 className="font-semibold text-sm">Simulación de Cuotas (Estrategia: {values.estrategia})</h4>
                 
                 {values.estrategia === EstrategiaPlan.MONTO_DIVIDIDO ? (
                     <div className="grid grid-cols-2 gap-4">
                         <Card>
                             <CardHeader className="p-4"><CardTitle className="text-base">{minCuotas} Cuotas</CardTitle></CardHeader>
                             <CardContent className="p-4 pt-0">
                                 <p className="text-2xl font-bold text-primary">${cuotaMaxVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes</p>
                                 <p className="text-xs text-muted-foreground">Opción más rápida</p>
                             </CardContent>
                         </Card>
                         <Card>
                             <CardHeader className="p-4"><CardTitle className="text-base">{maxCuotas} Cuotas</CardTitle></CardHeader>
                             <CardContent className="p-4 pt-0">
                                 <p className="text-2xl font-bold text-primary">${cuotaMinVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes</p>
                                 <p className="text-xs text-muted-foreground">Opción más extendida</p>
                             </CardContent>
                         </Card>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 gap-4">
                        <Card className="border-primary/50 bg-primary/5">
                             <CardHeader className="p-4"><CardTitle className="text-base">Cuota Fija Definida</CardTitle></CardHeader>
                             <CardContent className="p-4 pt-0 flex justify-between items-center">
                                 <div>
                                     <p className="text-3xl font-bold text-primary">${montoCuotaFija.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes</p>
                                     <p className="text-sm text-muted-foreground mt-1">Valor fijo para todos los inscritos</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-sm font-medium">Se completará en aprox.</p>
                                     <p className="text-2xl font-bold">{cuotasEstimadas} Cuotas</p>
                                 </div>
                             </CardContent>
                         </Card>
                     </div>
                 )}
             </div>
        </div>
    )
}

function InfoTooltip({ text }: { text: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
