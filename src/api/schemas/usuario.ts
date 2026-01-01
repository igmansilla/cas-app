import { array, boolean, number, object, optional, string, nullable, type InferOutput } from "valibot";

export const UsuarioSchema = object({
    id: number(), 
    email: string(),
    nombreMostrar: string(), 
    roles: array(string()), 
    estado: string(), 
    urlFoto: optional(nullable(string())),
    perfilCompleto: boolean(),
    
    // Datos de contacto
    telefono: optional(nullable(string())),
    direccion: optional(nullable(string())),
    localidad: optional(nullable(string())),
    
    // Datos personales
    dni: optional(nullable(string())),
    fechaNacimiento: optional(nullable(string())), // ISO date string
    
    // Contacto de emergencia
    contactoEmergenciaNombre: optional(nullable(string())),
    contactoEmergenciaTelefono: optional(nullable(string())),
    contactoEmergenciaRelacion: optional(nullable(string())),
});

export type Usuario = InferOutput<typeof UsuarioSchema>;

// Request para actualizar perfil
export interface ActualizarPerfilRequest {
    telefono?: string;
    direccion?: string;
    localidad?: string;
    fechaNacimiento?: string; // ISO date string YYYY-MM-DD
    dni?: string;
    contactoEmergenciaNombre?: string;
    contactoEmergenciaTelefono?: string;
    contactoEmergenciaRelacion?: string;
}
