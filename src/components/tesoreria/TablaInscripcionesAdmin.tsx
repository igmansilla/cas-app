import { Eye, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { 
  type InscripcionAdmin,
  EstadoFinanciero,
  EstadoInscripcion
} from '../../api/schemas/pagos';
import { cn } from '../../lib/utils';

interface TablaInscripcionesAdminProps {
  inscripciones: InscripcionAdmin[];
  cargando: boolean;
  onVerDetalle: (inscripcion: InscripcionAdmin) => void;
}

/**
 * Main data grid for admin inscriptions.
 * Mobile-first: shows cards on mobile, table on desktop.
 */
export function TablaInscripcionesAdmin({ 
  inscripciones, 
  cargando, 
  onVerDetalle 
}: TablaInscripcionesAdminProps) {

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoFinancieroBadge = (estado: EstadoFinanciero) => {
    switch (estado) {
      case EstadoFinanciero.AL_DIA:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🟢 Al día</Badge>;
      case EstadoFinanciero.MOROSO:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">🔴 Moroso</Badge>;
      case EstadoFinanciero.MIGRADO:
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">⚠️ Migrado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getEstadoInscripcionBadge = (estado: EstadoInscripcion) => {
    switch (estado) {
      case EstadoInscripcion.ACTIVA:
        return <Badge variant="secondary">Activa</Badge>;
      case EstadoInscripcion.MOVIDA_PLAN_B:
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Plan B</Badge>;
      case EstadoInscripcion.CANCELADA:
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (cargando) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 md:h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (inscripciones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron inscripciones
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Cards layout */}
      <div className="md:hidden space-y-3">
        {inscripciones.map((inscripcion) => (
          <div
            key={inscripcion.idInscripcion}
            onClick={() => onVerDetalle(inscripcion)}
            className={cn(
              "border rounded-lg p-4 cursor-pointer active:bg-muted/50 transition-colors",
              inscripcion.estadoFinanciero === EstadoFinanciero.MOROSO && "border-red-200 bg-red-50/50",
              inscripcion.estadoFinanciero === EstadoFinanciero.MIGRADO && "border-orange-200 bg-orange-50/50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* User name and badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold truncate">{inscripcion.usuarioNombre}</span>
                  {getEstadoFinancieroBadge(inscripcion.estadoFinanciero)}
                </div>
                
                {/* Secondary info */}
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {inscripcion.usuarioDni || inscripcion.usuarioEmail || '—'}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-mono">{inscripcion.codigoPlan}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Cuotas:</span>
                    <span className={cn(
                      "font-medium",
                      inscripcion.cuotasPagadas === inscripcion.totalCuotas && "text-green-600"
                    )}>
                      {inscripcion.cuotasPagadas}/{inscripcion.totalCuotas}
                    </span>
                    {inscripcion.cuotasVencidas > 0 && (
                      <span className="text-red-600 text-xs font-medium">
                        ({inscripcion.cuotasVencidas} atras.)
                      </span>
                    )}
                  </div>
                </div>

                {/* Next due date */}
                {inscripcion.proximoVencimiento && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Próx. venc: {formatDate(inscripcion.proximoVencimiento)}
                  </p>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-center">Progreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Financiero</TableHead>
              <TableHead>Próx. Vencimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inscripciones.map((inscripcion) => (
              <TableRow 
                key={inscripcion.idInscripcion}
                className={cn(
                  inscripcion.estadoFinanciero === EstadoFinanciero.MOROSO && "bg-red-50/50",
                  inscripcion.estadoFinanciero === EstadoFinanciero.MIGRADO && "bg-orange-50/50"
                )}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{inscripcion.usuarioNombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {inscripcion.usuarioDni || inscripcion.usuarioEmail || '—'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{inscripcion.codigoPlan}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-medium",
                    inscripcion.cuotasPagadas === inscripcion.totalCuotas && "text-green-600"
                  )}>
                    {inscripcion.cuotasPagadas}/{inscripcion.totalCuotas}
                  </span>
                  {inscripcion.cuotasVencidas > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {inscripcion.cuotasVencidas} atrasadas
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {getEstadoInscripcionBadge(inscripcion.estadoInscripcion)}
                </TableCell>
                <TableCell>
                  {getEstadoFinancieroBadge(inscripcion.estadoFinanciero)}
                </TableCell>
                <TableCell>
                  {formatDate(inscripcion.proximoVencimiento)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVerDetalle(inscripcion)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
