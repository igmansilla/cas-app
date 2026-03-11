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
import { CalendarClock, Users, Tent, Shield, Kanban } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const usuariosTabs = ['acampantes', 'grupos', 'asignar', 'reuniones'] as const;

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
        ? 'acampantes'
        : tab ?? 'acampantes';

    // Filtrar solo acampantes para esta vista
    const acampantes = usuarios.filter(u => u.roles.includes('ACAMPANTE'));

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
            search: nextTab === 'acampantes' ? {} : { tab: nextTab },
            replace: true,
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Acampantes y grupos</h1>
                <p className="text-muted-foreground">
                    Gestión de acampantes, jerarquía de grupos, asignaciones y planificación de reuniones.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="text-green-700">
                        {acampantes.length} acampantes
                    </Badge>
                    <Badge variant="outline" className="text-blue-700">
                        {gruposAcampantes.length + gruposDirigentes.length} nodos principales
                    </Badge>
                </div>
            </div>

            {/* Main content with tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className={puedePlanificarReuniones ? 'grid w-full max-w-2xl grid-cols-4' : 'grid w-full max-w-lg grid-cols-3'}>
                    <TabsTrigger value="acampantes" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Acampantes</span>
                    </TabsTrigger>
                    <TabsTrigger value="grupos" className="flex items-center gap-2">
                        <Tent className="w-4 h-4" />
                        <span className="hidden sm:inline">Grupos</span>
                    </TabsTrigger>
                    <TabsTrigger value="asignar" className="flex items-center gap-2">
                        <Kanban className="w-4 h-4" />
                        <span className="hidden sm:inline">Asignar</span>
                    </TabsTrigger>
                    {puedePlanificarReuniones && (
                        <TabsTrigger value="reuniones" className="flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            <span className="hidden sm:inline">Reuniones</span>
                        </TabsTrigger>
                    )}
                </TabsList>

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
