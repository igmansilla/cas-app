import { useState } from 'react';
import { Plus, Trash2, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useListasPersonalizadas } from '../../hooks/useListasPersonalizadas';
import type { ListaPersonalizada, ItemPersonalizado } from '../../hooks/useListasPersonalizadas';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function MisListas() {
  const { listas, crearLista, eliminarLista, agregarItem, toggleItem, eliminarItem } = useListasPersonalizadas();
  const [nuevaListaNombre, setNuevaListaNombre] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Reactivity Fix: Store ID instead of object
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState<string | null>(null);
  const listaSeleccionada = listas.find(l => l.id === listaSeleccionadaId);

  const handleCrearLista = () => {
    if (!nuevaListaNombre.trim()) return;
    crearLista(nuevaListaNombre);
    setNuevaListaNombre('');
    setDialogOpen(false);
    toast.success('Lista creada');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mis Listas Personales</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Lista
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear nueva lista</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 mt-4">
                    <Input 
                        placeholder="Nombre de la lista (ej: Comida extra)" 
                        value={nuevaListaNombre}
                        onChange={(e) => setNuevaListaNombre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCrearLista()}
                    />
                    <Button onClick={handleCrearLista}>Crear</Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      {listas.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 mb-2">No tienes listas personalizadas</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>Crear mi primera lista</Button>
          </div>
      ) : (
          <>
            {/* Mobile View: Accordions */}
            <div className="xl:hidden space-y-3">
                {listas.map((lista) => (
                    <ListaAccordion 
                        key={lista.id}
                        lista={lista}
                        onToggleItem={(itemId) => toggleItem(lista.id, itemId)}
                        onAddItem={(nombre) => agregarItem(lista.id, nombre)}
                        onDeleteItem={(itemId) => apiConfirm(() => eliminarItem(lista.id, itemId))}
                        onDeleteLista={() => {
                            if(confirm('¿Eliminar lista completa?')) eliminarLista(lista.id);
                        }}
                    />
                ))}
            </div>

            {/* Desktop View: Grid of Cards */}
            <div className="hidden xl:grid xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {listas.map((lista) => (
                    <ListaCard
                        key={lista.id}
                        lista={lista}
                        onClick={() => setListaSeleccionadaId(lista.id)}
                        onDelete={() => {
                            if(confirm('¿Eliminar lista completa?')) eliminarLista(lista.id);
                        }}
                    />
                ))}
            </div>
          </>
      )}

      {/* Detail Modal (Desktop mainly, or derived from card click) */}
      <Dialog open={!!listaSeleccionada} onOpenChange={(open) => !open && setListaSeleccionadaId(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-full">
            <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="text-lg">{listaSeleccionada?.nombre}</DialogTitle>
                    {listaSeleccionada && (
                         <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500"
                            onClick={() => {
                                if(confirm('¿Eliminar lista?')) {
                                    eliminarLista(listaSeleccionada.id);
                                    setListaSeleccionadaId(null);
                                }
                            }}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </DialogHeader>
            
            {listaSeleccionada && (
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                    <DetalleListaContenido 
                        lista={listaSeleccionada}
                        onToggleItem={(itemId) => toggleItem(listaSeleccionada.id, itemId)}
                        onAddItem={(nombre) => agregarItem(listaSeleccionada.id, nombre)}
                        onDeleteItem={(itemId) => eliminarItem(listaSeleccionada.id, itemId)}
                    />
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for quick confirm interaction
const apiConfirm = (action: () => void) => {
    // In a real app we might use a nicer dialog, but for now direct action is fine for items
    // or we assume the user wants to delete. 
    // Actually, for consistency with 'onDelete' elsewhere, let's just do it.
    action(); 
};


// ==========================================
// Sub-components
// ==========================================

function ListaAccordion({ 
    lista, 
    onToggleItem, 
    onAddItem, 
    onDeleteItem,
    onDeleteLista 
}: { 
    lista: ListaPersonalizada, 
    onToggleItem: (id: string) => void,
    onAddItem: (nombre: string) => void,
    onDeleteItem: (id: string) => void,
    onDeleteLista: () => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const totalItems = lista.items.length;
    const completados = lista.items.filter(i => i.completado).length;
    const todoCompleto = completados === totalItems && totalItems > 0;

    const handleAdd = () => {
        if (!newItemName.trim()) return;
        onAddItem(newItemName);
        setNewItemName('');
    };

    return (
        <div className={cn(
            'border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm',
            'border-l-4 transition-all duration-200',
            todoCompleto ? 'border-l-green-500' : 'border-l-blue-400', // Blue for custom
            isOpen && 'shadow-md'
        )}>
            <div className={cn(
                'w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer',
                'hover:bg-gray-50/50',
                todoCompleto && 'bg-green-50/30'
            )} onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0', isOpen && 'rotate-180')} />
                    <h3 className="font-semibold text-gray-900 truncate">{lista.nombre}</h3>
                </div>
                <div className="flex items-center gap-3">
                     <span className="text-sm text-gray-400">{completados}/{totalItems}</span>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-300 hover:text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLista();
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className={cn(
                'overflow-hidden transition-all duration-200',
                isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                     <div className="flex gap-2 mb-4">
                        <Input 
                            placeholder="Agregar item..." 
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            className="bg-white"
                        />
                        <Button size="icon" onClick={handleAdd}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {lista.items.map(item => (
                            <ItemPersonalizadoCheck 
                                key={item.id} 
                                item={item} 
                                onToggle={() => onToggleItem(item.id)} 
                                onDelete={() => onDeleteItem(item.id)}
                            />
                        ))}
                         {lista.items.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-2">Lista vacía</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListaCard({ 
    lista, 
    onClick, 
    onDelete 
}: { 
    lista: ListaPersonalizada, 
    onClick: () => void, 
    onDelete: () => void 
}) {
    const totalItems = lista.items.length;
    const completados = lista.items.filter(i => i.completado).length;
    const todoCompleto = completados === totalItems && totalItems > 0;

    return (
        <div 
            onClick={onClick}
            className={cn(
                'relative w-full p-4 bg-white border border-gray-200 rounded-xl text-left cursor-pointer',
                'border-l-4 transition-all duration-200',
                'hover:shadow-md hover:border-gray-300',
                 todoCompleto ? 'border-l-green-500 bg-green-50/30' : 'border-l-blue-400'
            )}
        >
             <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{lista.nombre}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{completados} de {totalItems}</p>
                </div>
                 {todoCompleto && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
            </div>
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
}

function DetalleListaContenido({ 
    lista, 
    onToggleItem, 
    onAddItem, 
    onDeleteItem 
}: { 
    lista: ListaPersonalizada, 
    onToggleItem: (id: string) => void,
    onAddItem: (nombre: string) => void,
    onDeleteItem: (id: string) => void
}) {
    const [newItemName, setNewItemName] = useState('');

    const handleAdd = () => {
        if (!newItemName.trim()) return;
        onAddItem(newItemName);
        setNewItemName('');
    };

    return (
        <div className="space-y-4">
             <div className="flex gap-2">
                <Input 
                    placeholder="Agregar item..." 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button size="icon" onClick={handleAdd}>
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <div className="divide-y divide-gray-100 -mx-2">
                {lista.items.map(item => (
                    <ItemPersonalizadoCheck 
                        key={item.id} 
                        item={item} 
                        onToggle={() => onToggleItem(item.id)} 
                        onDelete={() => onDeleteItem(item.id)}
                    />
                ))}
                 {lista.items.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No hay items en esta lista</p>
                )}
            </div>
        </div>
    );
}

function ItemPersonalizadoCheck({ 
    item, 
    onToggle, 
    onDelete 
}: { 
    item: ItemPersonalizado, 
    onToggle: () => void, 
    onDelete: () => void 
}) {
    return (
        <div className={cn(
            'group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
            'hover:bg-gray-50/80 active:scale-[0.995]',
            item.completado && 'bg-green-50/30'
        )} onClick={onToggle}>
            
            {/* Checkbox */}
            <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200',
                item.completado
                    ? 'bg-green-500 border-green-500 text-white scale-105'
                    : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105'
            )}>
                <Check className={cn('w-4 h-4 transition-all duration-200', item.completado ? 'opacity-100 scale-100' : 'opacity-0 scale-50')} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                 <span className={cn(
                    'font-medium transition-colors',
                    item.completado ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900'
                )}>
                    {item.nombre}
                </span>
            </div>

            {/* Delete Action */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <X className="w-4 h-4" />
            </Button>
        </div>
    );
}
