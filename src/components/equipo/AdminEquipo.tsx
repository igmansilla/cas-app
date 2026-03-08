import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MoreVertical, Package, Camera } from 'lucide-react';
import { toast } from 'sonner';

import {
  useCategorias,
  useCrearCategoria,
  useActualizarCategoria,
  useEliminarCategoria,
  useCrearItem,
  useActualizarItem,
  useEliminarItem,
} from '../../hooks/useEquipo';
import type { CategoriaEquipo, ItemEquipo, Criticidad } from '../../api/schemas/equipo';
import { CRITICIDAD_CONFIG } from '../../api/schemas/equipo';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';

/**
 * Panel de administración de categorías e items
 */
export function AdminEquipo() {
  const { categorias, cargando } = useCategorias();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaEquipo | null>(null);
  
  // Modales
  const [modalCategoria, setModalCategoria] = useState<{ open: boolean; editar?: CategoriaEquipo }>({ open: false });
  const [modalItem, setModalItem] = useState<{ open: boolean; editar?: ItemEquipo }>({ open: false });
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ tipo: 'categoria' | 'item'; id: number } | null>(null);

  // Seleccionar primera categoría por defecto
  const categoriaActiva = categoriaSeleccionada || categorias[0] || null;

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Panel izquierdo: Lista de categorías */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Categorías</h3>
          <Button size="sm" onClick={() => setModalCategoria({ open: true })}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva
          </Button>
        </div>

        <div className="space-y-2">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              onClick={() => setCategoriaSeleccionada(cat)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCategoriaSeleccionada(cat);
                }
              }}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                categoriaActiva?.id === cat.id
                  ? 'border-orange-500 bg-orange-50 border-l-4'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{cat.nombre}</p>
                <p className="text-sm text-gray-500">{cat.items.length} items</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setModalCategoria({ open: true, editar: cat }); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setConfirmarEliminar({ tipo: 'categoria', id: cat.id }); }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {categorias.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No hay categorías</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho: Items de la categoría seleccionada */}
      <div className="lg:col-span-3 space-y-4">
        {categoriaActiva ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{categoriaActiva.nombre}</h3>
              <Button size="sm" onClick={() => setModalItem({ open: true })}>
                <Plus className="w-4 h-4 mr-1" />
                Nuevo item
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Header de tabla (Oculto en móvil) */}
              <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Cantidad</div>
                <div className="col-span-3">Criticidad</div>
                <div className="col-span-2 text-right">Acciones</div>
              </div>

              {/* Filas de items */}
              <div className="divide-y divide-gray-100">
                {categoriaActiva.items.map((item) => (
                  <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-2 px-4 py-4 md:py-3 md:items-center hover:bg-gray-50">
                    
                    {/* Nombre y Acciones (Móvil) */}
                    <div className="md:col-span-5 flex justify-between items-start md:block">
                      <div className="pr-4">
                        <p className="font-medium text-gray-900">{item.nombre}</p>
                        {item.notas && <p className="text-xs text-gray-500 line-clamp-2 md:truncate mt-0.5">{item.notas}</p>}
                      </div>
                      
                      {/* Acciones solo visibles en móvil */}
                      <div className="md:hidden flex flex-shrink-0 gap-1 border border-gray-100 rounded-md p-0.5 bg-white shadow-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setModalItem({ open: true, editar: item })}
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setConfirmarEliminar({ tipo: 'item', id: item.id })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Detalle inferior en Móvil / Columnas en Desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 md:contents">
                      <div className="md:col-span-2 flex items-center md:justify-center text-sm text-gray-600">
                        <span className="md:hidden font-medium text-xs text-gray-400 uppercase w-20">Cantidad:</span>
                        <span className="font-medium md:font-normal bg-gray-100 md:bg-transparent px-2 py-0.5 md:p-0 rounded-md md:rounded-none">{item.cantidad}</span>
                      </div>
                      
                      <div className="md:col-span-3 flex items-center gap-2">
                        <span className="md:hidden font-medium text-xs text-gray-400 uppercase w-20">Criticidad:</span>
                        <div className="flex items-center gap-2 px-2 py-1 md:p-0 bg-gray-50 md:bg-transparent rounded-md md:rounded-none border border-gray-100 md:border-none">
                          <span className={cn('w-2 h-2 rounded-full', CRITICIDAD_CONFIG[item.criticidad].dotColor)} />
                          <span className="text-sm font-medium md:font-normal text-gray-700 md:text-gray-600">{CRITICIDAD_CONFIG[item.criticidad].label}</span>
                          {item.requiereFoto && (
                            <span className="ml-1 text-indigo-500" title="Requiere foto">
                              <Camera className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones solo visibles en desktop */}
                    <div className="hidden md:flex md:col-span-2 justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setModalItem({ open: true, editar: item })}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setConfirmarEliminar({ tipo: 'item', id: item.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                {categoriaActiva.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay items en esta categoría</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Selecciona una categoría</p>
          </div>
        )}
      </div>

      {/* Modal de Categoría */}
      <ModalCategoria
        open={modalCategoria.open}
        editar={modalCategoria.editar}
        onClose={() => setModalCategoria({ open: false })}
      />

      {/* Modal de Item */}
      <ModalItem
        open={modalItem.open}
        editar={modalItem.editar}
        categoriaId={categoriaActiva?.id}
        onClose={() => setModalItem({ open: false })}
      />

      {/* Confirmación de eliminar */}
      <ConfirmarEliminar
        open={!!confirmarEliminar}
        tipo={confirmarEliminar?.tipo || 'item'}
        itemId={confirmarEliminar?.id || 0}
        tieneItems={confirmarEliminar?.tipo === 'categoria' && (categoriaActiva?.items.length || 0) > 0}
        onClose={() => setConfirmarEliminar(null)}
      />
    </div>
  );
}

/**
 * Modal para crear/editar categoría
 */
function ModalCategoria({
  open,
  editar,
  onClose,
}: {
  open: boolean;
  editar?: CategoriaEquipo;
  onClose: () => void;
}) {
  const { crearCategoria, cargando: creando } = useCrearCategoria();
  const { actualizarCategoria, cargando: actualizando } = useActualizarCategoria();
  
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Poblar datos al editar
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editar) {
      setNombre(editar.nombre);
      setDescripcion(editar.descripcion || '');
    } else if (!isOpen) {
      setNombre('');
      setDescripcion('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editar) {
        await actualizarCategoria(editar.id, { nombre, descripcion });
        toast.success('Categoría actualizada');
      } else {
        await crearCategoria({ nombre, descripcion });
        toast.success('Categoría creada');
      }
      onClose();
      setNombre('');
      setDescripcion('');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editar ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Calzado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la categoría..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={creando || actualizando}>
            {creando || actualizando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal para crear/editar item
 */
function ModalItem({
  open,
  editar,
  categoriaId,
  onClose,
}: {
  open: boolean;
  editar?: ItemEquipo;
  categoriaId?: number;
  onClose: () => void;
}) {
  const { crearItem, cargando: creando } = useCrearItem();
  const { actualizarItem, cargando: actualizando } = useActualizarItem();

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [criticidad, setCriticidad] = useState<Criticidad>('NORMAL');
  const [notas, setNotas] = useState('');
  const [evitar, setEvitar] = useState('');
  const [requiereFoto, setRequiereFoto] = useState(false);

  // Poblar datos cuando se abre para editar
  useEffect(() => {
    if (open && editar) {
      setNombre(editar.nombre);
      setCantidad(editar.cantidad);
      setCriticidad(editar.criticidad);
      setNotas(editar.notas || '');
      setEvitar(editar.evitar || '');
      setRequiereFoto(editar.requiereFoto || false);
    } else if (open && !editar) {
      // Reset para crear nuevo
      setNombre('');
      setCantidad(1);
      setCriticidad('NORMAL');
      setNotas('');
      setEvitar('');
      setRequiereFoto(false);
    }
  }, [open, editar]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editar) {
        await actualizarItem(editar.id, { nombre, cantidad, criticidad, notas, evitar, requiereFoto });
        toast.success('Item actualizado');
      } else if (categoriaId) {
        await crearItem(categoriaId, { nombre, cantidad, criticidad, notas, evitar, requiereFoto });
        toast.success('Item creado');
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editar ? 'Editar item' : 'Nuevo item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-nombre">Nombre</Label>
            <Input
              id="item-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Botas de trekking"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Criticidad</Label>
              <Select value={criticidad} onValueChange={(v) => setCriticidad(v as Criticidad)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICO">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Crítico
                    </div>
                  </SelectItem>
                  <SelectItem value="IMPORTANTE">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Importante
                    </div>
                  </SelectItem>
                  <SelectItem value="NORMAL">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Normal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: mejor micropolar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evitar">Evitar (opcional)</Label>
            <Input
              id="evitar"
              value={evitar}
              onChange={(e) => setEvitar(e.target.value)}
              placeholder="Ej: algodón, tela"
            />
          </div>

          {/* Toggle Requiere Foto */}
          <div className="flex items-center justify-between border rounded-lg p-3 bg-indigo-50/50">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" />
              <div>
                <Label htmlFor="requiereFoto" className="cursor-pointer">Requiere foto</Label>
                <p className="text-xs text-gray-500">El acampante deberá subir una foto de este item</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={requiereFoto}
              onClick={() => setRequiereFoto(!requiereFoto)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                requiereFoto ? "bg-indigo-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  requiereFoto ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={creando || actualizando}>
            {creando || actualizando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Diálogo de confirmación para eliminar
 */
function ConfirmarEliminar({
  open,
  tipo,
  itemId,
  tieneItems,
  onClose,
}: {
  open: boolean;
  tipo: 'categoria' | 'item';
  itemId: number;
  tieneItems: boolean;
  onClose: () => void;
}) {
  const { eliminarCategoria, cargando: eliminandoCat } = useEliminarCategoria();
  const { eliminarItem, cargando: eliminandoItem } = useEliminarItem();

  const handleEliminar = async () => {
    try {
      if (tipo === 'categoria') {
        await eliminarCategoria(itemId);
        toast.success('Categoría eliminada');
      } else {
        await eliminarItem(itemId);
        toast.success('Item eliminado');
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar {tipo === 'categoria' ? 'categoría' : 'item'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tipo === 'categoria' && tieneItems ? (
              <span className="text-red-600 font-medium">
                Esta categoría tiene items. Debes eliminarlos primero.
              </span>
            ) : (
              'Esta acción no se puede deshacer.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            disabled={eliminandoCat || eliminandoItem || (tipo === 'categoria' && tieneItems)}
            className="bg-red-600 hover:bg-red-700"
          >
            {eliminandoCat || eliminandoItem ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
