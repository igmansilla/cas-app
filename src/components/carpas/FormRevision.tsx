import { useState } from 'react';
import { toast } from 'sonner';
import { useCrearRevision } from '../../hooks/useCarpas';
import {
  ESTADO_CARPA_CONFIG,
  ESTADO_COMPONENTE_CONFIG,
  TIPO_COMPONENTE_CONFIG,
  type EstadoCarpa,
  type EstadoComponente,
  type TipoComponente,
} from '../../api/schemas/carpas';
import type { ComponenteRevisionRequest } from '../../api/services/carpas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const TODOS_LOS_COMPONENTES: TipoComponente[] = [
  'CUERPO_TELA',
  'SOBRETECHO',
  'PARANTES_VARILLAS',
  'ESTACAS',
  'TENSORES_VIENTOS',
  'PISO_FOOTPRINT',
  'CIERRES',
  'BOLSA_FUNDA',
];

const ESTADOS_COMPONENTE: EstadoComponente[] = ['BUENO', 'REGULAR', 'MALO', 'FALTANTE'];
const ESTADOS_CARPA: EstadoCarpa[] = ['DISPONIBLE', 'NECESITA_REPARACION', 'FUERA_DE_SERVICIO'];

interface ComponenteForm {
  tipoComponente: TipoComponente;
  estado: EstadoComponente;
  observacion: string;
}

interface FormRevisionProps {
  open: boolean;
  onClose: () => void;
  carpaId: number;
  carpaNombre: string;
}

export function FormRevision({ open, onClose, carpaId, carpaNombre }: FormRevisionProps) {
  const { crearRevision, cargando } = useCrearRevision();

  const [fechaRevision, setFechaRevision] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [estadoGeneral, setEstadoGeneral] = useState<EstadoCarpa>('DISPONIBLE');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const [componentes, setComponentes] = useState<ComponenteForm[]>(
    TODOS_LOS_COMPONENTES.map((tipo) => ({
      tipoComponente: tipo,
      estado: 'BUENO' as EstadoComponente,
      observacion: '',
    })),
  );

  const handleComponenteEstado = (index: number, estado: EstadoComponente) => {
    const updated = [...componentes];
    updated[index] = { ...updated[index], estado };
    setComponentes(updated);
  };

  const handleComponenteObs = (index: number, observacion: string) => {
    const updated = [...componentes];
    updated[index] = { ...updated[index], observacion };
    setComponentes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const compData: ComponenteRevisionRequest[] = componentes.map((c) => ({
        tipoComponente: c.tipoComponente,
        estado: c.estado,
        observacion: c.observacion.trim() || undefined,
      }));

      await crearRevision(carpaId, {
        fechaRevision,
        estadoGeneral,
        observacionesGenerales: observacionesGenerales.trim() || undefined,
        componentes: compData,
      });

      toast.success('Revisión cargada correctamente');
      onClose();

      // Reset form
      setEstadoGeneral('DISPONIBLE');
      setObservacionesGenerales('');
      setComponentes(
        TODOS_LOS_COMPONENTES.map((tipo) => ({
          tipoComponente: tipo,
          estado: 'BUENO',
          observacion: '',
        })),
      );
    } catch {
      toast.error('Error al cargar la revisión');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Revisión — {carpaNombre}</DialogTitle>
          <DialogDescription>
            Completá el estado de cada componente de la carpa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha y estado general */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revision-fecha">Fecha de revisión</Label>
              <Input
                id="revision-fecha"
                type="date"
                value={fechaRevision}
                onChange={(e) => setFechaRevision(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estado general</Label>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_CARPA.map((est) => {
                  const config = ESTADO_CARPA_CONFIG[est];
                  const seleccionado = estadoGeneral === est;
                  return (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setEstadoGeneral(est)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        seleccionado
                          ? `${config.bgColor} ${config.textColor} ${config.borderColor} ring-2 ring-offset-1 ring-${config.color.replace('bg-', '')}`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Componentes */}
          <div className="space-y-3">
            <Label className="text-base">Componentes</Label>
            <div className="space-y-2">
              {componentes.map((comp, index) => {
                const tipoConfig = TIPO_COMPONENTE_CONFIG[comp.tipoComponente];
                const estadoConfig = ESTADO_COMPONENTE_CONFIG[comp.estado];

                return (
                  <div
                    key={comp.tipoComponente}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {tipoConfig.label}
                        </p>
                        <p className="text-xs text-gray-500">{tipoConfig.descripcion}</p>
                      </div>

                      {/* Selector de estado */}
                      <div className="flex gap-1.5 shrink-0">
                        {ESTADOS_COMPONENTE.map((est) => {
                          const estConfig = ESTADO_COMPONENTE_CONFIG[est];
                          const sel = comp.estado === est;
                          return (
                            <button
                              key={est}
                              type="button"
                              onClick={() => handleComponenteEstado(index, est)}
                              title={estConfig.label}
                              className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-base transition-all border ${
                                sel
                                  ? `${estConfig.bgColor} border-current ${estConfig.textColor} ring-1 ring-offset-1`
                                  : 'bg-white border-gray-200 hover:bg-gray-100 opacity-50'
                              }`}
                            >
                              {estConfig.emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Observación (visible si no es BUENO) */}
                    {comp.estado !== 'BUENO' && (
                      <div className="mt-2">
                        <Input
                          placeholder={`Observación sobre ${tipoConfig.label.toLowerCase()}...`}
                          value={comp.observacion}
                          onChange={(e) => handleComponenteObs(index, e.target.value)}
                          className="text-sm h-8"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones generales */}
          <div className="space-y-2">
            <Label htmlFor="revision-obs">Observaciones generales</Label>
            <Textarea
              id="revision-obs"
              placeholder="Notas adicionales sobre la carpa en general..."
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={cargando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={cargando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {cargando ? 'Guardando...' : 'Cargar Revisión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
