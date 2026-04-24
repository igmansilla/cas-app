import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    TablaUsuarios,
    DetalleUsuario,
    AsignadorGruposKanban,
    ArbolGruposPanel,
    PlanificacionReunionesGruposPanel,
} from '../components/usuarios';
import { useUsuariosAdmin } from '../hooks/useUsuariosAdmin';
import { useGruposAcampantes, useGruposDirigentes } from '../hooks/useGrupos';
import { useAuth } from '../hooks/useAuth';
import type { UsuarioAdmin } from '../api/services/usuariosAdmin';
import { CalendarClock, Users, Tent, Shield, Kanban, UserCog } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const usuariosTabs = ['todos', 'acampantes', 'grupos', 'asignar', 'reuniones'] as const;

type UsuariosTab = typeof usuariosTabs[number];
type UsuariosSearch = {
    tab?: UsuariosTab;
};

function isUsuariosTab(value: unknown): value is UsuariosTab {
    return typeof value === 'string' && usuariosTabs.some((tab) => tab === value);
}

export const Route = createFileRoute('/_auth/usuarios')({
    validateSearch: (search: Record<string, unknown>): UsuariosSearch => ({
        tab: isUsuariosTab(search.tab) ? search.tab : undefined,
    }),
    component: AcampantesPage,
});

/**
 * Dashboard de gestión de acampantes y grupos.
 * Accesible por DIRIGENTE y ADMIN.
 */
function AcampantesPage() {
    const navigate = Route.useNavigate();
    const { tab } = Route.useSearch();
    const { hasRole } = useAuth();
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(null);

    const { usuarios, cargando } = useUsuariosAdmin();
    const { grupos: gruposAcampantes } = useGruposAcampantes();
    const { grupos: gruposDirigentes } = useGruposDirigentes();
    const puedePlanificarReuniones = hasRole('dirigente') || hasRole('admin');
    const activeTab: UsuariosTab = tab === 'reuniones' && !puedePlanificarReuniones
        ? 'todos'
        : tab ?? 'todos';
    const tabsListClassName = puedePlanificarReuniones
        ? 'grid h-auto w-full grid-cols-2 gap-1 p-1 sm:max-w-3xl sm:grid-cols-5'
        : 'grid h-auto w-full grid-cols-2 gap-1 p-1 sm:max-w-2xl sm:grid-cols-4';

    // Filtrar solo acampantes para esta vista
    const acampantes = usuarios.filter(u => u.roles.includes('ACAMPANTE'));

    // Contar usuarios sin roles asignados (excluyendo roles internos)
    const sinRol = usuarios.filter(u => u.roles.length === 0);

    useEffect(() => {
        if (tab === 'reuniones' && !puedePlanificarReuniones) {
            navigate({ to: '/usuarios', search: {}, replace: true });
        }
    }, [tab, puedePlanificarReuniones, navigate]);

    const handleTabChange = (nextTab: string) => {
        if (!isUsuariosTab(nextTab)) return;
        if (nextTab === 'reuniones' && !puedePlanificarReuniones) return;

        navigate({
            to: '/usuarios',
            search: nextTab === 'todos' ? {} : { tab: nextTab },
            replace: true,
        });
    };

    return (
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
            {/* Header */}
            <div className="space-y-2 mobile-screen-title">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Usuarios y grupos</h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    Gestión de usuarios, roles, jerarquía de grupos, asignaciones y planificación de reuniones.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="text-indigo-700">
                        {usuarios.length} usuarios totales
                    </Badge>
                    <Badge variant="outline" className="text-green-700">
                        {acampantes.length} acampantes
                    </Badge>
                    {sinRol.length > 0 && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                            {sinRol.length} sin rol
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-blue-700">
                        {gruposAcampantes.length + gruposDirigentes.length} nodos principales
                    </Badge>
                </div>
            </div>

            {/* Main content with tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
                <TabsList className={tabsListClassName}>
                    <TabsTrigger value="todos" className="flex min-h-10 min-w-0 items-center gap-2 px-3 py-2 text-xs sm:text-sm">
                        <UserCog className="w-4 h-4" />
                        <span className="truncate">Todos</span>
                    </TabsTrigger>
                    <TabsTrigger value="acampantes" className="flex min-h-10 min-w-0 items-center gap-2 px-3 py-2 text-xs sm:text-sm">
                        <Users className="w-4 h-4" />
                        <span className="truncate">Acampantes</span>
                    </TabsTrigger>
                    <TabsTrigger value="grupos" className="flex min-h-10 min-w-0 items-center gap-2 px-3 py-2 text-xs sm:text-sm">
                        <Tent className="w-4 h-4" />
                        <span className="truncate">Grupos</span>
                    </TabsTrigger>
                    <TabsTrigger value="asignar" className="flex min-h-10 min-w-0 items-center gap-2 px-3 py-2 text-xs sm:text-sm">
                        <Kanban className="w-4 h-4" />
                        <span className="truncate">Asignar</span>
                    </TabsTrigger>
                    {puedePlanificarReuniones && (
                        <TabsTrigger value="reuniones" className="flex min-h-10 min-w-0 items-center gap-2 px-3 py-2 text-xs sm:text-sm">
                            <CalendarClock className="w-4 h-4" />
                            <span className="truncate">Reuniones</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Todos Tab */}
                <TabsContent value="todos" className="space-y-6">
                    <TablaUsuarios
                        usuarios={usuarios}
                        cargando={cargando}
                        onVerDetalle={setUsuarioSeleccionado}
                        mostrarTodos
                    />
                </TabsContent>

                {/* Acampantes Tab */}
                <TabsContent value="acampantes" className="space-y-6">
                    <TablaUsuarios
                        usuarios={acampantes}
                        cargando={cargando}
                        onVerDetalle={setUsuarioSeleccionado}
                    />
                </TabsContent>

                {/* Grupos Tab */}
                <TabsContent value="grupos" className="space-y-6">
                    <ArbolGruposPanel />
                </TabsContent>

                {/* Asignar Tab - Kanban Drag & Drop */}
                <TabsContent value="asignar" className="space-y-6">
                    <div className="space-y-6">
                        {/* Selector de tipo */}
                        <Tabs defaultValue="acampantes" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="acampantes" className="flex items-center gap-2">
                                    <Tent className="w-4 h-4" />
                                    Acampantes
                                </TabsTrigger>
                                <TabsTrigger value="dirigentes" className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Dirigentes
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="acampantes">
                                <AsignadorGruposKanban tipo="acampantes" />
                            </TabsContent>
                            
                            <TabsContent value="dirigentes">
                                <AsignadorGruposKanban tipo="dirigentes" />
                            </TabsContent>
                        </Tabs>
                    </div>
                </TabsContent>

                {puedePlanificarReuniones && (
                    <TabsContent value="reuniones" className="space-y-6">
                        <PlanificacionReunionesGruposPanel />
                    </TabsContent>
                )}
            </Tabs>

            {/* Detail sheet */}
            <DetalleUsuario
                usuario={usuarioSeleccionado}
                open={!!usuarioSeleccionado}
                onClose={() => setUsuarioSeleccionado(null)}
            />
        </div>
    );
}
