import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosAdminService } from "../api/services/usuariosAdmin";

/**
 * Hook para listar usuarios en el dashboard de administración.
 */
export function useUsuariosAdmin() {
    const query = useQuery({
        queryKey: ['usuarios-admin'],
        queryFn: usuariosAdminService.listarParaAdmin,
        staleTime: 1000 * 60 * 2, // 2 minutos
    });

    return {
        usuarios: query.data ?? [],
        cargando: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook para obtener los roles disponibles del sistema.
 */
export function useRolesDisponibles() {
    return useQuery({
        queryKey: ['roles-disponibles'],
        queryFn: usuariosAdminService.obtenerRolesDisponibles,
        staleTime: 1000 * 60 * 30, // 30 minutos - roles no cambian seguido
    });
}

/**
 * Hook para asignar un rol a un usuario.
 */
export function useAsignarRol() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ keycloakId, rol }: { keycloakId: string; rol: string }) =>
            usuariosAdminService.asignarRol(keycloakId, rol),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
        },
    });
}

/**
 * Hook para remover un rol de un usuario.
 */
export function useRemoverRol() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ keycloakId, rol }: { keycloakId: string; rol: string }) =>
            usuariosAdminService.removerRol(keycloakId, rol),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
        },
    });
}

/**
 * Helper para verificar si el usuario puede asignar roles.
 * Solo ADMIN o miembros del Consejo pueden hacerlo.
 * NOTA: La verificación real está en el backend, esto es solo para UI.
 */
export function usePuedeAsignarRoles() {
    // Por ahora, cualquier usuario con rol DIRIGENTE puede ver la UI
    // El backend rechazará si no es ADMIN o Consejo
    return { puedeAsignar: true };
}
