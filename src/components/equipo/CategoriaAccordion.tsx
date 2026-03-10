import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { CategoriaEquipo, FotoCargadaEquipo, ItemProgreso } from '../../api/schemas/equipo';
import { CRITICIDAD_CONFIG } from '../../api/schemas/equipo';
import { ItemEquipoCheck } from './ItemEquipoCheck';
import { cn } from '../../lib/utils';

interface CategoriaAccordionProps {
  categoria: CategoriaEquipo;
  progreso: Record<string, ItemProgreso>;
  fotosPorRequisito: Record<number, FotoCargadaEquipo>;
  onToggleItem: (itemId: number) => void;
  onPhotoClick: (item: CategoriaEquipo['items'][number]) => void;
  itemCargando?: number | null;
  defaultOpen?: boolean;
}

/**
 * Sección colapsable de una categoría (sin progress ring)
 */
export function CategoriaAccordion({
  categoria,
  progreso,
  fotosPorRequisito,
  onToggleItem,
  onPhotoClick,
  itemCargando,
  defaultOpen = false,
}: CategoriaAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Calcular progreso de la categoría
  const totalItems = categoria.items.length;
  const completados = categoria.items.filter(
    (item) => progreso[item.id]?.completado
  ).length;
  const todoCompleto = completados === totalItems && totalItems > 0;

  // Contar items críticos e importantes faltantes
  const criticosFaltantes = categoria.items.filter(
    (item) => item.criticidad === 'CRITICO' && !progreso[item.id]?.completado
  ).length;
  const importantesFaltantes = categoria.items.filter(
    (item) => item.criticidad === 'IMPORTANTE' && !progreso[item.id]?.completado
  ).length;

  // Determinar color del borde izquierdo
  const getBorderColor = () => {
    if (todoCompleto) return 'border-l-green-500';
    if (criticosFaltantes > 0) return 'border-l-red-500';
    if (importantesFaltantes > 0) return 'border-l-orange-500';
    return 'border-l-gray-200';
  };

  return (
    <div 
      className={cn(
        'border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm',
        'border-l-4 transition-all duration-200',
        getBorderColor(),
        isOpen && 'shadow-md'
      )}
    >
      {/* Header clickeable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-gray-50/50',
          todoCompleto && 'bg-green-50/30'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Ícono de expandir/colapsar con rotación */}
          <ChevronDown 
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0',
              isOpen && 'rotate-180'
            )} 
          />

          {/* Nombre de la categoría */}
          <h3 className="font-semibold text-gray-900 truncate">{categoria.nombre}</h3>

          {/* Dots de críticos/importantes faltantes */}
          <div className="flex items-center gap-2">
            {criticosFaltantes > 0 && (
              <div className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full animate-pulse', CRITICIDAD_CONFIG.CRITICO.dotColor)} />
                <span className="text-xs text-red-600 font-medium">{criticosFaltantes}</span>
              </div>
            )}
            {importantesFaltantes > 0 && (
              <div className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', CRITICIDAD_CONFIG.IMPORTANTE.dotColor)} />
                <span className="text-xs text-orange-600 font-medium">{importantesFaltantes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contador simple o checkmark */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {todoCompleto ? (
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Check className="w-4 h-4" />
              Listo
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              {completados}/{totalItems}
            </span>
          )}
        </div>
      </button>

      {/* Lista de items (colapsable con animación) */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {categoria.items.map((item) => {
            const fotoResumen = {
              cargadas: item.requisitosFoto.filter((requisito) => fotosPorRequisito[requisito.id]).length,
              total: item.requisitosFoto.length,
            };

            return (
            <ItemEquipoCheck
              key={item.id}
              item={item}
              completado={progreso[item.id]?.completado || false}
              fotoResumen={fotoResumen}
              onToggle={() => onToggleItem(item.id)}
              onPhotoClick={item.requisitosFoto.length > 0 ? () => onPhotoClick(item) : undefined}
              cargando={itemCargando === item.id}
            />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Card de categoría para vista desktop (grid) - sin progress ring
 */
export function CategoriaCard({
  categoria,
  progreso,
  onClick,
}: {
  categoria: CategoriaEquipo;
  progreso: Record<string, ItemProgreso>;
  onClick: () => void;
}) {
  const totalItems = categoria.items.length;
  const completados = categoria.items.filter(
    (item) => progreso[item.id]?.completado
  ).length;
  const todoCompleto = completados === totalItems && totalItems > 0;

  const criticosFaltantes = categoria.items.filter(
    (item) => item.criticidad === 'CRITICO' && !progreso[item.id]?.completado
  ).length;
  const importantesFaltantes = categoria.items.filter(
    (item) => item.criticidad === 'IMPORTANTE' && !progreso[item.id]?.completado
  ).length;

  const getBorderColor = () => {
    if (todoCompleto) return 'border-l-green-500';
    if (criticosFaltantes > 0) return 'border-l-red-500';
    if (importantesFaltantes > 0) return 'border-l-orange-500';
    return 'border-l-gray-300';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 bg-white border border-gray-200 rounded-xl text-left',
        'border-l-4 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        getBorderColor(),
        todoCompleto && 'bg-green-50/30'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{categoria.nombre}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{completados} de {totalItems}</p>
        </div>

        {todoCompleto && (
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>

      {/* Indicadores de faltantes */}
      {(criticosFaltantes > 0 || importantesFaltantes > 0) && (
        <div className="flex items-center gap-3 mt-3">
          {criticosFaltantes > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600">{criticosFaltantes} críticos</span>
            </div>
          )}
          {importantesFaltantes > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs text-orange-600">{importantesFaltantes}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
