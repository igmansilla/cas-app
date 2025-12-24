/**
 * Mi Plan de Pago - Componente principal para visualización del plan inscripto
 * 
 * Secciones:
 * 1. Resumen del Plan con progreso visual
 * 2. Stepper explicativo de transición Plan A → B
 * 3. Lista de cuotas pagables
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  ArrowRight,
  Info
} from "lucide-react";
import { type Inscripcion, type Cuota } from "../../api/schemas/pagos";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Mapa de meses en español
const MESES_ES: Record<string, string> = {
  JANUARY: 'Enero',
  FEBRUARY: 'Febrero', 
  MARCH: 'Marzo',
  APRIL: 'Abril',
  MAY: 'Mayo',
  JUNE: 'Junio',
  JULY: 'Julio',
  AUGUST: 'Agosto',
  SEPTEMBER: 'Septiembre',
  OCTOBER: 'Octubre',
  NOVEMBER: 'Noviembre',
  DECEMBER: 'Diciembre',
};

const MESES_NUMERO: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

interface MiPlanPagoProps {
  inscripcion: Inscripcion;
  onPagarCuota: (cuota: Cuota) => void;
  pagandoCuotaId: number | null;
}

export function MiPlanPago({ inscripcion, onPagarCuota, pagandoCuotaId }: MiPlanPagoProps) {
  const cuotasOrdenadas = [...inscripcion.cuotas].sort((a, b) => a.secuencia - b.secuencia);

  return (
    <div className="space-y-6">
      {/* Sección 1: Resumen del Plan */}
      <ResumenPlan inscripcion={inscripcion} />
      
      {/* Sección 2: Stepper de Transición (solo si hay reglas definidas) */}
      {inscripcion.mesInicioControlAtraso && (
        <StepperTransicion inscripcion={inscripcion} />
      )}
      
      {/* Sección 3: Lista de Cuotas */}
      <ListaCuotas 
        cuotas={cuotasOrdenadas} 
        onPagar={onPagarCuota}
        pagandoId={pagandoCuotaId}
      />
    </div>
  );
}

// ============================================================
// Sección 1: Resumen del Plan
// ============================================================

function ResumenPlan({ inscripcion }: { inscripcion: Inscripcion }) {
  const {
    nombrePlan,
    estado,
    mesAlta,
    cuotasPagadas = 0,
    totalCuotas = 0,
    montoPagado = 0,
    montoTotal = 0,
    cuotasVencidas = 0,
  } = inscripcion;

  const progreso = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
  // mesAlta puede venir como string ("DECEMBER") o número (12)
  const mesAltaEs = mesAlta 
    ? (typeof mesAlta === 'number' 
        ? MESES_NUMERO[mesAlta] || `Mes ${mesAlta}`
        : MESES_ES[mesAlta] || mesAlta
      ) 
    : 'N/A';

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
      
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              {nombrePlan || 'Mi Plan de Pago'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Inscripto desde <span className="font-medium">{mesAltaEs}</span>
            </p>
          </div>
          <Badge 
            variant={estado === 'ACTIVA' ? 'default' : 'secondary'}
            className="w-fit text-sm px-3 py-1"
          >
            {estado}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de Progreso */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progreso de pagos</span>
            <span className="font-bold text-primary">{Math.round(progreso)}%</span>
          </div>
          <Progress value={progreso} className="h-3" />
        </div>
        
        <Separator />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            label="Cuotas Pagadas"
            value={`${cuotasPagadas} de ${totalCuotas}`}
          />
          <StatCard 
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            label="Cuotas Restantes"
            value={String(totalCuotas - cuotasPagadas)}
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            label="Monto Pagado"
            value={`$${Number(montoPagado).toLocaleString('es-AR')}`}
          />
          <StatCard 
            icon={cuotasVencidas > 0 ? <AlertTriangle className="w-5 h-5 text-orange-500" /> : <Calendar className="w-5 h-5 text-muted-foreground" />}
            label="Monto Restante"
            value={`$${Number(montoTotal - montoPagado).toLocaleString('es-AR')}`}
            highlight={cuotasVencidas > 0}
          />
        </div>
        
        {/* Alerta si hay cuotas vencidas */}
        {cuotasVencidas > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Tenés {cuotasVencidas} cuota{cuotasVencidas > 1 ? 's' : ''} vencida{cuotasVencidas > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Te recomendamos regularizar tu situación lo antes posible.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  highlight = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border ${
      highlight 
        ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' 
        : 'border-border bg-muted/30'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}

// ============================================================
// Sección 2: Stepper de Transición Plan A → B
// ============================================================

function StepperTransicion({ inscripcion }: { inscripcion: Inscripcion }) {
  const {
    mesInicioControlAtraso,
    cuotasMinimasAntesControl,
    mesesAtrasoParaTransicion,
    cuotasPagadas = 0,
    planDestinoCodigo,
  } = inscripcion;

  if (!mesInicioControlAtraso || !cuotasMinimasAntesControl) return null;

  const mesControl = MESES_NUMERO[mesInicioControlAtraso] || `Mes ${mesInicioControlAtraso}`;
  const cuotasFaltantes = cuotasMinimasAntesControl - cuotasPagadas;
  const enBuenEstado = cuotasPagadas >= cuotasMinimasAntesControl;

  return (
    <Card className="border-violet-200 dark:border-violet-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="w-5 h-5 text-violet-600" />
          ¿Cómo funciona tu Plan?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stepper Visual */}
        <div className="flex items-center justify-between gap-2 py-4 px-2 overflow-x-auto">
          {/* Paso 1: Pagos al día */}
          <StepperPaso 
            numero={1}
            titulo="Pagos al día"
            descripcion={`${cuotasMinimasAntesControl} cuotas antes de ${mesControl}`}
            estado={enBuenEstado ? 'completado' : 'pendiente'}
          />
          
          <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
          
          {/* Paso 2: Mes de Control */}
          <StepperPaso 
            numero={2}
            titulo="Control"
            descripcion={mesControl}
            estado="info"
            highlight
          />
          
          <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
          
          {/* Paso 3: Tolerancia */}
          <StepperPaso 
            numero={3}
            titulo="Tolerancia"
            descripcion={`${mesesAtrasoParaTransicion} meses`}
            estado="warning"
          />
          
          <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
          
          {/* Paso 4: Plan B */}
          <StepperPaso 
            numero={4}
            titulo={planDestinoCodigo || "Plan B"}
            descripcion="Migración"
            estado="danger"
          />
        </div>
        
        <Separator />
        
        {/* Estado actual del usuario */}
        <div className={`p-4 rounded-lg ${
          enBuenEstado 
            ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
            : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
        }`}>
          <p className="font-medium flex items-center gap-2">
            {enBuenEstado ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">¡Vas muy bien!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-200">Atención</span>
              </>
            )}
          </p>
          <p className="text-sm mt-1 text-muted-foreground">
            {enBuenEstado 
              ? `Ya tenés ${cuotasPagadas} cuotas pagadas. Cumplís con el mínimo de ${cuotasMinimasAntesControl} antes de ${mesControl}.`
              : `Te faltan ${cuotasFaltantes} cuota${cuotasFaltantes > 1 ? 's' : ''} para cumplir el mínimo de ${cuotasMinimasAntesControl} antes de ${mesControl}.`
            }
          </p>
        </div>
        
        {/* Explicación detallada */}
        <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-md">
          <p>• A partir de <strong>{mesControl}</strong>, comenzamos a controlar los pagos.</p>
          <p>• Si acumulás más de <strong>{mesesAtrasoParaTransicion} meses</strong> de atraso, pasarás al {planDestinoCodigo || 'Plan B'}.</p>
          <p>• Los valores de este plan fueron configurados por el tesorero.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepperPaso({ 
  numero, 
  titulo, 
  descripcion, 
  estado,
  highlight = false
}: { 
  numero: number; 
  titulo: string; 
  descripcion: string;
  estado: 'completado' | 'pendiente' | 'info' | 'warning' | 'danger';
  highlight?: boolean;
}) {
  const colorClasses = {
    completado: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300',
    pendiente: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300',
    info: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300',
    warning: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300',
    danger: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300',
  };

  return (
    <div className={`flex flex-col items-center text-center min-w-[5rem] ${highlight ? 'scale-110' : ''}`}>
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${colorClasses[estado]}`}>
        {estado === 'completado' ? <CheckCircle2 className="w-5 h-5" /> : numero}
      </div>
      <span className="text-xs font-medium mt-2">{titulo}</span>
      <span className="text-[10px] text-muted-foreground">{descripcion}</span>
    </div>
  );
}

// ============================================================
// Sección 3: Lista de Cuotas
// ============================================================

function ListaCuotas({ 
  cuotas, 
  onPagar, 
  pagandoId 
}: { 
  cuotas: Cuota[]; 
  onPagar: (cuota: Cuota) => void;
  pagandoId: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Mis Cuotas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cuotas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay cuotas generadas.
            </p>
          ) : (
            cuotas.map((cuota) => (
              <CuotaCard 
                key={cuota.secuencia} 
                cuota={cuota} 
                onPagar={onPagar}
                pagando={pagandoId === cuota.secuencia}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CuotaCard({ 
  cuota, 
  onPagar,
  pagando 
}: { 
  cuota: Cuota; 
  onPagar: (cuota: Cuota) => void;
  pagando: boolean;
}) {
  const isPagada = cuota.estado === 'PAGADA';
  const isVencida = cuota.estado === 'VENCIDA';
  
  const fechaVenc = cuota.fechaVencimiento 
    ? format(new Date(cuota.fechaVencimiento), "d 'de' MMMM", { locale: es })
    : 'Sin fecha';
  
  const fechaPago = cuota.fechaPago 
    ? format(new Date(cuota.fechaPago), "dd/MM/yyyy", { locale: es })
    : null;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
      isPagada 
        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
        : isVencida 
          ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
          : 'bg-card border-border hover:bg-muted/50'
    }`}>
      <div className="flex items-center gap-4">
        {/* Número de cuota */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          isPagada 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : isVencida 
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              : 'bg-primary/10 text-primary'
        }`}>
          {isPagada ? <CheckCircle2 className="w-5 h-5" /> : `#${cuota.secuencia}`}
        </div>
        
        {/* Info de la cuota */}
        <div>
          <p className="font-medium">
            Cuota {cuota.secuencia}
            {isPagada && <span className="text-green-600 ml-2">✓ Pagada</span>}
          </p>
          <p className="text-sm text-muted-foreground">
            {isPagada && fechaPago
              ? `Pagada el ${fechaPago}`
              : `Vence: ${fechaVenc}`
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Monto */}
        <div className="text-right">
          <p className="font-bold text-lg">
            ${Number(cuota.monto).toLocaleString('es-AR')}
          </p>
        </div>
        
        {/* Badge de estado o botón de pagar */}
        {isPagada ? (
          <Badge variant="default" className="bg-green-600">
            Pagada
          </Badge>
        ) : (
          <Button 
            size="sm" 
            variant={isVencida ? "destructive" : "default"}
            onClick={() => onPagar(cuota)}
            disabled={pagando}
          >
            {pagando ? "Procesando..." : "Pagar"}
          </Button>
        )}
      </div>
    </div>
  );
}
