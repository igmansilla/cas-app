import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAsignarRol, useRemoverRol, useRolesDisponibles } from '../../hooks/useUsuariosAdmin';
import { Plus, X, Loader2 } from 'lucide-react';

interface GestorRolesProps {
    keycloakId: string;
    rolesActuales: string[];
    readonly?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200',
    DIRIGENTE: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200',
    PADRE: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200',
    ACAMPANTE: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200',
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    DIRIGENTE: 'Dirigente',
    PADRE: 'Padre/Tutor',
    ACAMPANTE: 'Acampante',
};

export function GestorRoles({ keycloakId, rolesActuales, readonly = false }: GestorRolesProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const { data: rolesDisponibles } = useRolesDisponibles();
    const asignarRol = useAsignarRol();
    const removerRol = useRemoverRol();

    const rolesNoAsignados = (rolesDisponibles ?? []).filter(
        rol => !rolesActuales.includes(rol)
    );

    const handleAsignar = async (rol: string) => {
        setIsMenuOpen(false);
        await asignarRol.mutateAsync({ keycloakId, rol });
    };

    const handleRemover = async (rol: string) => {
        await removerRol.mutateAsync({ keycloakId, rol });
    };

    const isLoading = asignarRol.isPending || removerRol.isPending;

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {rolesActuales.map(rol => (
                <Badge 
                    key={rol} 
                    variant="outline" 
                    className={`${ROLE_COLORS[rol] ?? ''} flex items-center gap-1`}
                >
                    {ROLE_LABELS[rol] ?? rol}
                    {!readonly && (
                        <button
                            onClick={() => handleRemover(rol)}
                            disabled={isLoading}
                            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </Badge>
            ))}

            {!readonly && rolesNoAsignados.length > 0 && (
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 px-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Plus className="w-3 h-3" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {rolesNoAsignados.map(rol => (
                            <DropdownMenuItem
                                key={rol}
                                onClick={() => handleAsignar(rol)}
                            >
                                <Badge 
                                    variant="outline" 
                                    className={ROLE_COLORS[rol]}
                                >
                                    {ROLE_LABELS[rol] ?? rol}
                                </Badge>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
