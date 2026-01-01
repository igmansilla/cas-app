import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { type Cuota } from '../../api/schemas/pagos';
import { useRegularizarCuota } from '../../hooks/usePagos';
import { toast } from 'sonner';

interface ModalRegularizacionProps {
  cuota: Cuota | null;
  open: boolean;
  onClose: () => void;
}

const METODOS_REGULARIZACION = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'DEPOSITO', label: 'Depósito Bancario' },
  { value: 'CONDONACION', label: 'Condonación' },
  { value: 'OTRO', label: 'Otro' }
];

/**
 * Modal para regularizar cuotas ATRASADAS.
 * 
 * Solo tesoreros/admins pueden usar esta funcionalidad.
 * Cambia el estado de ATRASADA a REGULARIZADA y decrementa
 * el contador de cuotas atrasadas en la inscripción.
 */
export function ModalRegularizacion({ cuota, open, onClose }: ModalRegularizacionProps) {
  const { regularizar, cargando } = useRegularizarCuota();
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!cuota?.id) return;

    try {
      await regularizar({
        idCuota: cuota.id,
        metodo,
        notas: notas.trim() || undefined
      });
      toast.success('Cuota regularizada correctamente');
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al regularizar la cuota');
    }
  };

  const handleClose = () => {
    setMetodo('EFECTIVO');
    setNotas('');
    onClose();
  };

  if (!cuota) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Regularizar Cuota Atrasada
          </DialogTitle>
          <DialogDescription>
            Cuota #{cuota.secuencia} - {formatCurrency(cuota.monto)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerta informativa */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
            <p className="text-orange-800">
              <strong>Vencida:</strong> {formatDate(cuota.fechaVencimiento)}
            </p>
            <p className="text-orange-700 mt-1">
              Esta acción marcará la cuota como REGULARIZADA y 
              decrementará el contador de cuotas atrasadas.
            </p>
          </div>

          {/* Monto (read-only) */}
          <div className="space-y-2">
            <Label>Monto a regularizar</Label>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(cuota.monto)}
            </div>
          </div>

          {/* Método de regularización */}
          <div className="space-y-2">
            <Label htmlFor="metodo">Método de Regularización</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS_REGULARIZACION.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas administrativas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Ej: Pagó en secretaría, se le condonó por beca, etc..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={cargando}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {cargando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Regularizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
