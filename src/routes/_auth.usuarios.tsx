import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TablaUsuarios, DetalleUsuario, AsignadorGruposKanban, ArbolGruposPanel } from '../components/usuarios';
import { useUsuariosAdmin } from '../hooks/useUsuariosAdmin';
import { useGruposAcampantes, useGruposDirigentes } from '../hooks/useGrupos';
import type { UsuarioAdmin } from '../api/services/usuariosAdmin';
import { Users, Tent, Shield, Kanban } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export const Route = createFileRoute('/_auth/usuarios')({
    component: AcampantesPage,
});

/**
 * Dashboard de gestión de acampantes y grupos.
 * Accesible por DIRIGENTE y ADMIN.
 */
function AcampantesPage() {
    const [activeTab, setActiveTab] = useState('acampantes');
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(null);

    const { usuarios, cargando } = useUsuariosAdmin();
    const { grupos: gruposAcampantes } = useGruposAcampantes();
    const { grupos: gruposDirigentes } = useGruposDirigentes();

    // Filtrar solo acampantes para esta vista
    const acampantes = usuarios.filter(u => u.roles.includes('ACAMPANTE'));

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Acampantes</h1>
                <p className="text-muted-foreground">
                    Gestión de acampantes, jerarquía de grupos y asignaciones.
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
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
