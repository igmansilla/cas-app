import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosService } from "../api/services/usuarios";
import type { ActualizarPerfilRequest } from "../api/schemas/usuario";
import { toast } from "sonner";

export function useActualizarPerfil() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: ActualizarPerfilRequest) => 
            usuariosService.actualizarPerfil(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success("Perfil actualizado correctamente");
        },
        onError: (error: Error) => {
            toast.error("Error al actualizar perfil: " + error.message);
        }
    });
}
