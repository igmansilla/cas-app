import { array, object, string, boolean, number, nullable, optional, type InferOutput } from "valibot";
import { client } from "../client";

// Schema para usuario en el dashboard admin
export const UsuarioAdminSchema = object({
    id: number(),
    keycloakId: string(),
    email: string(),
    nombreMostrar: string(),
    urlFoto: optional(nullable(string())),
    emailVerificado: boolean(),
    roles: array(string()),
    estado: string(),
    perfilCompleto: boolean(),
});

export type UsuarioAdmin = InferOutput<typeof UsuarioAdminSchema>;

// Schema para la respuesta de listado (HATEOAS)
export const UsuariosAdminResponseSchema = object({
    _embedded: optional(object({
        usuarios: array(UsuarioAdminSchema)
    }))
});

export type UsuariosAdminResponse = InferOutput<typeof UsuariosAdminResponseSchema>;

export const usuariosAdminService = {
    /**
     * Lista todos los usuarios para el dashboard de administración.
     * Incluye roles obtenidos de Keycloak.
     */
    listarParaAdmin: async (): Promise<UsuarioAdmin[]> => {
        const response = await client.get('/usuarios/admin');
        const data = response.data;
        
        // Handle HATEOAS response format with _embedded
        if (data._embedded?.usuarios) {
            return data._embedded.usuarios;
        }
        
        // Handle HATEOAS response format with content (Spring HATEOAS)
        if (data.content && Array.isArray(data.content)) {
            return data.content;
        }
        
        // Handle direct array format
        if (Array.isArray(data)) {
            return data;
        }
        
        return [];
    },

    /**
     * Asigna un rol a un usuario.
     */
    asignarRol: async (keycloakId: string, rol: string): Promise<void> => {
        await client.post(`/usuarios/keycloak/${encodeURIComponent(keycloakId)}/roles/${rol.toUpperCase()}`);
    },

    /**
     * Remueve un rol de un usuario.
     */
    removerRol: async (keycloakId: string, rol: string): Promise<void> => {
        await client.delete(`/usuarios/keycloak/${encodeURIComponent(keycloakId)}/roles/${rol.toUpperCase()}`);
    },

    /**
     * Obtiene los roles disponibles del sistema.
     */
    obtenerRolesDisponibles: async (): Promise<string[]> => {
        const response = await client.get('/usuarios/roles-disponibles');
        return response.data;
    }
};
