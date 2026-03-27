import { useState } from 'react';
import { AlertTriangle, RotateCcw, Backpack, Check } from 'lucide-react';
import { toast } from 'sonner';

import { useCategorias, useMiProgreso, useToggleItem, useResetearChecklist, useMisFotosEquipo } from '../../hooks/useEquipo';
import { CategoriaAccordion, CategoriaCard } from './CategoriaAccordion';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ItemEquipoCheck } from './ItemEquipoCheck';
import { FotoItemUpload } from './FotoItemUpload';
import type { CategoriaEquipo, ItemEquipo } from '../../api/schemas/equipo';

/**
 * Componente de progreso circular grande para el header
 */
export function HeaderProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          className="text-white/20"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-white transition-all duration-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

/**
 * Componente del checklist oficial de equipo
 */
export function ChecklistOficial() {
  const { categorias, cargando: cargandoCategorias, error: errorCategorias } = useCategorias();
  const { progreso, cargando: cargandoProgreso } = useMiProgreso();
  const { fotos, refetch: refetchFotos } = useMisFotosEquipo();
  const { toggleItem } = useToggleItem();
  const { resetear, cargando: reseteando } = useResetearChecklist();

  const [itemCargando, setItemCargando] = useState<number | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaEquipo | null>(null);
  const [itemSeleccionadoParaFoto, setItemSeleccionadoParaFoto] = useState<ItemEquipo | null>(null);
  const fotosPorRequisito = Object.fromEntries(fotos.map((foto) => [foto.requisitoId, foto]));

  const getFotoResumen = (item: ItemEquipo) => ({
    cargadas: item.requisitosFoto.filter((requisito) => fotosPorRequisito[requisito.id]).length,
    total: item.requisitosFoto.length,
  });

  // Manejar toggle de item
  const handleToggleItem = async (itemId: number) => {
    setItemCargando(itemId);
    try {
      await toggleItem(itemId);
    } catch (error) {
      console.error('Error al marcar item:', error);
      toast.error('Error al actualizar el item');
    } finally {
      setItemCargando(null);
    }
  };

  // Manejar reset del checklist
  const handleResetear = async () => {
    try {
      await resetear();
      toast.success('Checklist reiniciado correctamente');
    } catch (error) {
      console.error('Error al resetear:', error);
      toast.error('Error al reiniciar el checklist');
    }
  };

  // Calcular estadísticas generales
  const totalItems = categorias.reduce((acc, cat) => acc + cat.items.length, 0);
  const completados = progreso
    ? Object.values(progreso.progreso).filter((p) => p.completado).length
    : 0;
  const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

  const criticosFaltantes = progreso?.criticosFaltantes ?? 0;
  const importantesFaltantes = progreso?.importantesFaltantes ?? 0;

  // Estado de carga
  if (cargandoCategorias || cargandoProgreso) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  // Error
  if (errorCategorias) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error al cargar el equipo</p>
          <p className="text-gray-500 text-sm mt-1">Intenta recargar la página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con gradiente y progreso */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Backpack className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mi Equipo</h2>
              <p className="text-white/80 text-sm">{completados} de {totalItems} items</p>
            </div>
          </div>

          {/* Progreso circular */}
          <HeaderProgressRing progress={porcentaje} />
        </div>

        {/* Alertas de faltantes */}
        {(criticosFaltantes > 0 || importantesFaltantes > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {criticosFaltantes > 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {criticosFaltantes} crítico{criticosFaltantes > 1 ? 's' : ''} faltante{criticosFaltantes > 1 ? 's' : ''}
              </span>
            )}
            {importantesFaltantes > 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm">
                <span className="w-2 h-2 bg-orange-200 rounded-full" />
                {importantesFaltantes} importante{importantesFaltantes > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Completo */}
        {completados === totalItems && totalItems > 0 && (
          <div className="mt-4 flex items-center gap-2 text-white">
            <Check className="w-5 h-5" />
            <span className="font-medium">¡Tenés todo listo! 🎉</span>
          </div>
        )}
      </div>

      {/* Botón de resetear */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={completados === 0} className="text-gray-500">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reiniciar el checklist?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto desmarcará todos los items. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetear} disabled={reseteando}>
                {reseteando ? 'Reiniciando...' : 'Reiniciar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Vista Mobile: Acordeones */}
      <div className="xl:hidden space-y-3">
        {categorias.map((categoria, index) => (
          <CategoriaAccordion
            key={categoria.id}
            categoria={categoria}
            progreso={progreso?.progreso || {}}
            fotosPorRequisito={fotosPorRequisito}
            onToggleItem={handleToggleItem}
            onPhotoClick={(item) => setItemSeleccionadoParaFoto(item)}
            itemCargando={itemCargando}
            defaultOpen={index === 0}
          />
        ))}
      </div>

      {/* Vista Desktop XL: Grid de Cards más amplio */}
      <div className="hidden xl:grid xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {categorias.map((categoria) => (
          <CategoriaCard
            key={categoria.id}
            categoria={categoria}
            progreso={progreso?.progreso || {}}
            onClick={() => setCategoriaSeleccionada(categoria)}
          />
        ))}
      </div>

      {/* Modal de detalle de categoría (Desktop) */}
      <Dialog open={!!categoriaSeleccionada} onOpenChange={() => setCategoriaSeleccionada(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="text-lg">{categoriaSeleccionada?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="divide-y divide-gray-100 -mx-2">
              {categoriaSeleccionada?.items.map((item) => (
                <ItemEquipoCheck
                  key={item.id}
                  item={item}
                  completado={progreso?.progreso[item.id]?.completado || false}
                  fotoResumen={getFotoResumen(item)}
                  onToggle={() => handleToggleItem(item.id)}
                  onPhotoClick={item.requisitosFoto.length > 0 ? () => setItemSeleccionadoParaFoto(item) : undefined}
                  cargando={itemCargando === item.id}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de subida de foto */}
      <Dialog open={!!itemSeleccionadoParaFoto} onOpenChange={() => setItemSeleccionadoParaFoto(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6">
            <DialogTitle>Fotos del equipo</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {itemSeleccionadoParaFoto && (
              <FotoItemUpload
                item={itemSeleccionadoParaFoto}
                fotosPorRequisito={fotosPorRequisito}
                onClose={() => setItemSeleccionadoParaFoto(null)}
                onSuccess={() => refetchFotos()}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mensaje si está vacío */}
      {categorias.length === 0 && (
        <div className="text-center py-12">
          <Backpack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay items de equipo configurados</p>
          <p className="text-gray-400 text-sm">Contacta a un dirigente</p>
        </div>
      )}
    </div>
  );
}
