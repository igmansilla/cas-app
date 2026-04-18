import { useState } from 'react';
import { ArrowLeft, Calendar, User, Upload } from 'lucide-react';
import { useDetalleRevision, useSubirFotoRevision } from '../../hooks/useCarpas';
import {
  ESTADO_CARPA_CONFIG,
  ESTADO_COMPONENTE_CONFIG,
  TIPO_COMPONENTE_CONFIG,
} from '../../api/schemas/carpas';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GaleriaFotos } from './GaleriaFotos';
import { toast } from 'sonner';

interface DetalleRevisionProps {
  revisionId: number;
  onVolver: () => void;
}

export function DetalleRevision({ revisionId, onVolver }: DetalleRevisionProps) {
  const { revision, cargando } = useDetalleRevision(revisionId);
  const { subirFoto, cargando: subiendo } = useSubirFotoRevision();
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const handleSubirFotos = async (files: FileList | null) => {
    if (!files || !revision) return;
    setSubiendoFoto(true);

    try {
      for (const file of Array.from(files)) {
        await subirFoto({ revisionId: revision.id, file });
      }
      toast.success(
        files.length === 1
          ? 'Foto subida'
          : `${files.length} fotos subidas`,
      );
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!revision) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Revisión no encontrada</p>
        <Button variant="outline" onClick={onVolver} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const estadoConfig = ESTADO_CARPA_CONFIG[revision.estadoGeneral];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={onVolver} className="self-start -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            Revisión de {revision.carpaNombre}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(revision.fechaRevision).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {revision.revisorNombre && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {revision.revisorNombre}
              </span>
            )}
          </div>
        </div>
        <Badge
          className={`${estadoConfig.bgColor} ${estadoConfig.textColor} border-0 text-sm px-3 py-1`}
        >
          {estadoConfig.label}
        </Badge>
      </div>

      {/* Componentes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Estado de componentes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {revision.componentes.map((comp) => {
            const tipoConfig = TIPO_COMPONENTE_CONFIG[comp.tipoComponente];
            const estConfig = ESTADO_COMPONENTE_CONFIG[comp.estado];

            return (
              <div
                key={comp.id}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {tipoConfig?.label || comp.tipoComponente}
                  </p>
                  {comp.observacion && (
                    <p className="text-xs text-gray-500 mt-0.5">{comp.observacion}</p>
                  )}
                </div>
                <Badge
                  className={`${estConfig.bgColor} ${estConfig.textColor} border-0 shrink-0`}
                >
                  {estConfig.emoji} {estConfig.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observaciones generales */}
      {revision.observacionesGenerales && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Observaciones generales</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {revision.observacionesGenerales}
          </p>
        </div>
      )}

      {/* Fotos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Fotos ({revision.fotos.length})
          </h3>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleSubirFotos(e.target.files)}
              disabled={subiendo}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              asChild
            >
              <span>
                <Upload className="w-3.5 h-3.5 mr-1" />
                {subiendo ? 'Subiendo...' : 'Agregar fotos'}
              </span>
            </Button>
          </label>
        </div>
        <div className="p-4">
          {revision.fotos.length > 0 ? (
            <GaleriaFotos
              fotos={revision.fotos}
              revisionId={revision.id}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Aún no se subieron fotos</p>
              <p className="text-xs mt-1">
                Tocá &quot;Agregar fotos&quot; para subir imágenes de la revisión
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
