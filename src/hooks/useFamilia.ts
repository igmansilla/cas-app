import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familiasService } from "../api/services/familias";
import type { CrearFamiliaRequest, UnirseConCodigoRequest } from "../api/schemas/familia";
import { useAuth } from "./useAuth";

/**
 * Hook para obtener la familia del usuario actual.
 */
export function useMiFamilia() {
    const { user } = useAuth();
    
    return useQuery({
        queryKey: ['mi-familia', user?.uid],
        queryFn: familiasService.obtenerMiFamilia,
        enabled: !!user?.uid,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

/**
 * Hook para validar un código de vinculación.
 */
export function useValidarCodigo(codigo: string) {
    return useQuery({
        queryKey: ['validar-codigo', codigo.toUpperCase()],
        queryFn: () => familiasService.validarCodigo(codigo),
        enabled: codigo.length === 6,
        staleTime: 1000 * 30, // 30 segundos
    });
}

/**
 * Hook para crear una familia y asignar al usuario como admin.
 * Invalida la query de mi-familia y currentUser al completar.
 */
export function useCrearFamilia() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: CrearFamiliaRequest) => familiasService.crearConPerfil(data),
        onSuccess: async () => {
            // Invalidar y esperar que se refetch para que los datos estén actualizados
            // antes de navegar (esto actualiza perfilCompleto)
            await queryClient.invalidateQueries({ 
                queryKey: ['currentUser'],
                refetchType: 'all'
            });
            await queryClient.invalidateQueries({ 
                queryKey: ['mi-familia'],
                refetchType: 'all'
            });
        },
    });
}

/**
 * Hook para unirse a una familia con código.
 * Invalida la query de mi-familia y currentUser al completar.
 */
export function useUnirseConCodigo() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: UnirseConCodigoRequest) => familiasService.unirseConCodigo(data),
        onSuccess: async () => {
            // Invalidar y esperar refetch para actualizar perfilCompleto
            await queryClient.invalidateQueries({ 
                queryKey: ['currentUser'],
                refetchType: 'all'
            });
            await queryClient.invalidateQueries({ 
                queryKey: ['mi-familia'],
                refetchType: 'all'
            });
        },
    });
}

/**
 * Hook para regenerar el código de vinculación.
 */
export function useRegenerarCodigo() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (familiaUid: string) => familiasService.regenerarCodigo(familiaUid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mi-familia'] });
        },
    });
}
