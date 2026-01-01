import { parse } from "valibot";
import { client } from "../client";
import { UsuarioSchema, type Usuario, type ActualizarPerfilRequest } from "../schemas/usuario";
import { array } from "valibot";

// Helper schema for list of users
const UsuariosSchema = array(UsuarioSchema);

export const usuariosService = {
    obtenerUsuarioActual: async (): Promise<Usuario> => {
        const response = await client.get('/usuarios/yo');
        return parse(UsuarioSchema, response.data);
    },

    actualizarPerfil: async (data: ActualizarPerfilRequest): Promise<Usuario> => {
        const response = await client.patch('/usuarios/yo', data);
        return parse(UsuarioSchema, response.data);
    },

    getUsuarios: async (): Promise<Usuario[]> => {
        const response = await client.get("/usuarios");

        if (Array.isArray(response.data)) {
            return parse(UsuariosSchema, response.data);
        } else if (response.data?._embedded?.usuarios) {
            // HAL fallback
            return parse(UsuariosSchema, response.data._embedded.usuarios);
        }

        return [];
    },

    actualizarRolesUsuario: async (userId: number, roles: string[]): Promise<void> => {
        await client.patch(`/usuarios/${userId}`, {
            roles
        });
    }
}
