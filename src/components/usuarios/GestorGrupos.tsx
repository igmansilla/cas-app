import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Users, Loader2, Tent, Shield } from 'lucide-react';
import { 
    useGruposAcampantes, 
    useGruposDirigentes,
    useAgregarAGrupo, 
    useRemoverDeGrupo 
} from '../../hooks/useGrupos';
import type { Grupo } from '../../api/services/grupos';

interface GestorGruposProps {
    keycloakId: string;
    gruposActuales: Grupo[];
    rolesUsuario?: string[]; // Para determinar si es dirigente/acampante
}

export function GestorGrupos({ keycloakId, gruposActuales, rolesUsuario = [] }: GestorGruposProps) {
    const { grupos: gruposAcampantes, cargando: cargandoAcampantes } = useGruposAcampantes();
    const { grupos: gruposDirigentes, cargando: cargandoDirigentes } = useGruposDirigentes();
    const agregarMutation = useAgregarAGrupo();
    const removerMutation = useRemoverDeGrupo();

    const isLoading = agregarMutation.isPending || removerMutation.isPending;
    const esDirigente = rolesUsuario.includes('DIRIGENTE');

    // Encontrar grupo actual de acampantes (dentro de /ACAMPANTES/)
    const patrullaActual = gruposActuales.find(g => g.path.toUpperCase().includes('/ACAMPANTES/'));
    
    // Encontrar grupo dirigencial actual (dentro de /DIRIGENTES/)
    const grupoDirigenteActual = gruposActuales.find(g => g.path.toUpperCase().includes('/DIRIGENTES/'));

    const handleCambiarPatrulla = async (nuevoGrupoId: string) => {
        // Si ya tiene una patrulla, primero remover
        if (patrullaActual && patrullaActual.id !== nuevoGrupoId) {
            await removerMutation.mutateAsync({ keycloakId, grupoId: patrullaActual.id });
        }
        // Agregar la nueva
        if (nuevoGrupoId && nuevoGrupoId !== 'none') {
            await agregarMutation.mutateAsync({ keycloakId, grupoId: nuevoGrupoId });
        }
    };

    const handleCambiarGrupoDirigente = async (nuevoGrupoId: string) => {
        // Si ya tiene un grupo dirigente, primero remover
        if (grupoDirigenteActual && grupoDirigenteActual.id !== nuevoGrupoId) {
            await removerMutation.mutateAsync({ keycloakId, grupoId: grupoDirigenteActual.id });
        }
        // Agregar el nuevo
        if (nuevoGrupoId && nuevoGrupoId !== 'none') {
            await agregarMutation.mutateAsync({ keycloakId, grupoId: nuevoGrupoId });
        }
    };

    const handleRemoverPatrulla = async () => {
        if (patrullaActual) {
            await removerMutation.mutateAsync({ keycloakId, grupoId: patrullaActual.id });
        }
    };

    const handleRemoverGrupoDirigente = async () => {
        if (grupoDirigenteActual) {
            await removerMutation.mutateAsync({ keycloakId, grupoId: grupoDirigenteActual.id });
        }
    };

    return (
        <div className="space-y-4">
            {/* Sección Grupo de Acampantes */}
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Tent className="w-4 h-4 text-green-600" />
                    Grupo de Acampantes
                </label>
                <div className="flex gap-2">
                    <Select
                        value={patrullaActual?.id || 'none'}
                        onValueChange={handleCambiarPatrulla}
                        disabled={isLoading || cargandoAcampantes}
                    >
                        <SelectTrigger className="flex-1">
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <SelectValue placeholder="Sin grupo asignado" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground">Sin grupo</span>
                            </SelectItem>
                            {gruposAcampantes.map(grupo => (
                                <SelectItem key={grupo.id} value={grupo.id}>
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {grupo.nombre}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {patrullaActual && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoverPatrulla}
                            disabled={isLoading}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            ×
                        </Button>
                    )}
                </div>
                {patrullaActual && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Tent className="w-3 h-3 mr-1" />
                        {patrullaActual.nombre}
                    </Badge>
                )}
            </div>

            {/* Sección Grupo Dirigencial - Solo visible si es dirigente */}
            {esDirigente && (
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Grupo Dirigencial
                    </label>
                    <div className="flex gap-2">
                        <Select
                            value={grupoDirigenteActual?.id || 'none'}
                            onValueChange={handleCambiarGrupoDirigente}
                            disabled={isLoading || cargandoDirigentes}
                        >
                            <SelectTrigger className="flex-1">
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <SelectValue placeholder="Sin grupo dirigencial" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-muted-foreground">Sin grupo</span>
                                </SelectItem>
                                {gruposDirigentes.map(grupo => (
                                    <SelectItem key={grupo.id} value={grupo.id}>
                                        <span className="flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            {grupo.nombre}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {grupoDirigenteActual && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoverGrupoDirigente}
                                disabled={isLoading}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                ×
                            </Button>
                        )}
                    </div>
                    {grupoDirigenteActual && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Shield className="w-3 h-3 mr-1" />
                            {grupoDirigenteActual.nombre}
                        </Badge>
                    )}
                </div>
            )}

            {/* Mensaje si no hay patrulla */}
            {!patrullaActual && !grupoDirigenteActual && (
                <p className="text-sm text-muted-foreground italic">
                    Seleccioná los grupos que correspondan para esta persona.
                </p>
            )}
        </div>
    );
}
