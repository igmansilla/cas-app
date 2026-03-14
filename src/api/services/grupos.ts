import { object, string, type InferOutput } from "valibot";
import { client } from "../client";

// Schema para grupo
export const GrupoSchema = object({
    id: string(),
    nombre: string(),
    path: string(),
});

export type Grupo = InferOutput<typeof GrupoSchema>;

export interface GrupoArbolNode {
    id: string;
    nombre: string;
    path: string;
    hijos: GrupoArbolNode[];
}

export interface GrupoResumen {
    id: string;
    nombre: string;
    path: string;
    cantidadHijos: number;
}

export interface MiembroGrupo {
    keycloakId: string;
    email: string;
    nombreMostrar: string;
    roles?: string[];
}

export interface GrupoDetalle {
    id: string;
    nombre: string;
    path: string;
    padreId: string | null;
    padreNombre: string | null;
    hijos: GrupoResumen[];
    integrantes: MiembroGrupo[];
    dirigentesACargo: MiembroGrupo[];
}

export interface SyncGruposResponse {
    gruposSincronizados: number;
    mensaje: string;
}

// Schema para grupo con conteo de subgrupos
export const GrupoConSubgruposSchema = object({
    id: string(),
    nombre: string(),
    path: string(),
    cantidadSubgrupos: string(),
});

export const gruposService = {
    /**
     * Lista todos los grupos.
     */
    listarTodos: async (): Promise<Grupo[]> => {
        const response = await client.get('/grupos');
        return response.data;
    },

    /**
     * Obtiene el árbol jerárquico de grupos.
     */
    listarArbol: async (): Promise<GrupoArbolNode[]> => {
        const response = await client.get('/grupos/arbol');
        return response.data;
    },

    /**
     * Lista los grupos de acampantes.
     */
    listarGruposAcampantes: async (): Promise<Grupo[]> => {
        const response = await client.get('/grupos/acampantes');
        return response.data;
    },

    /**
     * Lista los grupos de dirigentes.
     */
    listarGruposDirigentes: async (): Promise<Grupo[]> => {
        const response = await client.get('/grupos/dirigentes');
        return response.data;
    },

    /**
     * Crea un nuevo grupo de acampantes.
     */
    crearGrupoAcampantes: async (nombre: string): Promise<Grupo> => {
        const response = await client.post('/grupos/acampantes', { nombre });
        return response.data;
    },

    /**
     * Renombra un grupo de acampantes existente.
     */
    actualizarGrupoAcampantes: async (grupoId: string, nombre: string): Promise<Grupo> => {
        const response = await client.put(`/grupos/acampantes/${grupoId}`, { nombre });
        return response.data;
    },

    /**
     * Elimina un grupo de acampantes existente.
     */
    eliminarGrupoAcampantes: async (grupoId: string): Promise<void> => {
        await client.delete(`/grupos/acampantes/${grupoId}`);
    },

    /**
     * Obtiene los grupos de un usuario.
     */
    obtenerGruposUsuario: async (keycloakId: string): Promise<Grupo[]> => {
        const response = await client.get(`/usuarios/keycloak/${encodeURIComponent(keycloakId)}/grupos`);
        return response.data;
    },

    /**
     * Agrega un usuario a un grupo.
     */
    agregarUsuarioAGrupo: async (keycloakId: string, grupoId: string): Promise<void> => {
        await client.post(`/usuarios/keycloak/${encodeURIComponent(keycloakId)}/grupos/${grupoId}`);
    },

    /**
     * Remueve un usuario de un grupo.
     */
    removerUsuarioDeGrupo: async (keycloakId: string, grupoId: string): Promise<void> => {
        await client.delete(`/usuarios/keycloak/${encodeURIComponent(keycloakId)}/grupos/${grupoId}`);
    },

    /**
     * Obtiene los miembros de un grupo.
     */
    obtenerMiembrosGrupo: async (grupoId: string): Promise<MiembroGrupo[]> => {
        const response = await client.get(`/grupos/${grupoId}/miembros`);
        return response.data;
    },

    /**
     * Obtiene el detalle de un grupo con integrantes, dirigentes a cargo y subgrupos directos.
     */
    obtenerDetalleGrupo: async (grupoId: string): Promise<GrupoDetalle> => {
        const response = await client.get(`/grupos/${grupoId}/detalle`);
        return response.data;
    },

    /**
     * Fuerza una sincronización del árbol local de grupos.
     */
    sincronizarGrupos: async (): Promise<SyncGruposResponse> => {
        const response = await client.post('/grupos/sync');
        return response.data;
    },
};
