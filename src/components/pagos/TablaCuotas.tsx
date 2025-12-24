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
  pagandoId: number | null; // secuencia of the installment currently being processed
}

export function TablaCuotas({ cuotas, onPagar, pagandoId }: TablaCuotasProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuota #</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Pago</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cuotas.length === 0 ? (
             <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                    No hay cuotas generadas.
                </TableCell>
             </TableRow>
          ) : (
             cuotas.map((cuota) => (
              <TableRow key={cuota.secuencia}>
                <TableCell className="font-medium">{cuota.secuencia}</TableCell>
                <TableCell>
                    {cuota.fechaVencimiento ? format(new Date(cuota.fechaVencimiento), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell className="font-bold">${Number(cuota.monto).toLocaleString('es-AR')}</TableCell>
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
                  {cuota.estado === 'PENDIENTE' || cuota.estado === 'VENCIDA' || cuota.estado === 'PLANIFICADA' ? (
                     <Button 
                        size="sm" 
                        onClick={() => onPagar(cuota)}
                        disabled={pagandoId === cuota.secuencia}
                     >
                        {pagandoId === cuota.secuencia ? "Procesando..." : "Pagar"}
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

