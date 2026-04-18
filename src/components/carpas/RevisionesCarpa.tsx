import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Eye } from 'lucide-react';
import { useRevisionesByCarpa } from '../../hooks/useCarpas';
import { ESTADO_CARPA_CONFIG } from '../../api/schemas/carpas';
import type { Carpa, Revision } from '../../api/schemas/carpas';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FormRevision } from './FormRevision';
import { DetalleRevision } from './DetalleRevision';

interface RevisionesCarpaProps {
  carpa: Carpa;
  onVolver: () => void;
}

export function RevisionesCarpa({ carpa, onVolver }: RevisionesCarpaProps) {
  const { revisiones, cargando } = useRevisionesByCarpa(carpa.id);
  const [showFormRevision, setShowFormRevision] = useState(false);
  const [revisionDetalle, setRevisionDetalle] = useState<number | null>(null);

  if (revisionDetalle) {
    return (
      <DetalleRevision
        revisionId={revisionDetalle}
        onVolver={() => setRevisionDetalle(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={onVolver} className="self-start -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{carpa.nombre}</h2>
          {carpa.marca && (
            <p className="text-sm text-gray-500">
              {carpa.marca}
              {carpa.modelo ? ` - ${carpa.modelo}` : ''}
              {carpa.capacidad ? ` · ${carpa.capacidad} personas` : ''}
            </p>
          )}
        </div>
        <Button
          id="btn-nueva-revision"
          onClick={() => setShowFormRevision(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Revisión
        </Button>
      </div>

      {/* Lista de revisiones */}
      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : revisiones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aún no hay revisiones para esta carpa</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowFormRevision(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Cargar primera revisión
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {revisiones.map((revision) => (
            <RevisionCard
              key={revision.id}
              revision={revision}
              onVerDetalle={() => setRevisionDetalle(revision.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de nueva revisión */}
      <FormRevision
        open={showFormRevision}
        onClose={() => setShowFormRevision(false)}
        carpaId={carpa.id}
        carpaNombre={carpa.nombre}
      />
    </div>
  );
}

function RevisionCard({
  revision,
  onVerDetalle,
}: {
  revision: Revision;
  onVerDetalle: () => void;
}) {
  const estadoConfig = ESTADO_CARPA_CONFIG[revision.estadoGeneral];

  const componentesMalos = revision.componentes.filter(
    (c) => c.estado === 'MALO' || c.estado === 'FALTANTE',
  ).length;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onVerDetalle}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Badge className={`${estadoConfig.bgColor} ${estadoConfig.textColor} border-0`}>
            {estadoConfig.label}
          </Badge>
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(revision.fechaRevision).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400">
          <Eye className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {revision.revisorNombre && (
          <span>Revisó: <span className="font-medium text-gray-700">{revision.revisorNombre}</span></span>
        )}
        <span>{revision.componentes.length} componentes</span>
        {componentesMalos > 0 && (
          <span className="text-red-600 font-medium">
            ⚠ {componentesMalos} con problemas
          </span>
        )}
        {revision.fotos.length > 0 && (
          <span>📷 {revision.fotos.length} foto{revision.fotos.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {revision.observacionesGenerales && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {revision.observacionesGenerales}
        </p>
      )}
    </div>
  );
}
