/**
 * Tabla de Cuotas
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
import { type Cuota } from "../../api/schemas/pagos";
import { format } from "date-fns";

interface TablaCuotasProps {
  cuotas: Cuota[];
  onPagar: (cuota: Cuota) => void;
  pagandoId: number | null; // ID of the installment currently being processed
}

export function TablaCuotas({ cuotas, onPagar, pagandoId }: TablaCuotasProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuota #</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Monto Recalculado</TableHead>
            <TableHead>Monto Original</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Pago</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cuotas.length === 0 ? (
             <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                    No hay cuotas generadas.
                </TableCell>
             </TableRow>
          ) : (
             cuotas.map((cuota) => (
              <TableRow key={cuota.nroCuota}>
                <TableCell className="font-medium">{cuota.nroCuota}</TableCell>
                <TableCell>
                    {cuota.vencimiento ? format(new Date(cuota.vencimiento), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell className="font-bold">${cuota.montoActual.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground line-through text-xs">
                    ${cuota.montoOriginal.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    cuota.estado === 'PAGADA' ? 'default' :
                    cuota.estado === 'VENCIDA' ? 'destructive' : 'secondary'
                  }>
                    {cuota.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                    {cuota.fechaPago ? format(new Date(cuota.fechaPago), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {cuota.estado === 'PENDIENTE' || cuota.estado === 'VENCIDA' ? (
                     <Button 
                        size="sm" 
                        onClick={() => onPagar(cuota)}
                        disabled={pagandoId === cuota.nroCuota}
                     >
                        {pagandoId === cuota.nroCuota ? "Procesando..." : "Pagar"}
                     </Button>
                  ) : (
                     <span className="text-green-600 font-medium text-sm">Pagado</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
