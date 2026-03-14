/**
 * Schemas de Valibot para el módulo de Equipo de Montaña
 */

import {
  object,
  string,
  number,
  boolean,
  array,
  nullable,
  record,
  picklist,
  type InferOutput
} from 'valibot';

// ============================================
// Enums
// ============================================

/**
 * Nivel de criticidad de un item de equipo
 */
export const CriticidadSchema = picklist(['CRITICO', 'IMPORTANTE', 'NORMAL']);
export type Criticidad = InferOutput<typeof CriticidadSchema>;

export const RequisitoFotoEquipoSchema = object({
  id: number(),
  codigo: string(),
  titulo: string(),
  descripcion: nullable(string()),
  orden: number(),
});

export type RequisitoFotoEquipo = InferOutput<typeof RequisitoFotoEquipoSchema>;

// ============================================
// Schemas de Respuesta - Items y Categorías
// ============================================

/**
 * Item de equipo individual
 */
export const ItemEquipoSchema = object({
  id: number(),
  nombre: string(),
  cantidad: number(),
  obligatorio: boolean(),
  criticidad: CriticidadSchema,
  notas: nullable(string()),
  evitar: nullable(string()),
  orden: number(),
  requiereFoto: boolean(),
  requisitosFoto: array(RequisitoFotoEquipoSchema),
});

export type ItemEquipo = InferOutput<typeof ItemEquipoSchema>;

/**
 * Categoría de equipo con sus items
 */
export const CategoriaEquipoSchema = object({
  id: number(),
  nombre: string(),
  descripcion: nullable(string()),
  orden: number(),
  items: array(ItemEquipoSchema),
});

export type CategoriaEquipo = InferOutput<typeof CategoriaEquipoSchema>;

// ============================================
// Schemas de Progreso
// ============================================

/**
 * Progreso de un item individual
 */
export const ItemProgresoSchema = object({
  completado: boolean(),
  fechaCompletado: nullable(string()),
  fechaActualizacion: nullable(string()),
});

export type ItemProgreso = InferOutput<typeof ItemProgresoSchema>;

/**
 * Progreso completo del usuario en el checklist
 */
export const ProgresoUsuarioSchema = object({
  progreso: record(string(), ItemProgresoSchema),
  totalItems: number(),
  completados: number(),
  criticosFaltantes: number(),
  importantesFaltantes: number(),
});

export type ProgresoUsuario = InferOutput<typeof ProgresoUsuarioSchema>;

// ============================================
// Schemas de Reportes
// ============================================

/**
 * Resumen de progreso de un usuario (para tabla de reportes)
 */
export const ReporteProgresoUsuarioSchema = object({
  usuarioId: number(),
  keycloakId: string(),
  nombreMostrar: nullable(string()),
  email: string(),
  itemsCompletados: number(),
  totalItems: number(),
  porcentaje: number(),
  criticosFaltantes: number(),
  ultimaActualizacion: nullable(string()),
});

export type ReporteProgresoUsuario = InferOutput<typeof ReporteProgresoUsuarioSchema>;

/**
 * Detalle de item con progreso (para modal de detalle)
 */
export const ItemProgresoDetalleSchema = object({
  itemId: number(),
  nombre: string(),
  cantidad: number(),
  criticidad: CriticidadSchema,
  completado: boolean(),
  fechaCompletado: nullable(string()),
  hasFoto: boolean(),
  requiereFoto: boolean(),
  fotosCargadas: number(),
  totalFotosSugeridas: number(),
  requisitosFoto: array(object({
    requisitoId: number(),
    titulo: string(),
    descripcion: nullable(string()),
    hasFoto: boolean(),
    fechaSubida: nullable(string()),
  })),
});

export type ItemProgresoDetalle = InferOutput<typeof ItemProgresoDetalleSchema>;

/**
 * Progreso por categoría (para modal de detalle)
 */
export const CategoriaProgresoSchema = object({
  categoriaId: number(),
  nombre: string(),
  items: array(ItemProgresoDetalleSchema),
  completados: number(),
  total: number(),
});

export type CategoriaProgreso = InferOutput<typeof CategoriaProgresoSchema>;

/**
 * Resumen general de progreso
 */
export const ResumenProgresoSchema = object({
  totalItems: number(),
  completados: number(),
  criticosTotal: number(),
  criticosCompletados: number(),
  importantesTotal: number(),
  importantesCompletados: number(),
  porcentajeGeneral: number(),
});

export type ResumenProgreso = InferOutput<typeof ResumenProgresoSchema>;

/**
 * Detalle completo del progreso de un usuario
 */
export const DetalleProgresoUsuarioSchema = object({
  usuarioId: number(),
  keycloakId: string(),
  nombreMostrar: nullable(string()),
  email: string(),
  categorias: array(CategoriaProgresoSchema),
  resumen: ResumenProgresoSchema,
});

export type DetalleProgresoUsuario = InferOutput<typeof DetalleProgresoUsuarioSchema>;

// ============================================
// Schemas de Fotos
// ============================================

/**
 * Respuesta al subir una foto o consultar info de foto
 */
export const FotoItemResponseSchema = object({
  id: number(),
  itemId: number(),
  requisitoId: number(),
  ancho: number(),
  alto: number(),
  tamanioBytes: number(),
  fechaSubida: string(),
});

export type FotoItemResponse = InferOutput<typeof FotoItemResponseSchema>;

export const FotoCargadaEquipoSchema = object({
  id: number(),
  itemId: number(),
  requisitoId: number(),
  fechaSubida: string(),
});

export type FotoCargadaEquipo = InferOutput<typeof FotoCargadaEquipoSchema>;

// ============================================
// Helpers de UI - Configuración de Criticidad
// ============================================

/**
 * Configuración visual para cada nivel de criticidad
 * Diseño con dots de color en lugar de emojis
 */
export const CRITICIDAD_CONFIG: Record<Criticidad, {
  label: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  pulseAnimation: boolean;
}> = {
  CRITICO: {
    label: 'Crítico',
    dotColor: 'bg-red-500',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    pulseAnimation: true,
  },
  IMPORTANTE: {
    label: 'Importante',
    dotColor: 'bg-orange-500',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    pulseAnimation: false,
  },
  NORMAL: {
    label: 'Normal',
    dotColor: 'bg-gray-400',
    borderColor: 'border-l-gray-200',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    pulseAnimation: false,
  },
};

// ============================================
// Íconos de Categoría
// ============================================

/**
 * Mapeo de nombres de categoría a íconos de Lucide
 */
export const CATEGORIA_ICONS: Record<string, string> = {
  'CALZADO': 'boot',
  'INDUMENTARIA SUPERIOR': 'shirt',
  'INDUMENTARIA INFERIOR': 'pants',
  'RELEVANTES': 'backpack',
  'COCINA': 'utensils',
  'BOTIQUÍN': 'first-aid',
  'EQUIPO OTROS': 'package',
  'ELEMENTOS PERSONALES': 'user',
  'ESPECÍFICOS': 'compass',
};
