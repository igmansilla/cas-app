import { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useGruposAcampantes, useGruposDirigentes, useAgregarAGrupo, useRemoverDeGrupo } from '../../hooks/useGrupos';
import { useUsuariosAdmin } from '../../hooks/useUsuariosAdmin';
import type { UsuarioAdmin } from '../../api/services/usuariosAdmin';
import type { Grupo } from '../../api/services/grupos';
import { Loader2, Users, Tent, Shield, GripVertical, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gruposService } from '../../api/services/grupos';

interface AsignadorGruposKanbanProps {
    tipo: 'acampantes' | 'dirigentes';
}

// =============================================================================
// Componente de usuario arrastrable (compacto para el grid)
// =============================================================================
function UsuarioArrastrable({ usuario }: { usuario: UsuarioAdmin }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: `usuario-${usuario.keycloakId}`,
        data: { type: 'usuario', usuario }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 bg-background border rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-all text-xs",
                isDragging && "opacity-50 scale-95",
                "hover:shadow-md hover:border-primary/40 hover:bg-accent/30"
            )}
        >
            <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate font-medium">{usuario.nombreMostrar}</span>
        </div>
    );
}

// Versión para el drag overlay
function UsuarioOverlay({ usuario }: { usuario: UsuarioAdmin }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-background border-2 border-primary rounded-md shadow-xl cursor-grabbing text-xs">
            <GripVertical className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="truncate font-medium">{usuario.nombreMostrar}</span>
        </div>
    );
}

// =============================================================================
// Columna de grupo (droppable) - Diseño compacto
// =============================================================================
interface ColumnaGrupoProps {
    grupo: Grupo | { id: 'sin-asignar'; nombre: string; path: string };
    usuarios: UsuarioAdmin[];
    color: 'green' | 'blue' | 'gray';
    cargando?: boolean;
}

function ColumnaGrupo({ grupo, usuarios, color, cargando }: ColumnaGrupoProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `grupo-${grupo.id}`,
        data: { type: 'grupo', grupo }
    });

    const colorClasses = {
        green: 'border-green-300 bg-green-50/50 dark:bg-green-950/30',
        blue: 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/30',
        gray: 'border-gray-300 bg-gray-50/50 dark:bg-gray-900/30',
    };

    const headerColors = {
        green: 'bg-green-200/70 dark:bg-green-800/50',
        blue: 'bg-blue-200/70 dark:bg-blue-800/50',
        gray: 'bg-gray-200/70 dark:bg-gray-700/50',
    };

    const iconColors = {
        green: 'text-green-700 dark:text-green-300',
        blue: 'text-blue-700 dark:text-blue-300',
        gray: 'text-gray-700 dark:text-gray-300',
    };

    const Icon = grupo.id === 'sin-asignar' ? Users : (color === 'blue' ? Shield : Tent);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col rounded-lg border-2 transition-all duration-200 min-h-[200px]",
                colorClasses[color],
                isOver && "border-primary ring-2 ring-primary/40 scale-[1.01] bg-primary/5"
            )}
        >
            {/* Header compacto */}
            <div className={cn("px-2 py-1.5 rounded-t-md flex items-center gap-1.5", headerColors[color])}>
                <Icon className={cn("w-4 h-4", iconColors[color])} />
                <h3 className="font-semibold text-xs truncate flex-1">{grupo.nombre}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {cargando ? '...' : usuarios.length}
                </Badge>
            </div>

            {/* Lista de usuarios - scrollable */}
            <div className="flex-1 p-1.5 overflow-y-auto space-y-1 max-h-[calc(100vh-350px)] min-h-[100px]">
                {cargando ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <SortableContext
                        items={usuarios.map(u => `usuario-${u.keycloakId}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {usuarios.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground text-center py-3 italic">
                                Arrastrá aquí
                            </p>
                        ) : (
                            usuarios.map(usuario => (
                                <UsuarioArrastrable key={usuario.keycloakId} usuario={usuario} />
                            ))
                        )}
                    </SortableContext>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// Hook para cargar miembros de todos los grupos (por email para match)
// =============================================================================
function useGruposConMiembros(grupos: Grupo[]) {
    const grupoIds = grupos.map(g => g.id);
    
    const query = useQuery({
        queryKey: ['grupos', 'kanban', grupoIds],
        queryFn: async () => {
            const miembrosPorGrupo: Record<string, string[]> = {};
            
            await Promise.all(
                grupos.map(async (grupo) => {
                    try {
                        const miembros = await gruposService.obtenerMiembrosGrupo(grupo.id);
                        miembrosPorGrupo[grupo.id] = miembros.map(m => m.email.toLowerCase());
                    } catch (error) {
                        console.error(`Error cargando miembros del grupo ${grupo.nombre}:`, error);
                        miembrosPorGrupo[grupo.id] = [];
                    }
                })
            );
            
            return miembrosPorGrupo;
        },
        enabled: grupos.length > 0,
        staleTime: 30000,
    });

    return {
        emailsPorGrupo: query.data ?? {},
        cargando: query.isLoading,
        refetch: query.refetch,
    };
}

// =============================================================================
// Componente principal - Layout de grilla de pantalla completa
// =============================================================================
export function AsignadorGruposKanban({ tipo }: AsignadorGruposKanbanProps) {
    const queryClient = useQueryClient();
    const { grupos: gruposAcampantes, cargando: cargandoAcampantes } = useGruposAcampantes();
    const { grupos: gruposDirigentes, cargando: cargandoDirigentes } = useGruposDirigentes();
    const { usuarios, cargando: cargandoUsuarios } = useUsuariosAdmin();
    const agregarMutation = useAgregarAGrupo();
    const removerMutation = useRemoverDeGrupo();

    const grupos = tipo === 'acampantes' ? gruposAcampantes : gruposDirigentes;
    const { emailsPorGrupo, cargando: cargandoMiembros, refetch } = useGruposConMiembros(grupos);

    const [activeUser, setActiveUser] = useState<UsuarioAdmin | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [asignacionesLocales, setAsignacionesLocales] = useState<Record<string, string[]>>({});
    const [initialized, setInitialized] = useState(false);

    const cargando = cargandoAcampantes || cargandoDirigentes || cargandoUsuarios;
    const rolFiltro = tipo === 'acampantes' ? 'ACAMPANTE' : 'DIRIGENTE';
    const color = tipo === 'acampantes' ? 'green' : 'blue';
    const etiquetaPlural = tipo === 'acampantes' ? 'acampantes' : 'dirigentes';

    const usuariosFiltrados = usuarios.filter(u => u.roles.includes(rolFiltro));

    // Sincronizar miembros
    useEffect(() => {
        if (Object.keys(emailsPorGrupo).length > 0 && usuariosFiltrados.length > 0 && !initialized) {
            const nuevasAsignaciones: Record<string, string[]> = {};
            
            for (const [grupoId, emails] of Object.entries(emailsPorGrupo)) {
                nuevasAsignaciones[grupoId] = [];
                for (const email of emails) {
                    const usuario = usuariosFiltrados.find(u => u.email.toLowerCase() === email);
                    if (usuario) {
                        nuevasAsignaciones[grupoId].push(usuario.keycloakId);
                    }
                }
            }
            
            setAsignacionesLocales(nuevasAsignaciones);
            setInitialized(true);
        }
    }, [emailsPorGrupo, usuariosFiltrados, initialized]);

    useEffect(() => {
        setInitialized(false);
        setAsignacionesLocales({});
    }, [tipo]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const getGrupoDeUsuario = useCallback((usuario: UsuarioAdmin): string => {
        for (const grupoId in asignacionesLocales) {
            if (asignacionesLocales[grupoId].includes(usuario.keycloakId)) {
                return grupoId;
            }
        }
        return 'sin-asignar';
    }, [asignacionesLocales]);

    const handleDragStart = (event: DragStartEvent) => {
        const usuario = (event.active.data.current as { usuario?: UsuarioAdmin })?.usuario;
        if (usuario) setActiveUser(usuario);
    };

    const handleDragOver = (_event: DragOverEvent) => {};

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveUser(null);
        setError(null);

        if (!over) return;

        const usuarioData = active.data.current as { usuario?: UsuarioAdmin };
        const grupoData = over.data.current as { grupo?: Grupo | { id: string } };

        if (!usuarioData?.usuario || !grupoData?.grupo) return;

        const usuario = usuarioData.usuario;
        const nuevoGrupoId = grupoData.grupo.id;
        const grupoActualId = getGrupoDeUsuario(usuario);

        if (grupoActualId === nuevoGrupoId) return;

        const estadoAnterior = { ...asignacionesLocales };

        // Optimistic update
        setAsignacionesLocales(prev => {
            const newState = { ...prev };
            if (grupoActualId !== 'sin-asignar' && newState[grupoActualId]) {
                newState[grupoActualId] = newState[grupoActualId].filter(id => id !== usuario.keycloakId);
            }
            if (nuevoGrupoId !== 'sin-asignar') {
                if (!newState[nuevoGrupoId]) newState[nuevoGrupoId] = [];
                newState[nuevoGrupoId] = [...newState[nuevoGrupoId], usuario.keycloakId];
            }
            return newState;
        });

        try {
            if (grupoActualId !== 'sin-asignar') {
                await removerMutation.mutateAsync({ keycloakId: usuario.keycloakId, grupoId: grupoActualId });
            }
            if (nuevoGrupoId !== 'sin-asignar') {
                await agregarMutation.mutateAsync({ keycloakId: usuario.keycloakId, grupoId: nuevoGrupoId });
            }
            queryClient.invalidateQueries({ queryKey: ['grupos', 'kanban'] });
        } catch (err) {
            console.error('Error al asignar usuario:', err);
            setAsignacionesLocales(estadoAnterior);
            const errorMessage = err instanceof Error ? err.message : '';
            if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
                setError('No tenés permisos. Solo miembros del Consejo pueden asignar.');
            } else {
                setError('Error al asignar. Intentá nuevamente.');
            }
        }
    };

    const handleRefresh = () => {
        setInitialized(false);
        refetch();
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const usuariosSinAsignar = usuariosFiltrados.filter(u => getGrupoDeUsuario(u) === 'sin-asignar');
    const getUsuariosDeGrupo = (grupoId: string) => 
        usuariosFiltrados.filter(u => getGrupoDeUsuario(u) === grupoId);

    // Calcular número de columnas basado en cantidad de grupos
    const totalColumnas = grupos.length + 1; // +1 para "Sin Asignar"
    const gridCols = totalColumnas <= 3 ? 'grid-cols-1 md:grid-cols-3' 
                   : totalColumnas <= 4 ? 'grid-cols-2 md:grid-cols-4'
                   : totalColumnas <= 6 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                   : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Header con instrucciones y refresh */}
            <div className="flex items-center justify-between gap-3 flex-shrink-0">
                <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md flex-1">
                    <strong>Arrastrá</strong> {etiquetaPlural} entre columnas. Solo <strong>Consejo</strong> puede modificar.
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {usuariosFiltrados.length} {etiquetaPlural}
                    </Badge>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={cargandoMiembros}
                        className="h-7 text-xs"
                    >
                        <RefreshCw className={cn("w-3 h-3 mr-1", cargandoMiembros && "animate-spin")} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
            )}

            {/* Grid de Kanban - ocupa todo el espacio disponible */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className={cn("grid gap-3 flex-1 auto-rows-fr", gridCols)}>
                    {/* Columna "Sin Asignar" primero */}
                    <ColumnaGrupo
                        grupo={{ id: 'sin-asignar', nombre: 'Sin Asignar', path: '' }}
                        usuarios={usuariosSinAsignar}
                        color="gray"
                        cargando={cargandoMiembros}
                    />

                    {/* Columnas de grupos */}
                    {grupos.map(grupo => (
                        <ColumnaGrupo
                            key={grupo.id}
                            grupo={grupo}
                            usuarios={getUsuariosDeGrupo(grupo.id)}
                            color={color}
                            cargando={cargandoMiembros}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeUser && <UsuarioOverlay usuario={activeUser} />}
                </DragOverlay>
            </DndContext>

            {/* Estado de mutaciones */}
            {(agregarMutation.isPending || removerMutation.isPending) && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Guardando...
                </div>
            )}
        </div>
    );
}
