/**
 * Tabla de Cuotas - Versión Rediseñada
 * 
 * Muestra cuotas separadas en 3 secciones:
 * 1. PAGABLES: cuotas PLANIFICADA o HABILITADA (se pueden pagar)
 * 2. PAGADAS: cuotas ya pagadas o regularizadas
 * 3. ATRASADAS: cuotas vencidas sin pago (solo lectura)
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
import { Checkbox } from "../ui/checkbox";
import { type Cuota } from "../../api/schemas/pagos";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface TablaCuotasProps {
  cuotas: Cuota[];
  onPagar: (cuotas: Cuota[]) => void;
  pagandoId: number | null;
  seleccionadas: number[]; // IDs de cuotas seleccionadas
  onSeleccionChange: (cuotaId: number, checked: boolean) => void;
  onSeleccionarTodas: (checked: boolean) => void;
}

// Helper para determinar si una cuota es pagable
const esCuotaPagable = (cuota: Cuota): boolean => {
  // Usar el campo esPagable del backend si está disponible
  if (cuota.esPagable !== undefined) return cuota.esPagable;
  // Fallback: PLANIFICADA o HABILITADA son pagables
  return cuota.estado === 'PLANIFICADA' || cuota.estado === 'HABILITADA';
};

// Helper para obtener variante del badge según estado
const getBadgeVariant = (estado: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (estado) {
    case 'PAGADA':
    case 'REGULARIZADA':
      return 'default';
    case 'ATRASADA':
      return 'destructive';
    case 'HABILITADA':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Helper para traducir estado al español
const traducirEstado = (estado: string): string => {
  switch (estado) {
    case 'PLANIFICADA': return 'Planificada';
    case 'HABILITADA': return 'Del mes';
    case 'ATRASADA': return 'Atrasada';
    case 'PAGADA': return 'Pagada';
    case 'REGULARIZADA': return 'Regularizada';
    default: return estado;
  }
};

export function TablaCuotas({ 
  cuotas, 
  onPagar, 
  pagandoId, 
  seleccionadas, 
  onSeleccionChange,
  onSeleccionarTodas 
}: TablaCuotasProps) {
  // Separar cuotas por categoría
  const cuotasPagables = cuotas.filter(esCuotaPagable);
  const cuotasPagadas = cuotas.filter(c => c.estado === 'PAGADA' || c.estado === 'REGULARIZADA');
  const cuotasAtrasadas = cuotas.filter(c => c.estado === 'ATRASADA');

  const todasSeleccionadas = cuotasPagables.length > 0 && 
    cuotasPagables.every(c => seleccionadas.includes(c.id!));

  const totalSeleccionado = cuotasPagables
    .filter(c => seleccionadas.includes(c.id!))
    .reduce((sum, c) => sum + Number(c.monto), 0);

  const cuotasSeleccionadas = cuotasPagables.filter(c => seleccionadas.includes(c.id!));

  return (
    <div className="space-y-6">
      {/* Alerta de cuotas atrasadas */}
      {cuotasAtrasadas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">
              Tenés {cuotasAtrasadas.length} cuota{cuotasAtrasadas.length > 1 ? 's' : ''} atrasada{cuotasAtrasadas.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Contactá a tesorería para regularizar tu situación.
            </p>
          </div>
        </div>
      )}

      {/* Sección: Cuotas Pagables */}
      {cuotasPagables.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Cuotas disponibles para pagar
            </h3>
            {cuotasSeleccionadas.length > 0 && (
              <Button 
                onClick={() => onPagar(cuotasSeleccionadas)}
                disabled={pagandoId !== null}
              >
                {pagandoId !== null ? "Procesando..." : `Pagar $${totalSeleccionado.toLocaleString('es-AR')}`}
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={todasSeleccionadas}
                      onCheckedChange={onSeleccionarTodas}
                    />
                  </TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotasPagables.map((cuota) => (
                  <TableRow key={cuota.id}>
                    <TableCell>
                      <Checkbox 
                        checked={seleccionadas.includes(cuota.id!)}
                        onCheckedChange={(checked) => onSeleccionChange(cuota.id!, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{cuota.secuencia}</TableCell>
                    <TableCell>
                      {cuota.fechaVencimiento ? format(new Date(cuota.fechaVencimiento), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-bold">${Number(cuota.monto).toLocaleString('es-AR')}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cuota.estado)}>
                        {traducirEstado(cuota.estado)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Sección: Cuotas Pagadas */}
      {cuotasPagadas.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Cuotas pagadas ({cuotasPagadas.length})
          </h3>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotasPagadas.map((cuota) => (
                  <TableRow key={cuota.id} className="bg-green-50/50">
                    <TableCell className="font-medium">#{cuota.secuencia}</TableCell>
                    <TableCell>
                      {cuota.fechaPago ? format(new Date(cuota.fechaPago), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-bold">${Number(cuota.monto).toLocaleString('es-AR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cuota.metodoPago || 'No especificado'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Sección: Cuotas Atrasadas */}
      {cuotasAtrasadas.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cuotas atrasadas ({cuotasAtrasadas.length})
          </h3>

          <div className="rounded-md border border-red-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50">
                  <TableHead>Cuota</TableHead>
                  <TableHead>Venció</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotasAtrasadas.map((cuota) => (
                  <TableRow key={cuota.id} className="bg-red-50/30">
                    <TableCell className="font-medium">#{cuota.secuencia}</TableCell>
                    <TableCell>
                      {cuota.fechaVencimiento ? format(new Date(cuota.fechaVencimiento), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-bold">${Number(cuota.monto).toLocaleString('es-AR')}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {traducirEstado(cuota.estado)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">
            Para regularizar estas cuotas, contactá a tesorería.
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {cuotas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay cuotas generadas.
        </div>
      )}
    </div>
  );
}

// Exportar versión legacy para compatibilidad (sin selección múltiple)
export function TablaCuotasSimple({ cuotas, onPagar, pagandoId }: {
  cuotas: Cuota[];
  onPagar: (cuota: Cuota) => void;
  pagandoId: number | null;
}) {
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
                  <Badge variant={getBadgeVariant(cuota.estado)}>
                    {traducirEstado(cuota.estado)}
                  </Badge>
                </TableCell>
                <TableCell>
                    {cuota.fechaPago ? format(new Date(cuota.fechaPago), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {esCuotaPagable(cuota) ? (
                     <Button 
                        size="sm" 
                        onClick={() => onPagar(cuota)}
                        disabled={pagandoId === cuota.secuencia}
                     >
                        {pagandoId === cuota.secuencia ? "Procesando..." : "Pagar"}
                     </Button>
                  ) : cuota.estado === 'PAGADA' || cuota.estado === 'REGULARIZADA' ? (
                     <span className="text-green-600 font-medium text-sm">Pagado</span>
                  ) : (
                     <span className="text-red-600 font-medium text-sm">Atrasada</span>
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
