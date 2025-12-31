import { parse } from "valibot";
import { client } from "../client";
import { UsuarioSchema, type Usuario } from "../schemas/usuario";
import { array } from "valibot";

// Helper schema for list of users if needed, or just map array
// But Valibot parse can handle array checking if we define schema for it or map outside.
// Using explicit array(UsuarioSchema) for list parsing.
const UsuariosSchema = array(UsuarioSchema);

export const usuariosService = {
    obtenerUsuarioActual: async (): Promise<Usuario> => {
        const response = await client.get('/usuarios/yo');
        // Assuming /yo returns the user object directly. 
        // If it follows HAL/HATEOAS, it might be in response.data or response.data._embedded...
        // For now assuming standard JSON.
        return parse(UsuarioSchema, response.data);
    },
    getUsuarios: async (): Promise<Usuario[]> => {
        const response = await client.get("/usuarios");
        // Assuming /usuarios returns an array of users.
        // Or if it is a paged response, we might need to look at data.content or similar.
        // The original code used `followAll("usuarios")` which suggests it might be a collection resource.
        // We'll try to parse response.data as array.

        // If the backend returns HAL with _embedded, we might need to adjust.
        // Assuming standard JSON array for migration simplicity until proven otherwise.

        // Use safe parse or just array map if we are confident.
        // The original used: return userStates.map((s) => parse(UsuarioSchema, s.data));

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
