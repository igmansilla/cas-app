/**
 * Modal de Inscripción a Plan
 * 
 * Simplificado: Las cuotas y mes de inicio están definidos por el plan,
 * el usuario solo confirma su inscripción.
 */

import { type PlanPago, type InscripcionRequest } from "../../api/schemas/pagos";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { CheckCircle2, Calendar, DollarSign, AlertTriangle } from "lucide-react";

interface ModalInscripcionProps {
  abierto: boolean;
  plan: PlanPago | null;
  cargando: boolean;
  idUsuario: string;
  onCerrar: () => void;
  onConfirmar: (datos: InscripcionRequest) => void;
}

const MESES_NUMERO: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const MESES_ENUM: Record<number, string> = {
  1: 'JANUARY', 2: 'FEBRUARY', 3: 'MARCH', 4: 'APRIL',
  5: 'MAY', 6: 'JUNE', 7: 'JULY', 8: 'AUGUST',
  9: 'SEPTEMBER', 10: 'OCTOBER', 11: 'NOVEMBER', 12: 'DECEMBER',
};

function getMesNombre(mes: string | number | undefined): string {
  if (mes === undefined || mes === null) return 'N/A';
  if (typeof mes === 'number') return MESES_NUMERO[mes] || `Mes ${mes}`;
  const mesUpper = mes.toUpperCase();
  const mesesMap: Record<string, string> = {
    'JANUARY': 'Enero', 'FEBRUARY': 'Febrero', 'MARCH': 'Marzo', 'APRIL': 'Abril',
    'MAY': 'Mayo', 'JUNE': 'Junio', 'JULY': 'Julio', 'AUGUST': 'Agosto',
    'SEPTEMBER': 'Septiembre', 'OCTOBER': 'Octubre', 'NOVEMBER': 'Noviembre', 'DECEMBER': 'Diciembre',
  };
  return mesesMap[mesUpper] || mes;
}

function getMesNumero(mes: string | number): number {
  if (typeof mes === 'number') return mes;
  const map: Record<string, number> = {
    'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
    'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
    'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12,
  };
  return map[mes.toUpperCase()] || 1;
}

export function ModalInscripcion({
  abierto,
  plan,
  cargando,
  idUsuario,
  onCerrar,
  onConfirmar,
}: ModalInscripcionProps) {
  if (!plan) return null;

  const mesActual = new Date().getMonth() + 1;
  const mesInicioPlan = getMesNumero(plan.mesInicio);
  
  // El mes de inicio es el mayor entre el mes inicio del plan y el mes actual
  // Si el plan empieza en Abril y estamos en Mayo, arrancamos en Mayo
  const mesInicioReal = Math.max(mesInicioPlan, mesActual);
  const mesInicioNombre = MESES_NUMERO[mesInicioReal];
  const mesInicioEnum = MESES_ENUM[mesInicioReal];
  
  // Las cuotas son fijas según el plan
  const cuotasTotales = plan.maxCuotas || 11;
  
  // Si arrancás tarde, ya tenés cuotas atrasadas
  const cuotasAtrasadas = mesInicioReal > mesInicioPlan ? mesInicioReal - mesInicioPlan : 0;

  // Verificar que el usuario esté autenticado
  const usuarioValido = idUsuario && idUsuario.trim().length > 0;

  const handleConfirmar = () => {
    if (!usuarioValido) {
      console.error('No se puede inscribir: idUsuario está vacío', { idUsuario });
      return;
    }
    onConfirmar({
      idUsuario,
      codigoPlan: plan.codigo,
      mesInicio: mesInicioEnum,
      cuotasDeseadas: cuotasTotales
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar inscripción</DialogTitle>
          <DialogDescription>
            Estás por inscribirte al <strong>{plan.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumen del plan */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">${Number(plan.montoTotal).toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Monto total del plan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{cuotasTotales} cuotas</p>
                <p className="text-sm text-muted-foreground">
                  De {getMesNombre(plan.mesInicio)} a {getMesNombre(plan.mesFin)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Tu primer pago: {mesInicioNombre}</p>
                <p className="text-sm text-muted-foreground">
                  Comenzarás a pagar desde este mes
                </p>
              </div>
            </div>
          </div>

          {/* Alerta si hay cuotas atrasadas */}
          {cuotasAtrasadas > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                  Atención: Inscripción tardía
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  El plan comenzó en {getMesNombre(plan.mesInicio)}. Al inscribirte ahora en {mesInicioNombre}, 
                  ya tendrás {cuotasAtrasadas} cuota{cuotasAtrasadas > 1 ? 's' : ''} pendiente{cuotasAtrasadas > 1 ? 's' : ''} de los meses anteriores.
                </p>
              </div>
            </div>
          )}

          {/* Error si el usuario no está autenticado */}
          {!usuarioValido && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 text-sm">
                  Error de autenticación
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  No se pudo obtener tu identificación de usuario. Por favor, cerrá sesión y volvé a ingresar.
                </p>
              </div>
            </div>
          )}

          {/* Términos */}
          <p className="text-xs text-muted-foreground text-center px-4">
            Al confirmar, aceptás las condiciones del plan de pago establecidas por el CAS.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={cargando || !usuarioValido}>
            {cargando ? "Procesando..." : "Confirmar inscripción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

