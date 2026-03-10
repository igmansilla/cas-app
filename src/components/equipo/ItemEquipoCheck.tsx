import { Check, Camera } from 'lucide-react';
import type { ItemEquipo } from '../../api/schemas/equipo';
import { CRITICIDAD_CONFIG } from '../../api/schemas/equipo';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface ItemEquipoCheckProps {
  item: ItemEquipo;
  completado: boolean;
  fotoResumen?: {
    cargadas: number;
    total: number;
  };
  onToggle: () => void;
  onPhotoClick?: (e: React.MouseEvent) => void;
  cargando?: boolean;
}

/**
 * Componente para un item individual del checklist con checkbox,
 * indicador de criticidad (dot), cantidad y notas.
 */
export function ItemEquipoCheck({ 
  item, 
  completado, 
  fotoResumen,
  onToggle, 
  onPhotoClick, 
  cargando 
}: ItemEquipoCheckProps) {
  const criticidadConfig = CRITICIDAD_CONFIG[item.criticidad];
  const esCritico = item.criticidad === 'CRITICO';
  const esImportante = item.criticidad === 'IMPORTANTE';
  const totalFotos = fotoResumen?.total ?? item.requisitosFoto.length;
  const fotosCargadas = fotoResumen?.cargadas ?? 0;
  const tieneFotosGuiadas = totalFotos > 0;
  const tieneFotosCargadas = fotosCargadas > 0;
  const faltanFotos = tieneFotosGuiadas && fotosCargadas < totalFotos;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer',
        'hover:bg-gray-50/80 active:scale-[0.995]',
        completado && 'bg-green-50/30',
        cargando && 'opacity-50 pointer-events-none'
      )}
      onClick={onToggle}
      role="checkbox"
      aria-checked={completado}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      {/* Checkbox con animación */}
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200',
          completado
            ? 'bg-green-500 border-green-500 text-white scale-105'
            : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105'
        )}
      >
        <Check 
          className={cn(
            'w-4 h-4 transition-all duration-200',
            completado ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          )} 
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dot de criticidad (solo para crítico e importante) */}
          {(esCritico || esImportante) && !completado && (
            <span
              className={cn(
                'flex-shrink-0 w-2 h-2 rounded-full',
                criticidadConfig.dotColor,
                esCritico && 'animate-pulse'
              )}
              title={criticidadConfig.label}
            />
          )}

          {/* Cantidad como pill */}
          {item.cantidad > 1 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {item.cantidad}x
            </span>
          )}

          {/* Nombre del item */}
          <span
            className={cn(
              'font-medium transition-colors',
              completado 
                ? 'text-gray-400 line-through decoration-gray-300' 
                : 'text-gray-900'
            )}
          >
            {item.nombre}
          </span>
        </div>

        {/* Notas */}
        {item.notas && (
          <p className={cn(
            'text-sm mt-0.5 italic',
            completado ? 'text-gray-300' : 'text-gray-500'
          )}>
            {item.notas}
          </p>
        )}

        {tieneFotosGuiadas && (
          <span className={cn(
            'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
            faltanFotos
              ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
              : 'text-green-700 bg-green-50 border-green-200'
          )}>
            <Camera className="w-3 h-3" />
            Fotos: {fotosCargadas}/{totalFotos}
          </span>
        )}

        {/* Advertencia de "Evitar" como badge */}
        {item.evitar && !completado && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            Evitar: {item.evitar}
          </span>
        )}
      </div>

      {/* Botón de Cámara */}
      {onPhotoClick && (
        <div className="flex-shrink-0 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              tieneFotosCargadas
                ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" 
                : faltanFotos
                  ? "text-orange-500 ring-2 ring-orange-300 hover:bg-orange-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onPhotoClick(e);
            }}
            title={tieneFotosGuiadas ? `Fotos del item (${fotosCargadas}/${totalFotos})` : 'Subir foto'}
          >
            <Camera className="h-4 w-4" />
          </Button>
          {tieneFotosCargadas && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
          )}
          {faltanFotos && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dot indicator de criticidad standalone
 */
export function CriticidadDot({ criticidad, size = 'sm' }: { criticidad: ItemEquipo['criticidad']; size?: 'sm' | 'md' }) {
  const config = CRITICIDAD_CONFIG[criticidad];
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  
  if (criticidad === 'NORMAL') return null;
  
  return (
    <span
      className={cn(
        'rounded-full',
        sizeClass,
        config.dotColor,
        config.pulseAnimation && 'animate-pulse'
      )}
      title={config.label}
    />
  );
}
