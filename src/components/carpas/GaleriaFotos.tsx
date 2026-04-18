import { useState } from 'react';
import { X, Trash2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useEliminarFotoRevision } from '../../hooks/useCarpas';
import { carpasService } from '../../api/services/carpas';
import type { FotoRevision } from '../../api/schemas/carpas';
import { Button } from '../ui/button';

interface GaleriaFotosProps {
  fotos: FotoRevision[];
  revisionId: number;
}

export function GaleriaFotos({ fotos, revisionId }: GaleriaFotosProps) {
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoRevision | null>(null);
  const { eliminarFoto, cargando: eliminando } = useEliminarFotoRevision();

  const handleEliminar = async (fotoId: number) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await eliminarFoto(revisionId, fotoId);
      setFotoAmpliada(null);
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar la foto');
    }
  };

  return (
    <>
      {/* Grid de thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group"
            onClick={() => setFotoAmpliada(foto)}
          >
            <img
              src={carpasService.getThumbnailUrl(revisionId, foto.id)}
              alt={foto.descripcion || 'Foto de revisión'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {/* Controles */}
            <div className="absolute top-0 right-0 flex gap-2 p-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEliminar(fotoAmpliada.id)}
                disabled={eliminando}
                className="text-white/70 hover:text-white hover:bg-red-500/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFotoAmpliada(null)}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Imagen */}
            <img
              src={carpasService.getFotoUrl(revisionId, fotoAmpliada.id)}
              alt={fotoAmpliada.descripcion || 'Foto de revisión'}
              className="w-full h-full object-contain max-h-[85vh] rounded-lg"
            />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
              <div className="flex items-center justify-between text-white/80 text-xs">
                {fotoAmpliada.descripcion && (
                  <span>{fotoAmpliada.descripcion}</span>
                )}
                <span>
                  {new Date(fotoAmpliada.fechaSubida).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
