import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCrearCarpa, useActualizarCarpa, useEliminarCarpa } from '../../hooks/useCarpas';
import type { Carpa } from '../../api/schemas/carpas';
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
import { Trash2 } from 'lucide-react';

interface FormCarpaProps {
  open: boolean;
  onClose: () => void;
  carpa: Carpa | null;
}

export function FormCarpa({ open, onClose, carpa }: FormCarpaProps) {
  const { crearCarpa, cargando: creando } = useCrearCarpa();
  const { actualizarCarpa, cargando: actualizando } = useActualizarCarpa();
  const { eliminarCarpa, cargando: eliminando } = useEliminarCarpa();

  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const esEdicion = carpa !== null;

  useEffect(() => {
    if (carpa) {
      setNombre(carpa.nombre || '');
      setMarca(carpa.marca || '');
      setModelo(carpa.modelo || '');
      setCapacidad(carpa.capacidad?.toString() || '');
    } else {
      setNombre('');
      setMarca('');
      setModelo('');
      setCapacidad('');
    }
  }, [carpa, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      const data = {
        nombre: nombre.trim(),
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        capacidad: capacidad ? parseInt(capacidad, 10) : undefined,
      };

      if (esEdicion && carpa) {
        await actualizarCarpa(carpa.id, data);
        toast.success('Carpa actualizada');
      } else {
        await crearCarpa(data);
        toast.success('Carpa creada');
      }
      onClose();
    } catch (err) {
      toast.error(esEdicion ? 'Error al actualizar la carpa' : 'Error al crear la carpa');
    }
  };

  const handleEliminar = async () => {
    if (!carpa) return;
    if (!window.confirm('¿Estás seguro de que querés eliminar esta carpa?')) return;

    try {
      await eliminarCarpa(carpa.id);
      toast.success('Carpa eliminada');
      onClose();
    } catch (err) {
      toast.error('No se puede eliminar una carpa con revisiones');
    }
  };

  const cargando = creando || actualizando || eliminando;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar Carpa' : 'Nueva Carpa'}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? 'Modificá los datos de la carpa'
              : 'Completá los datos para agregar una carpa al inventario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carpa-nombre">Nombre *</Label>
            <Input
              id="carpa-nombre"
              placeholder="Ej: Carpa 1, Doite Kona..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="carpa-marca">Marca</Label>
              <Input
                id="carpa-marca"
                placeholder="Ej: Doite, National Geographic..."
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carpa-modelo">Modelo</Label>
              <Input
                id="carpa-modelo"
                placeholder="Ej: Kona 4"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carpa-capacidad">Capacidad (personas)</Label>
            <Input
              id="carpa-capacidad"
              type="number"
              min="1"
              max="20"
              placeholder="Ej: 4"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {esEdicion && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleEliminar}
                disabled={cargando}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
            <div className={`flex gap-2 ${esEdicion ? '' : 'ml-auto'}`}>
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
                {cargando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
