import React, { useRef, useState } from 'react';
import { Camera, Check, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import type { FotoCargadaEquipo, ItemEquipo } from '../../api/schemas/equipo';
import { equipoService } from '../../api/services/equipo';
import { useEliminarFotoRequisito, useSubirFotoRequisito } from '../../hooks/useEquipo';
import { Button } from '../ui/button';
import { ProtectedEquipoImage } from './ProtectedEquipoImage';

interface FotoItemUploadProps {
  item: ItemEquipo;
  fotosPorRequisito: Record<number, FotoCargadaEquipo>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FotoItemUpload({ item, fotosPorRequisito, onClose, onSuccess }: FotoItemUploadProps) {
  const [subiendoRequisitoId, setSubiendoRequisitoId] = useState<number | null>(null);
  const [selectorActivo, setSelectorActivo] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { subirFoto } = useSubirFotoRequisito();
  const { eliminarFoto } = useEliminarFotoRequisito();

  const totalFotos = item.requisitosFoto.length;
  const cargadas = item.requisitosFoto.filter((requisito) => fotosPorRequisito[requisito.id]).length;

  const handleSeleccionarArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const requisitoId = selectorActivo;
    event.target.value = '';

    if (!file || !requisitoId) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede pesar más de 10MB');
      return;
    }

    try {
      setSubiendoRequisitoId(requisitoId);
      await subirFoto({ requisitoId, file });
      toast.success('Foto subida con éxito');
      onSuccess?.();
    } catch (error) {
      console.error('Error al subir foto:', error);
      toast.error('No se pudo subir la foto');
    } finally {
      setSubiendoRequisitoId(null);
      setSelectorActivo(null);
    }
  };

  const handleEliminar = async (requisitoId: number) => {
    if (!confirm('¿Querés eliminar esta foto?')) {
      return;
    }

    try {
      setSubiendoRequisitoId(requisitoId);
      await eliminarFoto(requisitoId);
      toast.success('Foto eliminada');
      onSuccess?.();
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('No se pudo eliminar la foto');
    } finally {
      setSubiendoRequisitoId(null);
    }
  };

  const abrirSelector = (requisitoId: number, source: 'camera' | 'gallery') => {
    setSelectorActivo(requisitoId);

    if (source === 'camera') {
      cameraInputRef.current?.click();
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSeleccionarArchivo}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSeleccionarArchivo}
      />

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{item.nombre}</h3>
          <p className="text-sm text-gray-500">
            Estas fotos ayudan a revisar las partes clave del equipo sin depender de una sola imagen genérica.
          </p>
        </div>
        <div className="w-fit min-w-24 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-right sm:self-auto">
          <p className="text-xs uppercase tracking-wide text-indigo-500">Fotos</p>
          <p className="text-lg font-semibold text-indigo-700">{cargadas}/{totalFotos}</p>
        </div>
      </div>

      <div className="space-y-4">
        {item.requisitosFoto.map((requisito) => {
          const foto = fotosPorRequisito[requisito.id];
          const isUploading = subiendoRequisitoId === requisito.id;

          return (
            <div key={requisito.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-700">
                        {requisito.orden}
                      </span>
                      <h4 className="font-medium text-gray-900">{requisito.titulo}</h4>
                    </div>
                    {requisito.descripcion && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{requisito.descripcion}</p>
                    )}
                  </div>
                  {foto ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <Check className="h-3 w-3" />
                      Cargada
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      Falta subir
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  {foto ? (
                    <ProtectedEquipoImage
                      url={equipoService.getRequisitoThumbnailUrl(requisito.id)}
                      alt={requisito.titulo}
                      className="h-full w-full object-contain"
                      loadingFallback={<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />}
                      fallback={
                        <div className="px-4 text-center">
                          <ImageIcon className="mx-auto h-6 w-6 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">No se pudo cargar la vista previa</p>
                        </div>
                      }
                    />
                  ) : (
                    <div className="px-4 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Sin foto todavía</p>
                      <p className="mt-1 text-xs text-gray-500">Subí esta vista específica para completar la revisión.</p>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <p className="text-sm font-medium text-indigo-700">Procesando...</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-11 gap-2"
                    onClick={() => abrirSelector(requisito.id, 'camera')}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                    Cámara
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-11 gap-2"
                    onClick={() => abrirSelector(requisito.id, 'gallery')}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    Galería
                  </Button>
                </div>

                {foto && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleEliminar(requisito.id)}
                    disabled={isUploading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar foto
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
        <strong>Tip:</strong> Buscá buena luz y dejá visible justo la parte que pide cada tarjeta. En mochila, bolsa y botas conviene apoyar el equipo sobre una superficie clara para que se lea mejor.
      </div>

      <div className="shrink-0 border-t pt-3">
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
