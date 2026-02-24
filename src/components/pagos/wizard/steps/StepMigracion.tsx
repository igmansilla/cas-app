/**
 * Step Migración - Builder dinámico de políticas de transición.
 */
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Separator } from '../../../ui/separator';
import { Input } from '../../../ui/input';
import type { WizardStepProps } from '../wizard-types';
import { MESES } from '../wizard-types';
import { PlanTimelineChart } from '../../charts/PlanTimelineChart';
import { type ReglaTransicionRequest } from '../../../../api/schemas/pagos';

export function StepMigracion({ form }: WizardStepProps) {
    return (
        <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b">
                <div className="p-2 rounded-full bg-violet-100 text-violet-600">
                    <GitBranch className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Control de Pagos y Migraciones</h3>
                    <p className="text-xs text-muted-foreground">Define reglas automáticas para morosos</p>
                </div>
            </div>

            <form.Subscribe selector={(state: any) => state.values}>
                {(values: any) => {
                    const mesInicio = values.mesInicioHabilitado || 3;
                    const mesFin = values.mesFinHabilitado || 1;

                    return (
                        <>
                            {/* Gráfico principal */}
                            <Card className="border-2 mb-4">
                                <CardContent className="pt-4">
                                    <PlanTimelineChart
                                        mesInicio={mesInicio}
                                        mesFin={mesFin}
                                        reglas={values.reglasTransicion || []}
                                        interactivo={true}
                                    />
                                </CardContent>
                            </Card>

                            <form.Field name="reglasTransicion" mode="array">
                                {(field: any) => (
                                    <div className="space-y-4">
                                        {field.state.value?.map((_: any, i: number) => (
                                            <Card key={i} className="border border-violet-200 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                                                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-violet-50/50">
                                                    <div>
                                                        <CardTitle className="text-sm font-medium text-violet-900 border-none">
                                                            Regla {i + 1}
                                                        </CardTitle>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 shadow-none text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => field.removeValue(i)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
                                                    
                                                    {/* Destino */}
                                                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                                                        <form.Field name={`reglasTransicion[${i}].montoTotalDestino`}>
                                                            {(subField: any) => (
                                                                <div className="space-y-1 z-10">
                                                                    <Label className="text-xs font-semibold">Monto Total ($)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={subField.state.value || ''}
                                                                        onChange={(e) => subField.handleChange(Number(e.target.value))}
                                                                        placeholder="Ej: 500000"
                                                                    />
                                                                    {subField.state.meta.errors ? (
                                                                        <p className="text-[10px] text-red-500 mt-1">{subField.state.meta.errors.join(', ')}</p>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </form.Field>

                                                        <form.Field name={`reglasTransicion[${i}].codigoDestino`}>
                                                            {(subField: any) => (
                                                                <div className="space-y-1 z-10">
                                                                    <Label className="text-xs font-semibold">Código Plan (Opcional)</Label>
                                                                    <Input
                                                                        value={subField.state.value || ''}
                                                                        onChange={(e) => subField.handleChange(e.target.value)}
                                                                        placeholder="Ej: PLAN-B-2025"
                                                                    />
                                                                </div>
                                                            )}
                                                        </form.Field>
                                                    </div>

                                                    <Separator className="sm:col-span-2 my-1" />

                                                    {/* Condiciones */}
                                                    <form.Field name={`reglasTransicion[${i}].mesInicioControl`}>
                                                        {(subField: any) => (
                                                            <div className="space-y-1 z-10 w-full pt-1">
                                                                <Label className="text-xs font-semibold">A partir del mes...</Label>
                                                                <Select 
                                                                    value={subField.state.value ? String(subField.state.value) : undefined} 
                                                                    onValueChange={(v) => subField.handleChange(Number(v))}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Mes" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {MESES.map(m => (
                                                                            <SelectItem key={m.val} value={String(m.val)}>
                                                                                {m.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {subField.state.meta.errors ? (
                                                                    <p className="text-[10px] text-red-500 mt-1">{subField.state.meta.errors.join(', ')}</p>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`reglasTransicion[${i}].mesesAtrasoParaMigrar`}>
                                                        {(subField: any) => (
                                                            <div className="space-y-1 z-10 w-full pt-1">
                                                                <Label className="text-xs font-semibold">Con atrasos de...</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={subField.state.value || ''}
                                                                        onChange={(e) => subField.handleChange(Number(e.target.value))}
                                                                        className="w-20"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground whitespace-nowrap">Meses o más</span>
                                                                </div>
                                                                {subField.state.meta.errors ? (
                                                                    <p className="text-[10px] text-red-500 mt-1">{subField.state.meta.errors.join(', ')}</p>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </form.Field>

                                                    <form.Field name={`reglasTransicion[${i}].cuotasMinimasRequeridas`}>
                                                        {(subField: any) => (
                                                            <div className="space-y-1 sm:col-span-2 z-10">
                                                                <Label className="text-xs font-semibold">Exigir pago mínimo inicial de...</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={subField.state.value || ''}
                                                                        onChange={(e) => subField.handleChange(Number(e.target.value))}
                                                                        className="w-20"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground whitespace-nowrap">Cuotas en el mes de control</span>
                                                                </div>
                                                                 {subField.state.meta.errors ? (
                                                                    <p className="text-[10px] text-red-500 mt-1">{subField.state.meta.errors.join(', ')}</p>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </form.Field>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => field.pushValue({
                                                montoTotalDestino: 0,
                                                mesInicioControl: 7,
                                                cuotasMinimasRequeridas: 4,
                                                mesesAtrasoParaMigrar: 2
                                            } as ReglaTransicionRequest)}
                                            className="w-full border-dashed py-6"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Agregar Regla de Contingencia
                                        </Button>
                                    </div>
                                )}
                            </form.Field>
                        </>
                    );
                }}
            </form.Subscribe>
        </div>
    );
}
