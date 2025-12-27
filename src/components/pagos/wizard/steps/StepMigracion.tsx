/**
 * Step Migración - Políticas de transición.
 */
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Card, CardContent } from '../../../ui/card';
import { GitBranch } from 'lucide-react';
import type { WizardStepProps } from '../wizard-types';
import { MESES } from '../wizard-types';
import { TimelinePreview } from '../components/TimelinePreview';

export function StepMigracion({ form }: WizardStepProps) {
    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-violet-100 text-violet-600">
                    <GitBranch className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Políticas de Migración</h3>
                    <p className="text-xs text-muted-foreground">Configura cuándo se activa la transición de Plan A a Plan B.</p>
                </div>
            </div>

            <form.Subscribe selector={(state: any) => state.values}>
                {(values: any) => (
                    <>
                        <TimelinePreview
                            start={values.mesInicioHabilitado || 3}
                            end={values.mesFinHabilitado || 1}
                            controlMonth={values.mesInicioControlAtraso}
                            toleranceMonths={values.mesesAtrasoParaTransicion}
                        />

                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                <div className="bg-primary/5 p-3 rounded-md text-sm border border-primary/20">
                                    <p className="font-medium text-primary mb-1">Lógica de Transición:</p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        A partir de <strong>{MESES.find(m => m.val === values.mesInicioControlAtraso)?.label}</strong>,
                                        se controlan los pagos. Para evitar migración, debe tener <strong>{values.cuotasMinimasAntesControl} cuotas</strong> pagas.
                                        Si acumula <strong>{values.mesesAtrasoParaTransicion} meses</strong> de deuda, migra al Plan B.
                                    </p>
                                </div>

                                <form.Field name="mesInicioControlAtraso">
                                    {(field: any) => (
                                        <div className="space-y-2">
                                            <Label>Mes de Inicio de Control</Label>
                                            <Select value={String(field.state.value)} onValueChange={(v) => field.handleChange(Number(v))}>
                                                <SelectTrigger className="w-full border-l-4 border-l-red-500"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {MESES.map(m => <SelectItem key={m.val} value={String(m.val)}>{m.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </form.Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field
                                        name="cuotasMinimasAntesControl"
                                        validators={{
                                            onChange: ({ value }: { value: number }) =>
                                                value < 1 ? 'Mínimo 1 cuota' : undefined
                                        }}
                                    >
                                        {(field: any) => (
                                            <div className="space-y-2">
                                                <Label>Cuotas Mínimas Pagas</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="icon" type="button"
                                                        onClick={() => field.handleChange(Math.max(1, field.state.value - 1))}>-</Button>
                                                    <span className="font-mono w-8 text-center">{field.state.value}</span>
                                                    <Button variant="outline" size="icon" type="button"
                                                        onClick={() => field.handleChange(Math.min(12, field.state.value + 1))}>+</Button>
                                                </div>
                                                {field.state.meta.errors?.length > 0 && (
                                                    <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                                                )}
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field
                                        name="mesesAtrasoParaTransicion"
                                        validators={{
                                            onChange: ({ value }: { value: number }) =>
                                                value < 1 ? 'Mínimo 1 mes' : undefined
                                        }}
                                    >
                                        {(field: any) => (
                                            <div className="space-y-2">
                                                <Label>Meses Atraso Tolerados</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="icon" type="button"
                                                        onClick={() => field.handleChange(Math.max(1, field.state.value - 1))}>-</Button>
                                                    <span className="font-mono w-8 text-center">{field.state.value}</span>
                                                    <Button variant="outline" size="icon" type="button"
                                                        onClick={() => field.handleChange(Math.min(6, field.state.value + 1))}>+</Button>
                                                </div>
                                                <p className="text-xs text-orange-600 font-medium">Zona de Tolerancia</p>
                                                {field.state.meta.errors?.length > 0 && (
                                                    <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
                                                )}
                                            </div>
                                        )}
                                    </form.Field>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </form.Subscribe>
        </div>
    );
}
