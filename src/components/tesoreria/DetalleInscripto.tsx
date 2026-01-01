import { useState } from 'react';
import { Mail, Phone, User, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TimelineCuotas } from './TimelineCuotas';
import { ModalPagoManual } from './ModalPagoManual';
import { ModalRegularizacion } from './ModalRegularizacion';
import { useCuotas } from '../../hooks/usePagos';
import { Skeleton } from '../ui/skeleton';
import { 
  type InscripcionAdmin, 
  type Cuota,
  EstadoFinanciero,
  EstadoInscripcion
} from '../../api/schemas/pagos';

interface DetalleInscriptoProps {
  inscripcion: InscripcionAdmin | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Side sheet showing detailed inscription info.
 * Includes user data, migration history, and installments timeline.
 */
export function DetalleInscripto({ inscripcion, open, onClose }: DetalleInscriptoProps) {
  const { cuotas, cargando: cargandoCuotas } = useCuotas(inscripcion?.idInscripcion || null);
  const [cuotaParaPagar, setCuotaParaPagar] = useState<Cuota | null>(null);
  const [cuotaParaRegularizar, setCuotaParaRegularizar] = useState<Cuota | null>(null);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleClose = () => {
    setCuotaParaPagar(null);
    setCuotaParaRegularizar(null);
    onClose();
  };

  if (!inscripcion) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          <div className="p-6 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {inscripcion.usuarioNombre}
              </SheetTitle>
              <SheetDescription>
                Inscripción #{inscripcion.idInscripcion} - {inscripcion.nombrePlan}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 pb-8 space-y-6">
            {/* User contact info */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Datos de Contacto
              </h3>
              <div className="space-y-2 text-sm">
                {inscripcion.usuarioEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${inscripcion.usuarioEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inscripcion.usuarioEmail}
                    </a>
                  </div>
                )}
                {inscripcion.usuarioTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`tel:${inscripcion.usuarioTelefono}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inscripcion.usuarioTelefono}
                    </a>
                  </div>
                )}
                {inscripcion.usuarioDni && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>DNI: {inscripcion.usuarioDni}</span>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Inscription status */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Estado de Inscripción
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <p className="font-medium">{inscripcion.codigoPlan}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha inscripción:</span>
                  <p className="font-medium">{formatDate(inscripcion.fechaInscripcion)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <div className="mt-1">
                    {inscripcion.estadoInscripcion === EstadoInscripcion.ACTIVA && (
                      <Badge variant="secondary">Activa</Badge>
                    )}
                    {inscripcion.estadoInscripcion === EstadoInscripcion.MOVIDA_PLAN_B && (
                      <Badge className="bg-orange-100 text-orange-800">Migrada Plan B</Badge>
                    )}
                    {inscripcion.estadoInscripcion === EstadoInscripcion.CANCELADA && (
                      <Badge variant="destructive">Cancelada</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Financiero:</span>
                  <div className="mt-1">
                    {inscripcion.estadoFinanciero === EstadoFinanciero.AL_DIA && (
                      <Badge className="bg-green-100 text-green-800">🟢 Al día</Badge>
                    )}
                    {inscripcion.estadoFinanciero === EstadoFinanciero.MOROSO && (
                      <Badge variant="destructive">🔴 Moroso</Badge>
                    )}
                    {inscripcion.estadoFinanciero === EstadoFinanciero.MIGRADO && (
                      <Badge className="bg-orange-100 text-orange-800">⚠️ Migrado</Badge>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Migration history */}
            {inscripcion.fechaMigracion && (
              <>
                <Separator />
                <section className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-800">
                        Migrado a Plan B
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Este usuario fue migrado automáticamente al Plan B el{' '}
                        <strong>{formatDate(inscripcion.fechaMigracion)}</strong> debido a morosidad.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* Payment summary */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Resumen de Pagos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(inscripcion.montoPagado)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pagado</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(inscripcion.montoRestante)}
                  </p>
                  <p className="text-xs text-muted-foreground">Restante</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {inscripcion.cuotasPagadas}/{inscripcion.totalCuotas}
                  </p>
                  <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
                </div>
                {inscripcion.cuotasVencidas > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">
                      {inscripcion.cuotasVencidas}
                    </p>
                    <p className="text-xs text-red-600 font-medium">Atrasadas</p>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Installments timeline */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                Cronograma de Cuotas
              </h3>
              {cargandoCuotas ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <TimelineCuotas 
                  cuotas={cuotas} 
                  onPagarManual={setCuotaParaPagar}
                  onRegularizar={setCuotaParaRegularizar}
                />
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manual payment modal */}
      <ModalPagoManual
        cuota={cuotaParaPagar}
        open={!!cuotaParaPagar}
        onClose={() => setCuotaParaPagar(null)}
      />

      {/* Regularization modal for overdue installments */}
      <ModalRegularizacion
        cuota={cuotaParaRegularizar}
        open={!!cuotaParaRegularizar}
        onClose={() => setCuotaParaRegularizar(null)}
      />
    </>
  );
}
