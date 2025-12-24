/**
 * Lista de Planes Disponibles para Inscripción
 */

import { type PlanPago } from "../../api/schemas/pagos";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ListaPlanesDisponiblesProps {
  planes: PlanPago[];
  onInscribirse: (plan: PlanPago) => void;
}

export function ListaPlanesDisponibles({ planes, onInscribirse }: ListaPlanesDisponiblesProps) {
  if (planes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium">No hay planes disponibles</h3>
        <p className="text-muted-foreground">En este momento no hay planes de pago habilitados para inscripción.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {planes.map((plan) => (
        <Card key={plan.codigo} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">{plan.nombre}</CardTitle>
            <CardDescription>Plan anual {plan.anio}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Monto Total:</span>
                    <span className="text-lg font-bold">${plan.montoTotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cuotas:</span>
                     <Badge variant="outline">
                        {plan.minCuotas === plan.maxCuotas 
                          ? `${plan.maxCuotas} cuotas`
                          : `${plan.minCuotas} - ${plan.maxCuotas} cuotas`
                        }
                     </Badge>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vigencia:</span>
                    <span className="text-sm">{plan.mesInicio} - {plan.mesFin}</span>
                 </div>
             </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => onInscribirse(plan)}>
              Inscribirme
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
