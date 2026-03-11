import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import {
    useActualizarGrupoAcampantes,
    useCrearGrupoAcampantes,
    useEliminarGrupoAcampantes,
    useGrupoDetalle,
    useGruposArbol,
    useSincronizarGrupos,
    type GrupoArbolNode,
    type GrupoDetalle,
    type MiembroGrupo,
} from '../../hooks/useGrupos';
import { ChevronDown, ChevronRight, Loader2, MoreVertical, Pencil, Plus, RefreshCw, Shield, Tent, Trash2, Users } from 'lucide-react';

const ROLE_BADGE_CLASS: Record<string, string> = {
    ADMIN: 'bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900',
    DIRIGENTE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    PADRE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    ACAMPANTE: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
};

interface ManagedGroupTarget {
    id: string;
    nombre: string;
    path: string;
}

export function ArbolGruposPanel() {
    const { hasRole } = useAuth();
    const { arbol, cargando, error, refetch } = useGruposArbol();
    const syncMutation = useSincronizarGrupos();
    const createMutation = useCrearGrupoAcampantes();
    const updateMutation = useActualizarGrupoAcampantes();
    const deleteMutation = useEliminarGrupoAcampantes();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<ManagedGroupTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ManagedGroupTarget | null>(null);

    const canManageGroups = hasRole('ADMIN');
    const isMutatingGroups = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    const flattenedIds = useMemo(() => collectNodeIds(arbol), [arbol]);

    useEffect(() => {
        if (flattenedIds.length === 0) {
            setSelectedGroupId(null);
            return;
        }

        if (!selectedGroupId || !flattenedIds.includes(selectedGroupId)) {
            const firstId = flattenedIds[0];
            setSelectedGroupId(firstId);
            setExpandedIds(findPathIds(arbol, firstId));
        }
    }, [arbol, flattenedIds, selectedGroupId]);

    const { detalle, cargando: cargandoDetalle } = useGrupoDetalle(selectedGroupId ?? '', !!selectedGroupId);

    const handleSelectNode = (nodeId: string) => {
        setSelectedGroupId(nodeId);
        setExpandedIds((prev) => {
            const merged = new Set([...prev, ...findPathIds(arbol, nodeId)]);
            return Array.from(merged);
        });
    };

    const handleToggleNode = (nodeId: string) => {
        setExpandedIds((prev) =>
            prev.includes(nodeId)
                ? prev.filter((currentId) => currentId !== nodeId)
                : [...prev, nodeId]
        );
    };

    const handleSync = async () => {
        await syncMutation.mutateAsync();
        await refetch();
    };

    const refreshTreeAndSelection = async (nextSelectedId?: string | null) => {
        const refreshedTree = (await refetch()).data ?? [];

        if (typeof nextSelectedId === 'string' && nextSelectedId.length > 0) {
            setSelectedGroupId(nextSelectedId);
            setExpandedIds((prev) => {
                const merged = new Set([...prev, ...findPathIds(refreshedTree, nextSelectedId)]);
                return Array.from(merged);
            });
            return;
        }

        if (nextSelectedId === null) {
            setSelectedGroupId(null);
        }
    };

    const handleCreateGroup = async (nombre: string) => {
        try {
            const createdGroup = await createMutation.mutateAsync(nombre);
            setIsCreateDialogOpen(false);
            await refreshTreeAndSelection(createdGroup.id);
            toast.success(`Grupo ${createdGroup.nombre} creado.`);
        } catch (error) {
            toast.error(resolveGroupMutationError(error, 'No se pudo crear el grupo.'));
        }
    };

    const handleRenameGroup = async (nombre: string) => {
        if (!renameTarget) {
            return;
        }

        try {
            const updatedGroup = await updateMutation.mutateAsync({ grupoId: renameTarget.id, nombre });
            setRenameTarget(null);
            await refreshTreeAndSelection(updatedGroup.id);
            toast.success(`Grupo ${updatedGroup.nombre} actualizado.`);
        } catch (error) {
            toast.error(resolveGroupMutationError(error, 'No se pudo actualizar el grupo.'));
        }
    };

    const handleDeleteGroup = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            const deletedGroupId = deleteTarget.id;
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            setExpandedIds((prev) => prev.filter((groupId) => groupId !== deletedGroupId));
            await refreshTreeAndSelection(selectedGroupId === deletedGroupId ? null : selectedGroupId);
            toast.success(`Grupo ${deleteTarget.nombre} eliminado.`);
        } catch (error) {
            toast.error(resolveGroupMutationError(error, 'No se pudo eliminar el grupo.'));
        }
    };

    return (
        <>
            <div className="grid gap-4 lg:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b px-4 py-4 sm:px-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Jerarquía de grupos</h2>
                        <p className="text-sm text-muted-foreground">
                            Navegación por click sobre la estructura real del campamento.
                        </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                        {canManageGroups && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateDialogOpen(true)}
                                disabled={isMutatingGroups}
                                className="flex-1 sm:flex-none"
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Nuevo grupo
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="min-w-0 flex-1 shrink-0 sm:flex-none"
                            onClick={handleSync}
                            disabled={syncMutation.isPending || isMutatingGroups}
                        >
                            {syncMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Sincronizar
                        </Button>
                    </div>
                </div>

                <div className="max-h-[45vh] overflow-y-auto px-3 py-4 sm:max-h-[72vh]">
                    {error ? (
                        <Alert variant="destructive">
                            <AlertDescription>
                                No se pudo cargar el árbol de grupos.
                            </AlertDescription>
                        </Alert>
                    ) : cargando ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : arbol.length === 0 ? (
                        <div className="space-y-3 rounded-2xl border border-dashed p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Todavía no hay nodos sincronizados en la jerarquía local.
                            </p>
                            <Button onClick={handleSync} disabled={syncMutation.isPending}>
                                {syncMutation.isPending ? 'Sincronizando...' : 'Cargar árbol'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {arbol.map((node) => (
                                <GrupoTreeNode
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    selectedGroupId={selectedGroupId}
                                    expandedIds={expandedIds}
                                    onSelect={handleSelectNode}
                                    onToggle={handleToggleNode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                {cargandoDetalle ? (
                    <div className="flex min-h-[320px] items-center justify-center sm:min-h-[360px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : detalle ? (
                    <GrupoDetallePanel
                        detalle={detalle}
                        onSelectNode={handleSelectNode}
                        canManageGroups={canManageGroups}
                        isMutatingGroups={isMutatingGroups}
                        onRenameGroup={setRenameTarget}
                        onDeleteGroup={setDeleteTarget}
                    />
                ) : (
                    <div className="flex min-h-[320px] items-center justify-center px-4 text-center text-sm text-muted-foreground sm:min-h-[360px] sm:px-6">
                        Seleccioná un nodo del árbol para ver integrantes, subgrupos y dirigentes a cargo.
                    </div>
                )}
            </section>
            </div>

            <GrupoNombreDialog
                open={isCreateDialogOpen}
                title="Nuevo grupo de acampantes"
                description="El grupo se crea como hijo directo de Acampantes y queda sincronizado con Keycloak."
                submitLabel="Crear grupo"
                isPending={createMutation.isPending}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateGroup}
            />

            <GrupoNombreDialog
                open={!!renameTarget}
                title="Renombrar grupo"
                description="El cambio se aplica en Keycloak y luego se replica en el árbol local."
                initialValue={renameTarget?.nombre ?? ''}
                submitLabel="Guardar cambios"
                isPending={updateMutation.isPending}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setRenameTarget(null);
                    }
                }}
                onSubmit={handleRenameGroup}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(nextOpen) => {
                if (!nextOpen && !deleteMutation.isPending) {
                    setDeleteTarget(null);
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget
                                ? `Se eliminará ${deleteTarget.nombre} de Keycloak y del árbol local si no tiene referencias históricas.`
                                : 'Se eliminará el grupo seleccionado.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={(event) => {
                                event.preventDefault();
                                void handleDeleteGroup();
                            }}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar grupo'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function GrupoTreeNode({
    node,
    depth,
    selectedGroupId,
    expandedIds,
    onSelect,
    onToggle,
}: {
    node: GrupoArbolNode;
    depth: number;
    selectedGroupId: string | null;
    expandedIds: string[];
    onSelect: (nodeId: string) => void;
    onToggle: (nodeId: string) => void;
}) {
    const descriptor = getGroupDescriptor(node.path);
    const Icon = descriptor.icon;
    const hasChildren = node.hijos.length > 0;
    const isExpanded = expandedIds.includes(node.id);
    const isSelected = selectedGroupId === node.id;

    return (
        <div className="space-y-1">
            <div
                className={cn(
                    'flex items-center gap-2 rounded-2xl border px-2.5 py-2 transition-colors sm:px-3',
                    isSelected
                        ? 'border-primary bg-primary/8 shadow-sm'
                        : 'border-transparent hover:border-border hover:bg-muted/40'
                )}
                style={{ marginLeft: `${depth * 14}px` }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background"
                        onClick={() => onToggle(node.id)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                ) : (
                    <span className="h-7 w-7" />
                )}

                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => onSelect(node.id)}
                >
                    <div className={cn('rounded-xl p-2', descriptor.iconContainerClass)}>
                        <Icon className={cn('h-4 w-4', descriptor.iconClass)} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{node.nombre}</div>
                        <div className="truncate text-xs text-muted-foreground">{descriptor.label}</div>
                    </div>
                    {hasChildren && (
                        <Badge variant="secondary" className="shrink-0">
                            {node.hijos.length}
                        </Badge>
                    )}
                </button>
            </div>

            {hasChildren && isExpanded && (
                <div className="space-y-1">
                    {node.hijos.map((child) => (
                        <GrupoTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedGroupId={selectedGroupId}
                            expandedIds={expandedIds}
                            onSelect={onSelect}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function GrupoDetallePanel({
    detalle,
    onSelectNode,
    canManageGroups,
    isMutatingGroups,
    onRenameGroup,
    onDeleteGroup,
}: {
    detalle: GrupoDetalle;
    onSelectNode: (nodeId: string) => void;
    canManageGroups: boolean;
    isMutatingGroups: boolean;
    onRenameGroup: (group: ManagedGroupTarget) => void;
    onDeleteGroup: (group: ManagedGroupTarget) => void;
}) {
    const descriptor = getGroupDescriptor(detalle.path);
    const Icon = descriptor.icon;
    const breadcrumbs = detalle.path.split('/').filter(Boolean);
    const canEditGroup = canManageGroups && isEditableAcampantesGroupPath(detalle.path);
    const isAcampantesRoot = isAcampantesRootPath(detalle.path);

    return (
        <div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
            <div className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className={cn('rounded-2xl p-3', descriptor.iconContainerClass)}>
                                <Icon className={cn('h-5 w-5', descriptor.iconClass)} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{detalle.nombre}</h2>
                                <p className="text-sm text-muted-foreground">{descriptor.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge className={descriptor.badgeClass}>{descriptor.label}</Badge>
                            <Badge variant="outline">{detalle.hijos.length} subgrupos directos</Badge>
                            <Badge variant="outline">{detalle.integrantes.length} integrantes</Badge>
                            {detalle.dirigentesACargo.length > 0 && (
                                <Badge variant="outline" className="text-blue-700">
                                    {detalle.dirigentesACargo.length} dirigentes a cargo
                                </Badge>
                            )}
                            {canManageGroups && isAcampantesRoot && (
                                <Badge variant="outline" className="text-green-700">
                                    ABM habilitado para subgrupos directos
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                        {canEditGroup && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={isMutatingGroups} className="flex-1 lg:flex-none">
                                        <MoreVertical className="mr-2 h-4 w-4" />
                                        Gestionar
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onRenameGroup({ id: detalle.id, nombre: detalle.nombre, path: detalle.path })}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Renombrar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => onDeleteGroup({ id: detalle.id, nombre: detalle.nombre, path: detalle.path })}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {detalle.padreId && detalle.padreNombre && (
                            <Button variant="outline" onClick={() => onSelectNode(detalle.padreId!)} className="flex-1 lg:flex-none">
                                Volver a {detalle.padreNombre}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-3 sm:p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Ubicación en el árbol
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={`${crumb}-${index}`} className="flex items-center gap-2">
                                <span className="max-w-full rounded-full bg-background px-3 py-1 shadow-sm">{crumb}</span>
                                {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Subgrupos directos
                        </h3>
                        {detalle.hijos.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                                Este nodo no tiene subgrupos directos.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {detalle.hijos.map((child) => {
                                    const childDescriptor = getGroupDescriptor(child.path);
                                    const ChildIcon = childDescriptor.icon;

                                    return (
                                        <button
                                            key={child.id}
                                            type="button"
                                            onClick={() => onSelectNode(child.id)}
                                            className="flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:px-4"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={cn('rounded-xl p-2', childDescriptor.iconContainerClass)}>
                                                    <ChildIcon className={cn('h-4 w-4', childDescriptor.iconClass)} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">{child.nombre}</div>
                                                    <div className="truncate text-xs text-muted-foreground">{child.path}</div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{child.cantidadHijos}</Badge>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {detalle.dirigentesACargo.length > 0 && (
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Dirigentes a cargo
                            </h3>
                            <MiembrosList miembros={detalle.dirigentesACargo} emptyLabel="No hay dirigentes a cargo vinculados a este grupo." />
                        </section>
                    )}
                </div>

                <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Integrantes del grupo
                    </h3>
                    <MiembrosList miembros={detalle.integrantes} emptyLabel="Este grupo todavía no tiene integrantes vinculados." />
                </section>
            </div>
        </div>
    );
}

function MiembrosList({ miembros, emptyLabel }: { miembros: MiembroGrupo[]; emptyLabel: string }) {
    if (miembros.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                {emptyLabel}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {miembros
                .slice()
                .sort((left, right) => left.nombreMostrar.localeCompare(right.nombreMostrar, 'es', { sensitivity: 'base' }))
                .map((miembro) => (
                    <div key={`${miembro.keycloakId}-${miembro.email}`} className="rounded-2xl border px-3 py-3 sm:px-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <div className="font-medium">{miembro.nombreMostrar}</div>
                                <div className="break-all text-sm text-muted-foreground">{miembro.email}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(miembro.roles ?? []).length > 0 ? (
                                    miembro.roles?.map((rol) => (
                                        <Badge key={`${miembro.keycloakId}-${rol}`} className={ROLE_BADGE_CLASS[rol] ?? 'bg-muted text-foreground'}>
                                            {rol}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="secondary">Sin roles visibles</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
}

function getGroupDescriptor(path: string) {
    const normalizedPath = path.toUpperCase();

    if (normalizedPath.includes('/ACAMPANTES')) {
        return {
            label: normalizedPath.includes('/ACAMPANTES/') ? 'Grupo de acampantes' : 'Rama de acampantes',
            description: 'Nodos donde conviven los acampantes y, si corresponde, la dirigencia a cargo.',
            icon: Tent,
            iconClass: 'text-green-700 dark:text-green-300',
            iconContainerClass: 'bg-green-100 dark:bg-green-950/40',
            badgeClass: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
        };
    }

    if (normalizedPath.includes('/DIRIGENTES')) {
        return {
            label: normalizedPath.includes('/CONSEJO')
                ? 'Consejo'
                : normalizedPath.includes('/BASE')
                    ? 'Base'
                    : 'Dirigencia',
            description: 'Espacios de organización y coordinación de la dirigencia.',
            icon: Shield,
            iconClass: 'text-blue-700 dark:text-blue-300',
            iconContainerClass: 'bg-blue-100 dark:bg-blue-950/40',
            badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
        };
    }

    if (normalizedPath.includes('/PADRES')) {
        return {
            label: 'Padres y tutores',
            description: 'Agrupación de responsables familiares dentro de la estructura.',
            icon: Users,
            iconClass: 'text-amber-700 dark:text-amber-300',
            iconContainerClass: 'bg-amber-100 dark:bg-amber-950/40',
            badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        };
    }

    return {
        label: 'Estructura general',
        description: 'Nodo estructural del árbol organizativo.',
        icon: Users,
        iconClass: 'text-slate-700 dark:text-slate-300',
        iconContainerClass: 'bg-slate-100 dark:bg-slate-900/60',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200',
    };
}

function collectNodeIds(nodes: GrupoArbolNode[]): string[] {
    return nodes.flatMap((node) => [node.id, ...collectNodeIds(node.hijos)]);
}

function findPathIds(nodes: GrupoArbolNode[], targetId: string): string[] {
    for (const node of nodes) {
        if (node.id === targetId) {
            return [node.id];
        }

        const childPath = findPathIds(node.hijos, targetId);
        if (childPath.length > 0) {
            return [node.id, ...childPath];
        }
    }

    return [];
}

function GrupoNombreDialog({
    open,
    title,
    description,
    initialValue = '',
    submitLabel,
    isPending,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    title: string;
    description: string;
    initialValue?: string;
    submitLabel: string;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (nombre: string) => Promise<void>;
}) {
    const [nombre, setNombre] = useState(initialValue);

    useEffect(() => {
        if (open) {
            setNombre(initialValue);
        }
    }, [initialValue, open]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit(nombre);
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => {
            if (!isPending) {
                onOpenChange(nextOpen);
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={(event) => { void handleSubmit(event); }}>
                    <div className="space-y-2">
                        <Label htmlFor="nombre-grupo">Nombre del grupo</Label>
                        <Input
                            id="nombre-grupo"
                            value={nombre}
                            onChange={(event) => setNombre(event.target.value)}
                            placeholder="Ej: ESCUELA"
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || nombre.trim().length === 0}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function isAcampantesRootPath(path: string) {
    return path.toUpperCase() === '/CAS/ACAMPANTES';
}

function isEditableAcampantesGroupPath(path: string) {
    const normalizedPath = path.toUpperCase();
    return normalizedPath.startsWith('/CAS/ACAMPANTES/')
        && normalizedPath.split('/').filter(Boolean).length === 3;
}

function resolveGroupMutationError(error: unknown, fallbackMessage: string) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as {
            response?: {
                data?: unknown;
                status?: number;
            };
        }).response;

        const data = response?.data;

        if (typeof data === 'string' && data.trim().length > 0) {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            const maybeMessage = (data as { message?: unknown; error?: unknown }).message
                ?? (data as { message?: unknown; error?: unknown }).error;

            if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
                return maybeMessage;
            }
        }

        if (response?.status === 403) {
            return 'No tenés permisos para administrar grupos.';
        }
    }

    return fallbackMessage;
}