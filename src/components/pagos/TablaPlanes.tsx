/**
 * Tabla de Planes de Pago
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { type PlanPago } from "../../api/schemas/pagos";
import { PencilIcon, PowerIcon } from "lucide-react";

interface TablaPlanesProps {
  planes: PlanPago[];
  onEditar: (plan: PlanPago) => void;
  onToggleEstado?: (plan: PlanPago) => void;
}

export function TablaPlanes({ planes, onEditar, onToggleEstado }: TablaPlanesProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Cuotas</TableHead>
            <TableHead>Monto Total</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No hay planes configurados.
              </TableCell>
            </TableRow>
          ) : (
            planes.map((plan) => (
              <TableRow key={plan.codigo}>
                <TableCell className="font-medium">{plan.codigo}</TableCell>
                <TableCell>{plan.nombre}</TableCell>
                <TableCell>{plan.anio}</TableCell>
                <TableCell>
                  {plan.minCuotas === plan.maxCuotas 
                    ? plan.maxCuotas 
                    : `${plan.minCuotas} - ${plan.maxCuotas}`}
                </TableCell>
                <TableCell>${plan.montoTotal.toLocaleString()}</TableCell>
                <TableCell>{plan.mesInicio} - {plan.mesFin}</TableCell>
                <TableCell>
                  <Badge variant={plan.activo ? "default" : "secondary"}>
                    {plan.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditar(plan)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    {/* Toggle Activado logic could go here if supported by backend */}
                    {onToggleEstado && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={plan.activo ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                         onClick={() => onToggleEstado(plan)}
                      >
                         <PowerIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
