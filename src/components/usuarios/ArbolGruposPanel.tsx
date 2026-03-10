import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import {
    useGrupoDetalle,
    useGruposArbol,
    useSincronizarGrupos,
    type GrupoArbolNode,
    type GrupoDetalle,
    type MiembroGrupo,
} from '../../hooks/useGrupos';
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Shield, Tent, Users } from 'lucide-react';

const ROLE_BADGE_CLASS: Record<string, string> = {
    ADMIN: 'bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900',
    DIRIGENTE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    PADRE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    ACAMPANTE: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
};

export function ArbolGruposPanel() {
    const { arbol, cargando, error, refetch } = useGruposArbol();
    const syncMutation = useSincronizarGrupos();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

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

    return (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-2xl border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold">Jerarquía de grupos</h2>
                        <p className="text-sm text-muted-foreground">
                            Navegación por click sobre la estructura real del campamento.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={handleSync}
                        disabled={syncMutation.isPending}
                    >
                        {syncMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sincronizar
                    </Button>
                </div>

                <div className="max-h-[72vh] overflow-y-auto px-3 py-4">
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

            <section className="rounded-2xl border bg-card shadow-sm">
                {cargandoDetalle ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : detalle ? (
                    <GrupoDetallePanel detalle={detalle} onSelectNode={handleSelectNode} />
                ) : (
                    <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                        Seleccioná un nodo del árbol para ver integrantes, subgrupos y dirigentes a cargo.
                    </div>
                )}
            </section>
        </div>
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
                    'flex items-center gap-2 rounded-2xl border px-3 py-2 transition-colors',
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
}: {
    detalle: GrupoDetalle;
    onSelectNode: (nodeId: string) => void;
}) {
    const descriptor = getGroupDescriptor(detalle.path);
    const Icon = descriptor.icon;
    const breadcrumbs = detalle.path.split('/').filter(Boolean);

    return (
        <div className="space-y-6 px-6 py-5">
            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={cn('rounded-2xl p-3', descriptor.iconContainerClass)}>
                                <Icon className={cn('h-5 w-5', descriptor.iconClass)} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight">{detalle.nombre}</h2>
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
                        </div>
                    </div>

                    {detalle.padreId && detalle.padreNombre && (
                        <Button variant="outline" onClick={() => onSelectNode(detalle.padreId!)}>
                            Volver a {detalle.padreNombre}
                        </Button>
                    )}
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Ubicación en el árbol
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={`${crumb}-${index}`} className="flex items-center gap-2">
                                <span className="rounded-full bg-background px-3 py-1 shadow-sm">{crumb}</span>
                                {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
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
                                            className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-muted/40"
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
                    <div key={`${miembro.keycloakId}-${miembro.email}`} className="rounded-2xl border px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="font-medium">{miembro.nombreMostrar}</div>
                                <div className="text-sm text-muted-foreground">{miembro.email}</div>
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