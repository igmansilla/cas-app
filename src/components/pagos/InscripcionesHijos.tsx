/**
 * Componente para que los padres vean las inscripciones de sus hijos.
 */
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInscripcionesHijos, useCrearIntencionPago } from '@/hooks/usePagos';
import { type Inscripcion, type Cuota, MetodoPago } from '@/api/schemas/pagos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, formatDate } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useState } from 'react';
import { toast } from 'sonner';
import { Users, CreditCard, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

function getEstadoBadge(estado: string) {
  switch (estado?.toUpperCase()) {
    case 'PAGADA':
    case 'REGULARIZADA':
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Pagada</Badge>;
    case 'ATRASADA':
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Atrasada</Badge>;
    case 'HABILITADA':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Del mes</Badge>;
    case 'PLANIFICADA':
    default:
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Planificada</Badge>;
  }
}

export function InscripcionesHijos() {
  const { inscripciones, cargando, error } = useInscripcionesHijos();
  const { crearIntencion, cargando: pagando } = useCrearIntencionPago();
  const [pagandoCuotaId, setPagandoCuotaId] = useState<number | null>(null);

  const handlePagarCuota = async (cuota: Cuota, idInscripcion: number) => {
    if (!cuota.id) {
      toast.error("Cuota sin identificador válido");
      return;
    }
    
    try {
      setPagandoCuotaId(cuota.id);
      const respuesta = await crearIntencion({
        idInscripcion,
        idsCuotas: [cuota.id],
        metodo: MetodoPago.MERCADOPAGO
      });
      
      if (respuesta.urlRedireccion) {
        window.location.href = respuesta.urlRedireccion;
      } else {
        toast.error("No se recibió link de pago");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al iniciar el pago");
    } finally {
      setPagandoCuotaId(null);
    }
  };

  // Loading state
  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return null; // Silent fail if no children or not a parent
  }

  // No children enrollments
  if (inscripciones.length === 0) {
    return null; // Don't show anything if no children enrollments
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Inscripciones de mis Hijos
        </CardTitle>
        <CardDescription>
          Podés ver y pagar las cuotas de tus hijos desde aquí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {inscripciones.map((inscripcion: Inscripcion) => (
            <AccordionItem key={inscripcion.idInscripcion} value={`inscripcion-${inscripcion.idInscripcion}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{inscripcion.nombrePlan || 'Plan de Pago'}</span>
                    <span className="text-sm text-muted-foreground">
                      {inscripcion.cuotasPagadas || 0} de {inscripcion.totalCuotas || inscripcion.cuotas.length} cuotas pagadas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inscripcion.cuotasVencidas && inscripcion.cuotasVencidas > 0 ? (
                      <Badge variant="destructive">{inscripcion.cuotasVencidas} atrasadas</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Al día</Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscripcion.cuotas.map((cuota: Cuota) => (
                      <TableRow key={cuota.id || cuota.secuencia}>
                        <TableCell className="font-medium">{cuota.secuencia}</TableCell>
                        <TableCell>{formatDate(cuota.fechaVencimiento)}</TableCell>
                        <TableCell>{formatMoney(cuota.monto)}</TableCell>
                        <TableCell>{getEstadoBadge(cuota.estado)}</TableCell>
                        <TableCell className="text-right">
                          {cuota.estado?.toUpperCase() !== 'PAGADA' && cuota.estado?.toUpperCase() !== 'REGULARIZADA' && cuota.estado?.toUpperCase() !== 'ATRASADA' && (
                            <Button
                              size="sm"
                              onClick={() => handlePagarCuota(cuota, inscripcion.idInscripcion)}
                              disabled={pagando || pagandoCuotaId === cuota.id}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              {pagandoCuotaId === cuota.id ? 'Procesando...' : 'Pagar'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
